<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🐘</span>
        <span>Import Elephantastic</span>
      </h3>

      <div class="space-y-4">
        <!-- Instructions -->
        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p class="font-semibold">Format supporté : JSON / JSONL</p>
            <p class="text-sm">Collez le contenu JSON exporté d'Elephantastic ou sélectionnez un fichier.</p>
          </div>
        </div>

        <!-- Tabs: Coller / Fichier -->
        <div class="tabs tabs-boxed">
          <button 
            class="tab" 
            :class="{ 'tab-active': inputMode === 'paste' }"
            @click="inputMode = 'paste'"
          >
            📋 Coller le JSON
          </button>
          <button 
            class="tab" 
            :class="{ 'tab-active': inputMode === 'file' }"
            @click="inputMode = 'file'"
          >
            📁 Importer un fichier
          </button>
        </div>

        <!-- Mode Coller -->
        <div v-if="inputMode === 'paste'" class="form-control">
          <label class="label">
            <span class="label-text">Contenu JSON</span>
            <span class="label-text-alt text-base-content/60">
              {{ recordCount > 0 ? `${recordCount} enregistrement(s) détecté(s)` : '' }}
            </span>
          </label>
          <textarea
            v-model="jsonContent"
            class="textarea textarea-bordered font-mono text-sm h-64"
            :class="{ 'textarea-error': parseError }"
            placeholder='{"schema": "UserAccount", "collection": "Snapchat", ...}'
            @input="parseJsonContent"
          ></textarea>
          <label v-if="parseError" class="label">
            <span class="label-text-alt text-error">{{ parseError }}</span>
          </label>
        </div>

        <!-- Mode Fichier -->
        <div v-if="inputMode === 'file'" class="form-control">
          <label class="label">
            <span class="label-text">Fichier JSON / JSONL</span>
          </label>
          <input
            type="file"
            accept=".json,.jsonl,.txt"
            class="file-input file-input-bordered w-full"
            @change="handleFileSelect"
          />
          <label v-if="selectedFileName" class="label">
            <span class="label-text-alt text-success">
              ✅ {{ selectedFileName }} - {{ recordCount }} enregistrement(s)
            </span>
          </label>
        </div>

        <!-- Aperçu des enregistrements -->
        <div v-if="parsedRecords.length > 0" class="space-y-2">
          <h4 class="font-semibold flex items-center gap-2">
            <span>📋</span>
            <span>Aperçu des données à importer</span>
          </h4>
          
          <div class="max-h-64 overflow-y-auto border border-base-300 rounded-lg">
            <table class="table table-sm table-zebra">
              <thead class="bg-base-200 sticky top-0">
                <tr>
                  <th class="w-8">
                    <input 
                      type="checkbox" 
                      class="checkbox checkbox-sm"
                      :checked="allSelected"
                      :indeterminate="someSelected && !allSelected"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th>Plateforme</th>
                  <th>Label</th>
                  <th>Username</th>
                  <th>Identifiants clés</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(record, index) in parsedRecords" 
                  :key="index"
                  class="hover"
                >
                  <td>
                    <input 
                      type="checkbox" 
                      class="checkbox checkbox-sm"
                      v-model="selectedIndices[index]"
                    />
                  </td>
                  <td>
                    <div class="flex items-center gap-2">
                      <div 
                        class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm"
                        :class="getPlatformTextClass(record.collection)"
                        :style="{ backgroundColor: getPlatformColor(record.collection) }"
                        :title="record.collection"
                      >
                        {{ getPlatformInitials(record.collection) }}
                      </div>
                      <span class="text-sm font-medium">{{ record.collection }}</span>
                    </div>
                  </td>
                  <td class="font-medium">{{ record.label }}</td>
                  <td class="text-base-content/70">
                    {{ record.usernames?.join(', ') || '-' }}
                  </td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="(id, idx) in getKeyIdentifiers(record)" 
                        :key="idx"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-base-200"
                        :title="`${id.label}: ${id.value}`"
                      >
                        <span>{{ id.icon }}</span>
                        <span class="font-mono truncate max-w-[120px]">{{ id.value }}</span>
                      </span>
                      <span v-if="getKeyIdentifiers(record).length === 0" class="text-base-content/40">-</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="text-sm text-base-content/60">
            {{ selectedCount }} / {{ parsedRecords.length }} sélectionné(s)
          </div>
        </div>

        <!-- Options d'import -->
        <div v-if="parsedRecords.length > 0" class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input 
              type="checkbox" 
              v-model="skipDuplicates"
              class="checkbox checkbox-sm"
            />
            <span class="label-text">Ignorer les doublons (même username/plateforme)</span>
          </label>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button
          type="button"
          class="btn btn-ghost"
          @click="handleClose"
        >
          Annuler
        </button>
        <button
          type="button"
          class="btn btn-primary gap-2"
          :disabled="selectedCount === 0"
          @click="handleImport"
        >
          <span>📥</span>
          <span>Importer {{ selectedCount }} profil(s)</span>
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="handleClose"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import { 
  parseElephantasticFile, 
  convertElephantasticRecords,
  type ElephantasticRecord 
} from '@/services/import/elephantastic';

const props = defineProps<{
  isOpen: boolean;
  existingProfiles?: string[]; // Labels des profils existants pour détecter les doublons
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'import', findings: Finding[]): void;
}>();

// État
const inputMode = ref<'paste' | 'file'>('paste');
const jsonContent = ref('');
const selectedFileName = ref('');
const parseError = ref('');
const parsedRecords = ref<ElephantasticRecord[]>([]);
const selectedIndices = ref<Record<number, boolean>>({});
const skipDuplicates = ref(true);

// Computed
const recordCount = computed(() => parsedRecords.value.length);

const selectedCount = computed(() => {
  return Object.values(selectedIndices.value).filter(Boolean).length;
});

const allSelected = computed(() => {
  return parsedRecords.value.length > 0 && selectedCount.value === parsedRecords.value.length;
});

const someSelected = computed(() => {
  return selectedCount.value > 0 && selectedCount.value < parsedRecords.value.length;
});

// Reset quand le modal s'ouvre/ferme
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Reset
    inputMode.value = 'paste';
    jsonContent.value = '';
    selectedFileName.value = '';
    parseError.value = '';
    parsedRecords.value = [];
    selectedIndices.value = {};
  }
});

// Parser le contenu JSON
function parseJsonContent() {
  parseError.value = '';
  parsedRecords.value = [];
  selectedIndices.value = {};
  
  const content = jsonContent.value.trim();
  if (!content) return;
  
  try {
    const records = parseElephantasticFile(content);
    
    if (records.length === 0) {
      parseError.value = 'Aucun enregistrement Elephantastic valide trouvé';
      return;
    }
    
    parsedRecords.value = records;
    
    // Sélectionner tous par défaut
    records.forEach((_, index) => {
      selectedIndices.value[index] = true;
    });
  } catch (e) {
    parseError.value = `Erreur de parsing: ${e instanceof Error ? e.message : 'Format JSON invalide'}`;
  }
}

// Gérer la sélection de fichier
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (!file) return;
  
  selectedFileName.value = file.name;
  parseError.value = '';
  
  try {
    const content = await file.text();
    jsonContent.value = content;
    parseJsonContent();
  } catch (e) {
    parseError.value = `Erreur de lecture du fichier: ${e instanceof Error ? e.message : 'Erreur inconnue'}`;
  }
}

// Toggle sélection de tous
function toggleSelectAll() {
  const newValue = !allSelected.value;
  parsedRecords.value.forEach((_, index) => {
    selectedIndices.value[index] = newValue;
  });
}

// Obtenir les initiales de la plateforme
function getPlatformInitials(collection: string): string {
  const initials: Record<string, string> = {
    snapchat: 'SC',
    google: 'G',
    facebook: 'FB',
    instagram: 'IG',
    twitter: 'TW',
    x: 'X',
    linkedin: 'IN',
    tiktok: 'TT',
    telegram: 'TG',
    whatsapp: 'WA',
    youtube: 'YT',
    discord: 'DC',
    reddit: 'RD',
    // HLR / Téléphonie
    hlrlookup: 'HL',
    hlr: 'HL',
    'hlr lookup': 'HL',
    // CallerID
    eyecon: 'EC',
    callapp: 'CA',
    truecaller: 'TC',
    'sync.me': 'SY',
    sync: 'SY',
    getcontact: 'GC',
    hiya: 'HY',
    // Breaches
    netease: 'NE',
    'netease (2015)': 'NE',
    'linkedin leak': 'LL',
    'adobe leak': 'AD',
    haveibeenpwned: 'HP',
  };
  return initials[collection.toLowerCase()] || collection.substring(0, 2).toUpperCase();
}

// Obtenir la couleur de la plateforme
function getPlatformColor(collection: string): string {
  const colors: Record<string, string> = {
    snapchat: '#FFFC00',
    google: '#4285F4',
    facebook: '#1877F2',
    instagram: '#E4405F',
    twitter: '#1DA1F2',
    x: '#000000',
    linkedin: '#0A66C2',
    tiktok: '#000000',
    telegram: '#0088CC',
    whatsapp: '#25D366',
    youtube: '#FF0000',
    discord: '#5865F2',
    reddit: '#FF4500',
    // HLR / Téléphonie
    hlrlookup: '#6366F1',
    hlr: '#6366F1',
    'hlr lookup': '#6366F1',
    // CallerID
    eyecon: '#8B5CF6',
    callapp: '#EC4899',
    truecaller: '#0088FF',
    'sync.me': '#14B8A6',
    sync: '#14B8A6',
    getcontact: '#F59E0B',
    hiya: '#00C853',
    // Breaches (rouge foncé)
    netease: '#DC2626',
    'netease (2015)': '#DC2626',
    'linkedin leak': '#B91C1C',
    'adobe leak': '#991B1B',
    haveibeenpwned: '#7F1D1D',
  };
  return colors[collection.toLowerCase()] || '#6B7280';
}

// Obtenir la classe de texte pour la plateforme (noir ou blanc selon le fond)
function getPlatformTextClass(collection: string): string {
  // Plateformes avec fond clair qui nécessitent du texte noir
  const lightBackgrounds = ['snapchat', 'getcontact'];
  return lightBackgrounds.includes(collection.toLowerCase()) 
    ? 'text-black' 
    : 'text-white';
}

// Obtenir l'icône de la plateforme (pour autres usages)
function getPlatformIcon(collection: string): string {
  const icons: Record<string, string> = {
    snapchat: '👻',
    google: '🔍',
    facebook: '🔵',
    instagram: '📷',
    twitter: '🐦',
    x: '✖️',
    linkedin: '💼',
    tiktok: '🎵',
    telegram: '📨',
    whatsapp: '📱',
    youtube: '🔴',
    discord: '🎮',
    reddit: '🟠',
    hlrlookup: '📶',
    hlr: '📶',
    eyecon: '👁️',
    callapp: '📞',
    truecaller: '📱',
    netease: '⚠️',
    'netease (2015)': '⚠️',
  };
  return icons[collection.toLowerCase()] || '🌐';
}

// Classe CSS pour le badge de plateforme (pour autres usages)
function getPlatformBadgeClass(collection: string): string {
  const classes: Record<string, string> = {
    snapchat: 'badge-warning',
    google: 'badge-info',
    facebook: 'badge-primary',
    instagram: 'badge-secondary',
    twitter: 'badge-info',
    linkedin: 'badge-primary',
    tiktok: 'badge-accent',
    telegram: 'badge-info',
    hlrlookup: 'badge-secondary',
    hlr: 'badge-secondary',
    eyecon: 'badge-accent',
    callapp: 'badge-accent',
    netease: 'badge-error',
    'netease (2015)': 'badge-error',
  };
  return classes[collection.toLowerCase()] || 'badge-neutral';
}

// Obtenir les identifiants clés pour l'aperçu (retourne un tableau pour affichage structuré)
function getKeyIdentifiers(record: ElephantasticRecord): { icon: string; label: string; value: string }[] {
  const ids: { icon: string; label: string; value: string }[] = [];
  const collection = record.collection.toLowerCase();
  const original = record.original as any;
  
  // === HLR Lookup ===
  if (collection === 'hlrlookup' || collection === 'hlr' || collection === 'hlr lookup') {
    // Statut de la ligne
    if (original?.live_status) {
      const status = original.live_status.toUpperCase();
      const statusIcon = status === 'LIVE' ? '🟢' : status === 'DEAD' ? '🔴' : '⚪';
      ids.push({ icon: statusIcon, label: 'Statut', value: status });
    }
    // Opérateur
    if (original?.current_network_details?.name) {
      ids.push({ icon: '📡', label: 'Opérateur', value: original.current_network_details.name });
    }
    // Pays
    if (original?.current_network_details?.country_name) {
      ids.push({ icon: '🌍', label: 'Pays', value: original.current_network_details.country_name });
    }
    // Type de ligne
    if (original?.telephone_number_type) {
      ids.push({ icon: '📱', label: 'Type', value: original.telephone_number_type });
    }
    return ids;
  }
  
  // === CallerID (Eyecon, CallApp, TrueCaller, etc.) ===
  const callerIdCollections = ['eyecon', 'callapp', 'truecaller', 'sync.me', 'sync', 'hiya', 'getcontact'];
  if (callerIdCollections.includes(collection)) {
    // Nom identifié
    const callerName = original?.user?.name || original?.name;
    if (callerName) {
      ids.push({ icon: '👤', label: 'Nom', value: callerName });
    }
    // Pays
    if (original?.country_name || original?.country) {
      ids.push({ icon: '🌍', label: 'Pays', value: original.country_name || original.country.toUpperCase() });
    }
    // Téléphone
    if (record.phones?.length) {
      ids.push({ icon: '📞', label: 'Tél', value: record.phones[0] });
    }
    return ids;
  }
  
  // === WhatsApp ===
  if (collection === 'whatsapp') {
    if (original?.status) {
      const statusText = original.status.length > 30 ? original.status.substring(0, 30) + '...' : original.status;
      ids.push({ icon: '💬', label: 'Statut', value: statusText.replace(/^"|"$/g, '') });
    }
    if (original?.numberExists !== undefined) {
      ids.push({ icon: original.numberExists ? '✅' : '❌', label: 'Existe', value: original.numberExists ? 'Oui' : 'Non' });
    }
    if (record.phones?.length) {
      ids.push({ icon: '📞', label: 'Tél', value: record.phones[0] });
    }
    return ids;
  }
  
  // === Breaches / Leaks ===
  const breachCollections = ['netease', 'netease (2015)', 'linkedin leak', 'adobe leak', 'haveibeenpwned'];
  if (breachCollections.some(c => collection.includes(c.replace(' ', '').toLowerCase()) || collection === c)) {
    // Email
    if (record.emails?.length) {
      ids.push({ icon: '📧', label: 'Email', value: record.emails[0] });
    }
    // Mot de passe
    if (original?.password) {
      ids.push({ icon: '🔑', label: 'Pass', value: original.password });
    }
    // Domaine
    if (record.hostnames?.length) {
      ids.push({ icon: '🌐', label: 'Domaine', value: record.hostnames[0] });
    }
    return ids;
  }
  
  // === Réseaux sociaux classiques ===
  
  // Snapchat - afficher les infos clés
  if (collection === 'snapchat') {
    if (original?.username) {
      ids.push({ icon: '👤', label: 'User', value: '@' + original.username });
    }
    if (original?.display_name) {
      ids.push({ icon: '🏷️', label: 'Nom', value: original.display_name });
    }
    if (original?.user_id) {
      ids.push({ icon: '🆔', label: 'Snap ID', value: original.user_id.substring(0, 8) + '...' });
    }
    if (original?.tier !== undefined) {
      ids.push({ icon: '⭐', label: 'Tier', value: String(original.tier) });
    }
    if (record.phones?.length) {
      ids.push({ icon: '📞', label: 'Tél', value: record.phones[0] });
    }
    return ids;
  }
  
  if (collection === 'google' && original?.gaiaid) {
    ids.push({ icon: '🆔', label: 'GAIA', value: original.gaiaid });
  }
  if (collection === 'facebook' && (original?.uid || original?.id)) {
    ids.push({ icon: '🆔', label: 'FB ID', value: original.uid || original.id });
  }
  if (collection === 'instagram' && original?.pk) {
    ids.push({ icon: '🆔', label: 'IG PK', value: original.pk });
  }
  if (collection === 'telegram' && original?.user_id) {
    ids.push({ icon: '🆔', label: 'TG ID', value: String(original.user_id) });
  }
  
  // Téléphones
  if (record.phones?.length) {
    ids.push({ icon: '📞', label: 'Tél', value: record.phones[0] });
  }
  
  // Emails
  if (record.emails?.length) {
    ids.push({ icon: '📧', label: 'Email', value: record.emails[0] });
  }
  
  return ids;
}

// Version texte pour compatibilité
function getKeyIdentifiersText(record: ElephantasticRecord): string {
  const ids = getKeyIdentifiers(record);
  if (ids.length === 0) return '-';
  return ids.map(id => `${id.icon} ${id.value}`).join(' | ');
}

// Fermer le modal
function handleClose() {
  emit('close');
}

// Importer les profils sélectionnés
function handleImport() {
  // Filtrer les enregistrements sélectionnés
  const selectedRecords = parsedRecords.value.filter((_, index) => selectedIndices.value[index]);
  
  if (selectedRecords.length === 0) return;
  
  // Convertir en Findings
  let findings = convertElephantasticRecords(selectedRecords);
  
  // Filtrer les doublons si demandé
  if (skipDuplicates.value && props.existingProfiles) {
    const existingLabelsLower = props.existingProfiles.map(l => l.toLowerCase());
    findings = findings.filter(f => !existingLabelsLower.includes(f.label.toLowerCase()));
  }
  
  emit('import', findings);
  emit('close');
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}
</style>
