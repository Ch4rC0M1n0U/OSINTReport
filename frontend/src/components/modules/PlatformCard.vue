<template>
  <div class="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
    <div class="card-body p-4">
      <!-- En-tête -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-2xl">{{ platformIcon }}</span>
            <h4 class="font-semibold truncate">{{ profile.label }}</h4>
          </div>
          
          <div class="flex items-center gap-2 flex-wrap">
            <span class="badge badge-sm badge-primary">
              {{ platformLabel }}
            </span>
            <ConfidenceBadge :level="profile.confidence || 'unknown'" />
            <span
              v-if="accountStatus"
              class="badge badge-sm"
              :class="accountStatusClass"
            >
              {{ accountStatusLabel }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
            <span>⋮</span>
          </label>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
            <li>
              <a @click.prevent="$emit('edit')">
                <span>✏️</span>
                <span>Modifier</span>
              </a>
            </li>
            <li>
              <a @click.prevent="$emit('duplicate')">
                <span>📋</span>
                <span>Dupliquer</span>
              </a>
            </li>
            <li class="border-t border-base-300 mt-1 pt-1">
              <a @click.prevent="confirmDelete" class="text-error">
                <span>🗑️</span>
                <span>Supprimer</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Description -->
      <p v-if="profile.description" class="text-sm text-base-content/80 line-clamp-2 mt-2">
        {{ profile.description }}
      </p>

      <!-- ========== SECTION HLR ========== -->
      <div v-if="isHLR" class="mt-3 bg-base-200 rounded-lg p-3 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Statut de la ligne -->
          <span 
            class="badge gap-1"
            :class="{
              'badge-success': hlrLiveStatus === 'live',
              'badge-error': hlrLiveStatus === 'dead',
              'badge-ghost': hlrLiveStatus === 'unknown' || !hlrLiveStatus
            }"
          >
            <span v-if="hlrLiveStatus === 'live'">🟢</span>
            <span v-else-if="hlrLiveStatus === 'dead'">🔴</span>
            <span v-else>⚪</span>
            {{ hlrLiveStatus === 'live' ? 'ACTIVE' : hlrLiveStatus === 'dead' ? 'INACTIVE' : 'INCONNU' }}
          </span>
          
          <!-- Opérateur -->
          <span v-if="hlrOperator" class="badge badge-outline gap-1">
            📡 {{ hlrOperator }}
          </span>
          
          <!-- Pays -->
          <span v-if="hlrCountry" class="badge badge-outline gap-1">
            🌍 {{ hlrCountry }}
          </span>
        </div>
        
        <!-- Date de vérification -->
        <div v-if="hlrVerificationDate" class="text-xs text-base-content/60">
          📅 Vérifié le {{ formatDate(hlrVerificationDate) }}
        </div>
      </div>

      <!-- ========== SECTION CALLERID ========== -->
      <div v-if="isCallerID" class="mt-3 bg-base-200 rounded-lg p-3 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Nom identifié -->
          <span v-if="callerIdName" class="badge badge-info gap-1">
            👤 {{ callerIdName }}
          </span>
          
          <!-- Source -->
          <span v-if="callerIdSource" class="badge badge-outline gap-1">
            📱 {{ callerIdSource }}
          </span>
        </div>
      </div>

      <!-- ========== SECTION SNAPCHAT ========== -->
      <div v-if="isSnapchat" class="mt-3 bg-warning/10 border border-warning/30 rounded-lg p-3 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Username -->
          <span v-if="snapchatUsername" class="badge badge-warning gap-1">
            @{{ snapchatUsername }}
          </span>
          
          <!-- Display Name -->
          <span v-if="snapchatDisplayName && snapchatDisplayName !== profile.label" class="badge badge-outline gap-1">
            {{ snapchatDisplayName }}
          </span>
          
          <!-- Tier -->
          <span v-if="snapchatTier" class="badge badge-ghost gap-1 text-xs">
            ⭐ Tier {{ snapchatTier }}
          </span>
        </div>
        
        <!-- Identifiants techniques -->
        <div class="flex flex-wrap gap-2 text-xs">
          <div v-if="snapchatId" class="flex items-center gap-1 bg-base-200 px-2 py-1 rounded font-mono">
            <span class="text-base-content/60">🆔</span>
            <span class="truncate max-w-[150px]" :title="snapchatId">{{ snapchatId.substring(0, 8) }}...</span>
          </div>
          <div v-if="snapchatBitmojiAvatarId" class="flex items-center gap-1 bg-base-200 px-2 py-1 rounded font-mono">
            <span class="text-base-content/60">🎭</span>
            <span class="truncate max-w-[100px]" :title="snapchatBitmojiAvatarId">{{ snapchatBitmojiAvatarId }}</span>
          </div>
        </div>
      </div>

      <!-- ========== SECTION WHATSAPP ========== -->
      <div v-if="isWhatsApp" class="mt-3 bg-success/10 border border-success/30 rounded-lg p-3 space-y-2">
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Statut numéro -->
          <span 
            class="badge gap-1"
            :class="whatsappNumberExists ? 'badge-success' : 'badge-ghost'"
          >
            {{ whatsappNumberExists ? '✅ Numéro existant' : '❓ Statut inconnu' }}
          </span>
          
          <!-- Lien de vérification -->
          <a 
            v-if="whatsappVerificationLink"
            :href="whatsappVerificationLink"
            target="_blank"
            class="btn btn-xs btn-ghost gap-1 text-success hover:bg-success/20"
            title="Vérifier le numéro sur WhatsApp Web (aucun message ne sera envoyé)"
          >
            🔍 Vérifier
          </a>
        </div>
        
        <!-- Statut texte -->
        <div v-if="whatsappStatus" class="text-sm italic text-base-content/80 border-l-2 border-success/50 pl-2">
          "{{ whatsappStatus }}"
        </div>
        
        <!-- Date du statut -->
        <div v-if="whatsappStatusSetAt" class="text-xs text-base-content/60">
          📅 Statut mis à jour le {{ formatDate(whatsappStatusSetAt) }}
        </div>
      </div>

      <!-- ========== SECTION BREACH ========== -->
      <div v-if="isBreach" class="mt-3 bg-error/10 border border-error/30 rounded-lg p-3">
        <div class="flex items-center gap-2 text-error">
          <span>⚠️</span>
          <span class="font-medium text-sm">Données compromises</span>
        </div>
        <div v-if="breachSource" class="text-xs text-base-content/60 mt-1">
          Source: {{ breachSource }}
        </div>
      </div>

      <!-- Capture d'écran -->
      <div v-if="screenshot" class="mt-3">
        <img
          :src="screenshot"
          alt="Capture du profil"
          class="w-full h-32 object-cover rounded-lg border border-base-300 cursor-pointer hover:opacity-80 transition-opacity"
          @click="openScreenshot"
        />
      </div>

      <!-- Métadonnées (réseaux sociaux uniquement) -->
      <div v-if="hasMetadata && !isHLR && !isCallerID && !isBreach" class="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div v-if="lastActive" class="flex items-center gap-1">
          <span class="text-base-content/60">📅</span>
          <span>{{ formatDate(lastActive) }}</span>
        </div>
        
        <div v-if="followers !== undefined && followers > 0" class="flex items-center gap-1">
          <span class="text-base-content/60">👥</span>
          <span>{{ formatNumber(followers) }}</span>
        </div>
      </div>

      <!-- URL -->
      <div v-if="profileUrl" class="mt-2">
        <a
          :href="profileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="link link-primary text-xs truncate block"
        >
          🔗 {{ profileUrl }}
        </a>
      </div>

      <!-- Entités liées -->
      <div v-if="hasRelatedEntities" class="mt-3">
        <div class="text-xs text-base-content/60 mb-1">Entités liées :</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(entity, index) in displayedRelatedEntities"
            :key="index"
            class="badge badge-sm badge-ghost"
          >
            👤 {{ entity }}
          </span>
          <span
            v-if="remainingEntitiesCount > 0"
            class="badge badge-sm badge-ghost"
          >
            +{{ remainingEntitiesCount }}
          </span>
        </div>
      </div>

      <!-- Sources -->
      <div v-if="profile.sources.length > 0" class="flex items-center gap-2 mt-3 text-xs text-base-content/60">
        <span>📎</span>
        <span>{{ profile.sources.length }} source{{ profile.sources.length > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Finding } from '@/services/api/reports';
import ConfidenceBadge from './shared/ConfidenceBadge.vue';

const props = defineProps<{
  profile: Finding;
  maxRelatedEntities?: number;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'duplicate'): void;
  (e: 'delete'): void;
}>();

const platformIcon = computed(() => {
  const platform = props.profile.metadata?.platform;
  const icons: Record<string, string> = {
    facebook: '📘',
    instagram: '📷',
    twitter: '🐦',
    linkedin: '💼',
    tiktok: '🎵',
    snapchat: '👻',
    telegram: '✈️',
    whatsapp: '💬',
    youtube: '📹',
    reddit: '🤖',
    discord: '🎮',
    hlr: '📶',
    callerid: '📇',
    breach: '🔓',
    other: '📱',
  };
  return icons[platform || 'other'] || '📱';
});

const platformLabel = computed(() => {
  const platform = props.profile.metadata?.platform;
  const labels: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'X (Twitter)',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    snapchat: 'Snapchat',
    telegram: 'Telegram',
    whatsapp: 'WhatsApp',
    youtube: 'YouTube',
    reddit: 'Reddit',
    discord: 'Discord',
    hlr: 'HLR Lookup',
    callerid: 'CallerID',
    breach: 'Breach',
    other: 'Autre',
  };
  return labels[platform || 'other'] || 'Autre';
});

const accountStatus = computed(() => props.profile.metadata?.accountStatus);

const accountStatusLabel = computed(() => {
  const status = accountStatus.value;
  const labels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
    deleted: 'Supprimé',
    private: 'Privé',
    compromised: 'Compromis',
    unknown: 'Inconnu',
  };
  return labels[status || 'unknown'] || 'Inconnu';
});

const accountStatusClass = computed(() => {
  const status = accountStatus.value;
  const classes: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-warning',
    suspended: 'badge-error',
    deleted: 'badge-ghost',
    private: 'badge-info',
    compromised: 'badge-error',
    unknown: 'badge-ghost',
  };
  return classes[status || 'unknown'] || 'badge-ghost';
});

// HLR specific
const isHLR = computed(() => props.profile.metadata?.platform === 'hlr');
const hlrLiveStatus = computed(() => props.profile.metadata?.liveStatus);
const hlrOperator = computed(() => props.profile.metadata?.operator);
const hlrCountry = computed(() => props.profile.metadata?.operatorCountry);
const hlrVerificationDate = computed(() => props.profile.metadata?.verificationDate);

// CallerID specific
const isCallerID = computed(() => props.profile.metadata?.platform === 'callerid');
const callerIdSource = computed(() => props.profile.metadata?.callerSource);
const callerIdName = computed(() => props.profile.metadata?.callerName);

// Breach specific
const isBreach = computed(() => props.profile.metadata?.platform === 'breach');
const breachSource = computed(() => props.profile.metadata?.breachSource);

// Snapchat specific
const isSnapchat = computed(() => props.profile.metadata?.platform === 'snapchat');
const snapchatId = computed(() => props.profile.metadata?.snapchatId);
const snapchatUsername = computed(() => props.profile.metadata?.snapchatUsername);
const snapchatDisplayName = computed(() => props.profile.metadata?.snapchatDisplayName);
const snapchatTier = computed(() => props.profile.metadata?.snapchatTier);
const snapchatBitmojiAvatarId = computed(() => props.profile.metadata?.bitmojiAvatarId);

// WhatsApp specific
const isWhatsApp = computed(() => props.profile.metadata?.platform === 'whatsapp');
const whatsappNumberExists = computed(() => props.profile.metadata?.whatsappNumberExists !== false);
const whatsappStatus = computed(() => {
  const status = props.profile.metadata?.whatsappStatus;
  // Nettoyer le statut (enlever les guillemets en trop)
  if (typeof status === 'string') {
    return status.replace(/^"|"$/g, '').trim();
  }
  return status;
});
const whatsappStatusSetAt = computed(() => props.profile.metadata?.whatsappStatusSetAt);

// Lien de vérification WhatsApp - permet de vérifier si un numéro existe sans envoyer de message
const whatsappVerificationLink = computed(() => {
  // Chercher le numéro de téléphone dans les métadonnées ou le label
  const phone = props.profile.metadata?.phone 
    || props.profile.metadata?.phoneNumber
    || props.profile.label?.replace(/\D/g, ''); // Extraire les chiffres du label
  
  if (phone && phone.length >= 8) {
    // Nettoyer le numéro (garder uniquement les chiffres)
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text&type=phone_number&app_absent=0`;
  }
  return null;
});

const lastActive = computed(() => props.profile.metadata?.lastActive);
const followers = computed(() => props.profile.metadata?.followers);
const profileUrl = computed(() => props.profile.metadata?.profileUrl);
const screenshot = computed(() => props.profile.metadata?.screenshot);

const hasMetadata = computed(() => {
  return lastActive.value || (followers.value && followers.value > 0);
});

const hasRelatedEntities = computed(() => {
  return props.profile.relatedEntities && props.profile.relatedEntities.length > 0;
});

const maxRelatedEntitiesToShow = computed(() => props.maxRelatedEntities || 2);

const displayedRelatedEntities = computed(() => {
  if (!hasRelatedEntities.value) return [];
  return props.profile.relatedEntities?.slice(0, maxRelatedEntitiesToShow.value) || [];
});

const remainingEntitiesCount = computed(() => {
  if (!hasRelatedEntities.value) return 0;
  const total = props.profile.relatedEntities?.length || 0;
  return Math.max(0, total - maxRelatedEntitiesToShow.value);
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  
  // Vérifier si l'heure est présente (pas 00:00:00)
  const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
  
  if (hasTime) {
    // Afficher date et heure
    return date.toLocaleString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    // Afficher seulement la date
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function openScreenshot() {
  if (screenshot.value) {
    window.open(screenshot.value, '_blank');
  }
}

function confirmDelete() {
  if (confirm(`Êtes-vous sûr de vouloir supprimer le profil "${props.profile.label}" ?`)) {
    emit('delete');
  }
}
</script>
