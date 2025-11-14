<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="text-lg font-bold mb-4">
        👤 Insérer une entité ou une donnée
      </h3>

      <!-- Onglets de sélection -->
      <div class="tabs tabs-boxed mb-4">
        <button
          v-if="props.reportId"
          @click="dataType = 'findings'"
          :class="['tab', dataType === 'findings' && 'tab-active']"
        >
          📊 Éléments du rapport
        </button>
        <button
          @click="dataType = 'entities'"
          :class="['tab', dataType === 'entities' && 'tab-active']"
        >
          👤 Entités système
        </button>
      </div>

      <!-- Barre de recherche -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text">{{ dataType === 'findings' ? 'Rechercher un élément' : 'Rechercher une entité' }}</span>
        </label>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="dataType === 'findings' ? 'Robert Redford, ACME, profil Facebook...' : 'Nom, prénom, organisation...'"
          class="input input-bordered w-full"
          @input="handleSearch"
          ref="searchInputRef"
        />
      </div>

      <!-- Liste des entités disponibles -->
      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="error" class="alert alert-error mb-4">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="displayItems.length === 0" class="text-center py-8 text-base-content/60">
        <p>Aucune donnée trouvée</p>
        <p class="text-sm mt-2">{{ searchQuery ? 'Essayez une autre recherche' : dataType === 'entities' ? 'Créez d\'abord des entités pour ce rapport' : 'Aucune donnée de plateforme disponible' }}</p>
      </div>

      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <!-- Affichage des entités -->
        <template v-if="dataType === 'entities'">
          <button
            v-for="entity in filteredEntities"
            :key="entity.id"
            type="button"
            @click="selectEntity(entity)"
            class="w-full text-left p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors flex items-center gap-3"
          >
            <span class="text-2xl">{{ getEntityIcon(entity.type) }}</span>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ entity.label }}</div>
              <div class="text-sm text-base-content/60">
                {{ getEntityTypeLabel(entity.type) }}
              </div>
              <div v-if="entity.notes" class="text-xs text-base-content/50 truncate mt-1">
                {{ entity.notes }}
              </div>
            </div>
            <span class="badge badge-sm badge-primary">Insérer</span>
          </button>
        </template>

        <!-- Affichage des findings -->
        <template v-else>
          <button
            v-for="(finding, index) in filteredFindings"
            :key="index"
            type="button"
            @click="selectFinding(finding)"
            class="w-full text-left p-3 border border-base-300 rounded-lg hover:bg-base-200 transition-colors flex items-center gap-3"
          >
            <span class="text-2xl">🌐</span>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ finding.label }}</div>
              <div class="text-sm text-base-content/60 line-clamp-2">
                {{ finding.description }}
              </div>
              <div v-if="finding.confidence" class="text-xs mt-1">
                <span class="badge badge-xs" :class="getConfidenceBadgeClass(finding.confidence)">
                  {{ getConfidenceLabel(finding.confidence) }}
                </span>
              </div>
            </div>
            <span class="badge badge-sm badge-secondary">Insérer</span>
          </button>
        </template>
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button type="button" class="btn btn-ghost" @click="handleClose">
          Annuler
        </button>
      </div>
    </div>
    <div class="modal-backdrop" @click="handleClose"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { entitiesApi, type Entity, type EntityType } from '../../services/api/entities';
import type { Finding, ConfidenceLevel } from '../../services/api/reports';
import { reportsApi, type EntitiesPayload } from '../../services/api/reports';

interface Props {
  isOpen: boolean;
  reportId?: string;
  findings?: Finding[]; // Données de plateformes disponibles
}

interface Emits {
  (e: 'close'): void;
  (e: 'select', entity: Entity | Finding, htmlContent?: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref('');
const entities = ref<Entity[]>([]);
const reportFindings = ref<Finding[]>([]); // Éléments dynamiques du rapport (Robert Redford, ACME, etc.)
const loading = ref(false);
const error = ref<string | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const dataType = ref<'entities' | 'findings'>('findings'); // Par défaut: éléments du rapport

// Icônes par type d'entité
const entityIcons: Record<EntityType, string> = {
  PERSON: '👤',
  ORGANIZATION: '🏢',
  TELEPHONE: '📞',
  EMAIL: '📧',
  ACCOUNT: '👤',
  ADDRESS: '📍',
  OTHER: '🏷️',
};

// Labels par type d'entité
const entityTypeLabels: Record<EntityType, string> = {
  PERSON: 'Personne',
  ORGANIZATION: 'Organisation',
  TELEPHONE: 'Téléphone',
  EMAIL: 'Email',
  ACCOUNT: 'Compte',
  ADDRESS: 'Adresse',
  OTHER: 'Autre',
};

// Charger les entités
async function loadEntities() {
  loading.value = true;
  error.value = null;
  
  try {
    // Si on a un reportId, charger les éléments dynamiques du rapport (Finding)
    if (props.reportId) {
      await loadReportFindings();
    } else {
      // Sinon, charger toutes les entités du système
      const response = await entitiesApi.list({
        limit: 100,
      });
      entities.value = response.items;
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des entités';
    console.error('Erreur chargement entités:', err);
  } finally {
    loading.value = false;
  }
}

// Charger tous les Finding (éléments dynamiques) du rapport
async function loadReportFindings() {
  if (!props.reportId) return;
  
  try {
    // 1. Récupérer tous les modules du rapport
    const modules = await reportsApi.listModules(props.reportId);
    
    // 2. Extraire tous les Finding de TOUS les modules
    const allFindings: Finding[] = [];
    
    for (const module of modules) {
      // Module "entities" (👥 Entités concernées / Entités Identifiées)
      if (module.type === 'entities' && module.payload) {
        const payload = module.payload as any;
        if (payload.findings && Array.isArray(payload.findings)) {
          allFindings.push(...payload.findings);
        }
      }
      
      // Module "entity_overview" (👤 Vue d'ensemble d'une entité)
      if (module.type === 'entity_overview' && module.payload) {
        const payload = module.payload as any;
        if (payload.findings && Array.isArray(payload.findings)) {
          allFindings.push(...payload.findings);
        }
      }
      
      // Module "identifier_lookup" (🔎 Recherche d'identifiant)
      if (module.type === 'identifier_lookup' && module.payload) {
        const payload = module.payload as any;
        if (payload.findings && Array.isArray(payload.findings)) {
          allFindings.push(...payload.findings);
        }
      }
      
      // Module "platform_analysis" (🌐 Analyse de plateforme)
      if (module.type === 'platform_analysis' && module.payload) {
        const payload = module.payload as any;
        if (payload.findings && Array.isArray(payload.findings)) {
          allFindings.push(...payload.findings);
        }
      }
    }
    
    console.log(`✅ ${allFindings.length} élément(s) dynamique(s) trouvé(s):`, allFindings.map(f => f.label));
    
    reportFindings.value = allFindings;
  } catch (err: any) {
    console.error('Erreur chargement éléments du rapport:', err);
    throw err;
  }
}

// Filtrer les entités selon la recherche
const filteredEntities = computed(() => {
  if (!searchQuery.value.trim()) {
    return entities.value;
  }
  
  const query = searchQuery.value.toLowerCase();
  return entities.value.filter(entity => 
    entity.label.toLowerCase().includes(query) ||
    entity.type.toLowerCase().includes(query) ||
    (entity.notes && entity.notes.toLowerCase().includes(query))
  );
});

// Filtrer les findings selon la recherche
const filteredFindings = computed(() => {
  // Si on a un reportId, utiliser les Finding du rapport
  const findingsSource = props.reportId ? reportFindings.value : (props.findings || []);
  
  if (findingsSource.length === 0) {
    return [];
  }
  
  if (!searchQuery.value.trim()) {
    return findingsSource;
  }
  
  const query = searchQuery.value.toLowerCase();
  return findingsSource.filter(finding => 
    finding.label.toLowerCase().includes(query) ||
    finding.description.toLowerCase().includes(query)
  );
});

// Liste combinée selon le type sélectionné
const displayItems = computed(() => {
  if (dataType.value === 'entities') {
    return filteredEntities.value;
  } else {
    return filteredFindings.value;
  }
});

// Gérer la recherche (debounce si nécessaire)
function handleSearch() {
  // La recherche est en temps réel sur les entités déjà chargées
  // Pas besoin de debounce pour l'instant
}

// Sélectionner une entité
function selectEntity(entity: Entity) {
  // Décider automatiquement si un tableau est nécessaire
  const needsTable = shouldUseTable(entity);
  
  // Essayer de parser les metadata depuis notes pour récupérer les attachments
  let attachments: string[] = [];
  if (entity.notes) {
    try {
      if (entity.notes.trim().startsWith('{')) {
        const metadata = JSON.parse(entity.notes);
        console.log('📝 Metadata parsed:', metadata);
        if (metadata.attachments && Array.isArray(metadata.attachments)) {
          attachments = metadata.attachments;
          console.log('📎 Attachments trouvés:', attachments);
        } else {
          console.log('⚠️ Pas d\'attachments dans metadata');
        }
      }
    } catch (e) {
      console.log('⚠️ Notes n\'est pas du JSON:', entity.notes);
    }
  } else {
    console.log('⚠️ Pas de notes sur cette entité');
  }
  
  console.log(`🎯 selectEntity: ${entity.label}, needsTable=${needsTable}, attachments=${attachments.length}`);
  
  if (needsTable) {
    // Insérer un tableau structuré HTML avec attachments si disponibles
    emit('select', entity, generateEntityTable(entity, attachments.length > 0 ? attachments : undefined));
  } else {
    // Insérer du texte simple
    emit('select', entity, generateSimpleText(entity));
  }
  handleClose();
}

// Sélectionner un finding
function selectFinding(finding: Finding) {
  console.log('🔍 selectFinding:', finding.label);
  console.log('📎 Attachments dans finding:', finding.attachments);
  
  // Les findings nécessitent toujours un tableau structuré
  emit('select', finding as any, generateFindingTable(finding));
  handleClose();
}

// Déterminer si un tableau est nécessaire
function shouldUseTable(entity: Entity): boolean {
  // Un tableau est nécessaire si :
  // 1. L'entité a des notes longues (>100 caractères)
  // 2. C'est une organisation (plusieurs infos)
  // 3. L'ID est important pour référence
  
  const hasLongNotes = entity.notes && entity.notes.length > 100;
  const isOrganization = entity.type === 'ORGANIZATION';
  
  return hasLongNotes || isOrganization;
}

// Générer du texte simple pour une entité
function generateSimpleText(entity: Entity): string {
  const type = getEntityTypeLabel(entity.type);
  
  if (entity.notes && entity.notes.trim()) {
    return `**${entity.label}** (${type}) : ${entity.notes}`;
  }
  
  return `**${entity.label}** (${type})`;
}

// Générer un tableau HTML structuré pour une entité
function generateEntityTable(entity: Entity, attachments?: string[]): string {
  const rows: string[] = [];
  
  // En-tête avec fond coloré
  rows.push(`<tr><th colspan="2" style="font-weight: 700; padding: 12px; border: 1px solid #cbd5e1; background-color: #8b5cf6; color: white; text-align: center; font-size: 1.1rem;">${getEntityIcon(entity.type)} ${entity.label}</th></tr>`);
  
  rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; width: 35%;">🏷️ Type</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${getEntityTypeLabel(entity.type)}</td></tr>`);
  rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">👤 Nom / Identifiant</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e40af;">${entity.label}</td></tr>`);
  
  // Essayer de parser les métadonnées du champ notes (format JSON)
  let metadata: any = null;
  if (entity.notes) {
    try {
      // Vérifier si notes contient du JSON
      if (entity.notes.trim().startsWith('{')) {
        metadata = JSON.parse(entity.notes);
      }
    } catch (e) {
      // Pas du JSON, afficher comme texte normal
    }
  }
  
  // Afficher les métadonnées si disponibles
  if (metadata) {
    // Aliases
    if (metadata.aliases && Array.isArray(metadata.aliases) && metadata.aliases.length > 0) {
      const aliasesHtml = metadata.aliases.map((a: string) => `<span style="display: inline-block; padding: 4px 10px; margin: 2px; border-radius: 8px; background-color: #e0e7ff; color: #4338ca; font-size: 0.875rem;">${a}</span>`).join(' ');
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🎭 Alias</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${aliasesHtml}</td></tr>`);
    }
    
    // Date de naissance
    if (metadata.dateOfBirth || metadata.personDetails?.dateOfBirth) {
      const dob = metadata.dateOfBirth || metadata.personDetails.dateOfBirth;
      const date = new Date(dob);
      const formatted = date.toLocaleDateString('fr-BE', { year: 'numeric', month: 'long', day: 'numeric' });
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🎂 Né(e) le</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${formatted}</td></tr>`);
    }
    
    // Numéro de Registre National
    if (metadata.nationalRegistryNumber || metadata.personDetails?.nationalRegistryNumber) {
      const rrn = metadata.nationalRegistryNumber || metadata.personDetails.nationalRegistryNumber;
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🆔 RRN</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-family: 'Courier New', monospace; font-weight: 600; color: #dc2626;">${rrn}</td></tr>`);
    }
    
    // Adresse
    if (metadata.physicalAddress || metadata.personDetails?.physicalAddress) {
      const address = metadata.physicalAddress || metadata.personDetails.physicalAddress;
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📍 Adresse</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${address}</td></tr>`);
    }
    
    // Téléphones
    if (metadata.phoneNumbers || metadata.personDetails?.phoneNumbers) {
      const phones = metadata.phoneNumbers || metadata.personDetails.phoneNumbers;
      if (Array.isArray(phones) && phones.length > 0) {
        const phonesHtml = phones.map((phone: string) => `<div style="margin-bottom: 4px;">📞 <a href="tel:${phone}" style="color: #3b82f6; text-decoration: underline;">${phone}</a></div>`).join('');
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📞 Téléphone(s)</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${phonesHtml}</td></tr>`);
      }
    }
    
    // BCE (entreprise)
    if (metadata.bceNumber || metadata.companyDetails?.bceNumber) {
      const bce = metadata.bceNumber || metadata.companyDetails.bceNumber;
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🏛️ N° BCE</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-family: 'Courier New', monospace; font-weight: 600; color: #1e40af;">${bce}</td></tr>`);
    }
    
    // Identifiants liés
    if (metadata.identifiers && Array.isArray(metadata.identifiers) && metadata.identifiers.length > 0) {
      const identifiersHtml = metadata.identifiers.map((id: string) => `<div style="margin-bottom: 4px;">🔗 <span style="font-family: monospace;">${id}</span></div>`).join('');
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🔗 Identifiants liés</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${identifiersHtml}</td></tr>`);
    }
  } else if (entity.notes && entity.notes.trim()) {
    // Afficher notes comme texte si ce n'est pas du JSON
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📝 Notes</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${entity.notes}</td></tr>`);
  }
  
  // Pièces jointes avec miniatures (si fournies)
  if (attachments && attachments.length > 0) {
    const thumbnailsHtml = attachments.map((attachmentUrl: string) => {
      // L'URL est déjà complète (URL signée depuis l'API)
      const imageUrl = attachmentUrl;
      return `<img src="${imageUrl}" alt="Photo ${entity.label}" style="width: 120px; height: 120px; object-fit: cover; display: block; border: 2px solid #e2e8f0; border-radius: 8px;" title="Cliquez pour agrandir" onclick="window.open('${imageUrl}', '_blank')" />`;
    }).join('');
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top;">📷 Photo${attachments.length > 1 ? 's' : ''} / Logo (${attachments.length})</td><td style="padding: 0; border: 1px solid #cbd5e1;">${thumbnailsHtml}</td></tr>`);
  }
  
  rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🔑 ID système</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-family: 'Courier New', monospace; font-size: 0.875rem; color: #64748b;">${entity.id}</td></tr>`);
  
  return `<table style="border-collapse: collapse; border: 2px solid #8b5cf6; width: 100%; margin: 0 0 1.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <tbody>${rows.join('')}</tbody>
  </table>`;
}

// Générer un tableau HTML pour un finding (donnée de plateforme)
function generateFindingTable(finding: Finding): string {
  const rows: string[] = [];
  const meta = finding.metadata as any;
  
  // Icône de plateforme
  const platformIcons: Record<string, string> = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    x: '🐦',
    linkedin: '💼',
    tiktok: '🎵',
    snapchat: '👻',
    telegram: '✈️',
    whatsapp: '💬',
    youtube: '📹',
    reddit: '🤖',
    discord: '🎮',
    other: '🌐'
  };
  const platformIcon = platformIcons[meta?.platform || 'other'] || '🌐';
  
  // En-tête avec fond coloré et plateforme
  const platformName = meta?.platform ? meta.platform.charAt(0).toUpperCase() + meta.platform.slice(1) : 'Profil';
  rows.push(`<tr><th colspan="2" style="font-weight: 700; padding: 12px; border: 1px solid #cbd5e1; background-color: #3b82f6; color: white; text-align: center; font-size: 1.1rem;">${platformIcon} ${platformName} - ${finding.label}</th></tr>`);
  
  // ===== INFORMATIONS SPÉCIFIQUES À LA PLATEFORME =====
  
  // URL du profil (prioritaire)
  if (meta?.profileUrl) {
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; width: 35%;">🔗 URL du profil</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><a href="${meta.profileUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">${meta.profileUrl}</a></td></tr>`);
  }
  
  // Username/Nom du profil
  rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">👤 Nom du profil / Username</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e40af;">${finding.label}</td></tr>`);
  
  // Description / Bio
  if (finding.description) {
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📝 Description / Bio</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${finding.description}</td></tr>`);
  }
  
  // Statut du compte avec badge
  if (meta?.accountStatus) {
    const statusLabels: Record<string, { label: string; color: string; icon: string }> = {
      active: { label: 'Actif', color: '#22c55e', icon: '✅' },
      inactive: { label: 'Inactif', color: '#6b7280', icon: '⭕' },
      suspended: { label: 'Suspendu', color: '#ef4444', icon: '⛔' },
      deleted: { label: 'Supprimé', color: '#64748b', icon: '🗑️' },
      private: { label: 'Privé', color: '#f59e0b', icon: '🔒' },
      unknown: { label: 'Inconnu', color: '#9ca3af', icon: '❓' }
    };
    const status = statusLabels[meta.accountStatus] || statusLabels.unknown;
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">� Statut du compte</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background-color: ${status.color}; color: white; font-size: 0.875rem; font-weight: 600;">${status.icon} ${status.label}</span></td></tr>`);
  }
  
  // Dernière activité
  if (meta?.lastActive) {
    const date = new Date(meta.lastActive);
    const formatted = date.toLocaleString('fr-BE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📅 Dernière activité</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${formatted}</td></tr>`);
  }
  
  // Nombre d'abonnés
  if (meta?.followers !== undefined && meta?.followers !== null) {
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">� Nombre d'abonnés</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #3b82f6;">${meta.followers.toLocaleString('fr-BE')}</td></tr>`);
  }
  
  // Capture d'écran (si disponible)
  if (meta?.screenshot) {
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📸 Capture d'écran</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><span style="color: #22c55e;">✓ Disponible</span></td></tr>`);
  }
  
  // ===== MÉTADONNÉES GÉNÉRALES =====
  
  // Niveau de confiance
  if (finding.confidence) {
    const confidenceColors: Record<ConfidenceLevel, string> = {
      confirmed: '#22c55e',
      probable: '#3b82f6',
      possible: '#f59e0b',
      unknown: '#6b7280'
    };
    const color = confidenceColors[finding.confidence] || '#6b7280';
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">✅ Niveau de confiance</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background-color: ${color}; color: white; font-size: 0.875rem; font-weight: 600;">${getConfidenceLabel(finding.confidence)}</span></td></tr>`);
  }
  
  // Sources avec liens cliquables
  if (finding.sources && finding.sources.length > 0) {
    const sourcesHtml = finding.sources.map((s, idx) => {
      const icon = s.type === 'url' ? '🔗' : s.type === 'document' ? '📄' : s.type === 'database' ? '💾' : '💬';
      if (s.type === 'url') {
        return `<div style="margin-bottom: 8px;">${icon} <a href="${s.value}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${s.value}</a>${s.note ? ` <em style="color: #64748b; font-size: 0.875rem;">(${s.note})</em>` : ''}</div>`;
      }
      return `<div style="margin-bottom: 8px;">${icon} ${s.value}${s.note ? ` <em style="color: #64748b; font-size: 0.875rem;">(${s.note})</em>` : ''}</div>`;
    }).join('');
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📚 Sources</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${sourcesHtml}</td></tr>`);
  }
  
  // ===== MÉTADONNÉES ENRICHIES (PersonDetails, CompanyDetails, etc.) =====
  
  // Type d'entité
  if (meta?.entityType) {
    const typeLabels: Record<string, string> = {
      person: '👤 Personne',
      organization: '🏢 Organisation',
      company: '🏭 Société',
      group: '👥 Groupe',
      alias: '🎭 Alias',
      other: '📌 Autre'
    };
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🏷️ Type d'entité</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${typeLabels[meta.entityType] || meta.entityType}</td></tr>`);
  }
  
  // Statut de vérification
  if (meta?.isVerified !== undefined) {
    const verifiedBadge = meta.isVerified 
      ? '<span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background-color: #22c55e; color: white; font-size: 0.875rem; font-weight: 600;">✓ Vérifié</span>'
      : '<span style="display: inline-block; padding: 4px 12px; border-radius: 12px; background-color: #ef4444; color: white; font-size: 0.875rem; font-weight: 600;">✗ Non vérifié</span>';
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🔐 Statut de vérification</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${verifiedBadge}</td></tr>`);
  }
  
  // Aliases
  if (meta?.aliases && meta.aliases.length > 0) {
    const aliasesHtml = meta.aliases.map((a: string) => `<span style="display: inline-block; padding: 4px 10px; margin: 2px; border-radius: 8px; background-color: #e0e7ff; color: #4338ca; font-size: 0.875rem;">${a}</span>`).join(' ');
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🎭 Aliases / Pseudonymes</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${aliasesHtml}</td></tr>`);
  }
  
  // Détails de personne
  if (meta?.personDetails) {
    const pd = meta.personDetails;
      rows.push(`<tr><td colspan="2" style="font-weight: 700; padding: 10px; border: 1px solid #cbd5e1; background-color: #eff6ff; color: #1e40af;">👤 Informations personnelles</td></tr>`);
      
      if (pd.dateOfBirth) {
        const date = new Date(pd.dateOfBirth);
        const formatted = date.toLocaleDateString('fr-BE', { year: 'numeric', month: 'long', day: 'numeric' });
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">📅 Date de naissance</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${formatted}</td></tr>`);
      }
      
      if (pd.nationalRegistryNumber) {
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">🆔 Numéro de Registre National</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-family: 'Courier New', monospace; font-weight: 600; color: #dc2626;">${pd.nationalRegistryNumber}</td></tr>`);
      }
      
      if (pd.physicalAddress) {
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">📍 Adresse physique</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${pd.physicalAddress}</td></tr>`);
      }
      
      if (pd.phoneNumbers && pd.phoneNumbers.length > 0) {
        const phonesHtml = pd.phoneNumbers.map((phone: string) => `<div style="margin-bottom: 4px;">📞 <a href="tel:${phone}" style="color: #3b82f6; text-decoration: underline;">${phone}</a></div>`).join('');
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">📞 Téléphones</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${phonesHtml}</td></tr>`);
      }
    }
    
    // Détails de société
    if (meta.companyDetails) {
      const cd = meta.companyDetails;
      rows.push(`<tr><td colspan="2" style="font-weight: 700; padding: 10px; border: 1px solid #cbd5e1; background-color: #fef3c7; color: #92400e;">🏢 Informations de société</td></tr>`);
      
      if (cd.bceNumber) {
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">🏛️ N° BCE</td><td style="padding: 10px; border: 1px solid #cbd5e1; font-family: 'Courier New', monospace; font-weight: 600; color: #1e40af;">${cd.bceNumber}</td></tr>`);
      }
      
      if (cd.headquartersAddress) {
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">🏢 Siège social</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${cd.headquartersAddress}</td></tr>`);
      }
      
      if (cd.operationalAddresses && cd.operationalAddresses.length > 0) {
        const addressesHtml = cd.operationalAddresses.map((addr: string) => `<div style="margin-bottom: 4px;">📍 ${addr}</div>`).join('');
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">🏭 Adresses d'exploitation</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${addressesHtml}</td></tr>`);
      }
      
      if (cd.website) {
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">🌐 Site web</td><td style="padding: 10px; border: 1px solid #cbd5e1;"><a href="${cd.website}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${cd.website}</a></td></tr>`);
      }
      
      if (cd.phoneNumbers && cd.phoneNumbers.length > 0) {
        const phonesHtml = cd.phoneNumbers.map((phone: string) => `<div style="margin-bottom: 4px;">📞 <a href="tel:${phone}" style="color: #3b82f6; text-decoration: underline;">${phone}</a></div>`).join('');
        rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; padding-left: 30px;">📞 Téléphones</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${phonesHtml}</td></tr>`);
      }
    }
    
    // Identifiants liés
    if (meta.relatedIdentifiers && meta.relatedIdentifiers.length > 0) {
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">🔗 Identifiants liés</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${meta.relatedIdentifiers.length} identifiant(s)</td></tr>`);
    }
    
    // Plateformes liées
    if (meta.relatedPlatforms && meta.relatedPlatforms.length > 0) {
      rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">📱 Plateformes liées</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${meta.relatedPlatforms.length} plateforme(s)</td></tr>`);
    }
  
  // Pièces jointes avec miniatures
  if (finding.attachments && finding.attachments.length > 0) {
    console.log('🖼️ generateFindingTable: Génération des miniatures');
    console.log('📎 finding.attachments:', finding.attachments);
    console.log('📊 Nombre d\'attachments:', finding.attachments.length);
    
    // Convertir le Proxy en tableau normal
    const attachmentsArray = Array.from(finding.attachments);
    console.log('📋 attachmentsArray:', attachmentsArray);
    
    const thumbnailsHtml = attachmentsArray.map((attachmentUrl: string, index: number) => {
      console.log(`  🔗 [${index}] URL:`, attachmentUrl);
      
      // L'URL est déjà complète (URL signée depuis l'API)
      const imageUrl = attachmentUrl;
      return `<img src="${imageUrl}" alt="Pièce jointe" style="width: 120px; height: 120px; object-fit: cover; display: block; border: 2px solid #e2e8f0; border-radius: 8px;" title="Cliquez pour agrandir" onclick="window.open('${imageUrl}', '_blank')" />`;
    }).join('');
    
    console.log('🎨 HTML généré:', thumbnailsHtml);
    
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top;">📎 Pièces jointes (${finding.attachments.length})</td><td style="padding: 0; border: 1px solid #cbd5e1;">${thumbnailsHtml}</td></tr>`);
  }
  
  // Entités liées
  if (finding.relatedEntities && finding.relatedEntities.length > 0) {
    rows.push(`<tr><td style="font-weight: 600; padding: 10px; border: 1px solid #cbd5e1; background-color: #f8fafc;">👥 Entités liées</td><td style="padding: 10px; border: 1px solid #cbd5e1;">${finding.relatedEntities.length} entité(s)</td></tr>`);
  }
  
  const tableHtml = `<table style="border-collapse: collapse; border: 2px solid #3b82f6; width: 100%; margin: 0 0 1.5rem 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <tbody>${rows.join('')}</tbody>
  </table>`;
  
  console.log('📋 Tableau HTML complet généré pour:', finding.label);
  console.log('📏 Nombre de lignes (rows):', rows.length);
  
  return tableHtml;
}

// Labels pour les niveaux de confiance
function getConfidenceLabel(level: ConfidenceLevel): string {
  const labels: Record<ConfidenceLevel, string> = {
    confirmed: 'Confirmé',
    probable: 'Probable',
    possible: 'Possible',
    unknown: 'Inconnu'
  };
  return labels[level] || level;
}

// Classes CSS pour les badges de confiance
function getConfidenceBadgeClass(level: ConfidenceLevel): string {
  const classes: Record<ConfidenceLevel, string> = {
    confirmed: 'badge-success',
    probable: 'badge-info',
    possible: 'badge-warning',
    unknown: 'badge-neutral'
  };
  return classes[level] || 'badge-neutral';
}

// Fermer le modal
function handleClose() {
  searchQuery.value = '';
  emit('close');
}

// Obtenir l'icône d'une entité
function getEntityIcon(type: EntityType): string {
  return entityIcons[type] || '🏷️';
}

// Obtenir le label d'un type d'entité
function getEntityTypeLabel(type: EntityType): string {
  return entityTypeLabels[type] || 'Autre';
}

// Charger les entités quand le modal s'ouvre
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await loadEntities();
    // Focus sur le champ de recherche
    nextTick(() => {
      searchInputRef.value?.focus();
    });
  }
});
</script>

<style scoped>
/* Styles additionnels si nécessaire */
</style>
