<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">🔍 Recherche d'identifiants</span>
          <span class="badge badge-neutral">{{ findings.length }}</span>
        </div>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary"
          @click="startEditing"
        >
          ✏️ Modifier
        </button>
      </div>

      <!-- Liste des identifiants -->
      <div v-if="findings.length > 0" class="space-y-3">
        <div
          v-for="(finding, index) in findings"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <!-- Identifiant -->
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg font-mono font-bold">{{ finding.label }}</span>
                  <span
                    v-if="finding.metadata?.identifierType"
                    class="badge badge-primary badge-sm"
                  >
                    {{ getIdentifierTypeIcon(finding.metadata.identifierType) }}
                    {{ getIdentifierTypeLabel(finding.metadata.identifierType) }}
                  </span>
                </div>

                <!-- Description -->
                <div v-if="finding.description" class="text-sm opacity-80 mb-2">
                  {{ finding.description }}
                </div>

                <!-- Plateformes trouvées -->
                <div v-if="finding.metadata?.platforms?.length" class="mb-2">
                  <div class="text-xs opacity-70 mb-1">Plateformes:</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(platform, i) in finding.metadata.platforms"
                      :key="i"
                      class="badge badge-accent badge-sm"
                    >
                      {{ platform }}
                    </span>
                  </div>
                </div>

                <!-- Statut de vérification -->
                <div v-if="finding.metadata?.verificationStatus" class="mb-2">
                  <span
                    class="badge badge-sm"
                    :class="getVerificationBadgeClass(finding.metadata.verificationStatus)"
                  >
                    {{ getVerificationStatusLabel(finding.metadata.verificationStatus) }}
                  </span>
                </div>

                <!-- Entités liées -->
                <div v-if="finding.relatedEntities?.length" class="mb-2">
                  <div class="text-xs opacity-70 mb-1">Entités liées:</div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(entity, i) in finding.relatedEntities"
                      :key="i"
                      class="badge badge-ghost badge-sm"
                    >
                      👤 {{ entity }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Niveau de confiance -->
              <ConfidenceBadge :level="(finding.confidence as any) || 'probable'" />
            </div>

            <!-- Sources -->
            <div v-if="finding.sources && finding.sources.length > 0" class="mt-3 pt-3 border-t border-base-300">
              <div class="text-xs opacity-70 mb-2">Sources ({{ finding.sources.length }}):</div>
              <div class="space-y-2">
                <div
                  v-for="(source, sourceIndex) in finding.sources"
                  :key="sourceIndex"
                  class="bg-base-100 rounded p-2 text-sm"
                >
                  <div class="flex items-center gap-2">
                    <span class="badge badge-xs badge-outline">{{ source.type }}</span>
                    <span class="font-mono text-xs truncate">{{ source.value }}</span>
                  </div>
                  <div v-if="source.note" class="text-xs opacity-70 mt-1">{{ source.note }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 opacity-60">
        <div class="text-5xl mb-3">🔍</div>
        <p>Aucun identifiant trouvé</p>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-ghost mt-3"
          @click="startEditing"
        >
          Ajouter un identifiant
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification des identifiants</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Enregistrer
          </button>
        </div>
      </div>

      <!-- Liste des findings en édition -->
      <div class="space-y-4">
        <div
          v-for="(finding, index) in editedFindings"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <div class="flex items-start justify-between gap-2 mb-3">
              <span class="font-semibold">Identifiant #{{ index + 1 }}</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-circle text-error"
                @click="removeFinding(index)"
                title="Supprimer cet identifiant"
              >
                🗑️
              </button>
            </div>

            <!-- Éditeur de finding -->
            <FindingEditor
              v-model="editedFindings[index]"
              :show-metadata="true"
              placeholder="Identifiant (email, IP, téléphone, username...)"
            >
              <template #metadata>
                <!-- Type d'identifiant -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Type d'identifiant</span>
                  </label>
                  <select
                    v-model="finding.metadata!.identifierType"
                    class="select select-bordered select-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="email">📧 Email</option>
                    <option value="phone">📱 Téléphone</option>
                    <option value="ip">🌐 Adresse IP</option>
                    <option value="username">👤 Username</option>
                    <option value="social_handle">💬 Handle social</option>
                    <option value="crypto">₿ Adresse crypto</option>
                    <option value="imei">📱 IMEI</option>
                    <option value="mac">💻 MAC Address</option>
                    <option value="other">❓ Autre</option>
                  </select>
                </div>

                <!-- Plateformes -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Plateformes trouvées</span>
                  </label>
                  <div class="space-y-2">
                    <div
                      v-for="(platform, platformIndex) in (finding.metadata?.platforms || [])"
                      :key="platformIndex"
                      class="join w-full"
                    >
                      <input
                        v-model="finding.metadata!.platforms![platformIndex]"
                        type="text"
                        placeholder="Nom de la plateforme"
                        class="input input-bordered input-sm join-item flex-1"
                      />
                      <button
                        type="button"
                        class="btn btn-sm btn-ghost join-item"
                        @click="removePlatform(index, platformIndex)"
                      >
                        ✕
                      </button>
                    </div>
                    <button
                      type="button"
                      class="btn btn-sm btn-ghost btn-block"
                      @click="addPlatform(index)"
                    >
                      + Ajouter une plateforme
                    </button>
                  </div>
                </div>

                <!-- Statut de vérification -->
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">Statut de vérification</span>
                  </label>
                  <select
                    v-model="finding.metadata!.verificationStatus"
                    class="select select-bordered select-sm"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="verified">✅ Vérifié</option>
                    <option value="pending">⏳ En attente</option>
                    <option value="unverified">❌ Non vérifié</option>
                    <option value="invalid">⚠️ Invalide</option>
                  </select>
                </div>
              </template>
            </FindingEditor>
          </div>
        </div>

        <!-- Bouton ajouter -->
        <button
          type="button"
          class="btn btn-outline btn-block"
          @click="addFinding"
        >
          + Ajouter un identifiant
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { IdentifierLookupPayload, Finding } from '@/services/api/reports';
import ConfidenceBadge from './shared/ConfidenceBadge.vue';
import FindingEditor from './shared/FindingEditor.vue';

const props = withDefaults(
  defineProps<{
    modelValue: IdentifierLookupPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: IdentifierLookupPayload): void;
}>();

// État
const isEditing = ref(false);
const findings = ref<Finding[]>(props.modelValue.findings || []);
const editedFindings = ref<Finding[]>([]);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue.findings || [];
  },
  { deep: true }
);

// Fonctions d'édition
function startEditing() {
  editedFindings.value = JSON.parse(JSON.stringify(findings.value));
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editedFindings.value = [];
}

function saveChanges() {
  findings.value = editedFindings.value;
  emit('update:modelValue', {
    identifierType: props.modelValue.identifierType || 'other',
    identifierValue: props.modelValue.identifierValue || '',
    findings: findings.value,
    notes: props.modelValue.notes
  });
  isEditing.value = false;
}

function addFinding() {
  editedFindings.value.push({
    label: '',
    description: '',
    confidence: 'probable' as any,
    sources: [],
    relatedEntities: [],
    metadata: {
      identifierType: '',
      platforms: [],
      verificationStatus: '',
    },
  });
}

function removeFinding(index: number) {
  editedFindings.value.splice(index, 1);
}

function addPlatform(findingIndex: number) {
  if (!editedFindings.value[findingIndex].metadata) {
    editedFindings.value[findingIndex].metadata = {};
  }
  if (!editedFindings.value[findingIndex].metadata!.platforms) {
    editedFindings.value[findingIndex].metadata!.platforms = [];
  }
  editedFindings.value[findingIndex].metadata!.platforms!.push('');
}

function removePlatform(findingIndex: number, platformIndex: number) {
  if (editedFindings.value[findingIndex].metadata?.platforms) {
    editedFindings.value[findingIndex].metadata!.platforms!.splice(platformIndex, 1);
  }
}

function getIdentifierTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    email: '📧',
    phone: '📱',
    ip: '🌐',
    username: '👤',
    social_handle: '💬',
    crypto: '₿',
    imei: '📱',
    mac: '💻',
  };
  return icons[type] || '🔍';
}

function getIdentifierTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Téléphone',
    ip: 'Adresse IP',
    username: 'Username',
    social_handle: 'Handle social',
    crypto: 'Adresse crypto',
    imei: 'IMEI',
    mac: 'MAC Address',
    other: 'Autre',
  };
  return labels[type] || type;
}

function getVerificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    verified: '✅ Vérifié',
    pending: '⏳ En attente',
    unverified: '❌ Non vérifié',
    invalid: '⚠️ Invalide',
  };
  return labels[status] || status;
}

function getVerificationBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    verified: 'badge-success',
    pending: 'badge-warning',
    unverified: 'badge-error',
    invalid: 'badge-ghost',
  };
  return classes[status] || 'badge-neutral';
}
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
