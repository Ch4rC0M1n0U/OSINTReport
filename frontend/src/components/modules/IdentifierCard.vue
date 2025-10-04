<template>
  <div class="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
    <div class="card-body p-4">
      <!-- En-tête -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <span class="text-2xl">{{ identifierTypeIcon }}</span>
            <code class="text-sm font-bold truncate">{{ identifier.label }}</code>
            <span class="badge badge-sm badge-primary">
              {{ identifierTypeLabel }}
            </span>
          </div>
          
          <div class="flex items-center gap-2">
            <ConfidenceBadge :level="identifier.confidence || 'unknown'" />
            <span
              v-if="verificationStatus"
              class="badge badge-sm"
              :class="verificationBadgeClass"
            >
              {{ verificationStatusLabel }}
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
      <p v-if="identifier.description" class="text-sm text-base-content/80 line-clamp-2 mt-2">
        {{ identifier.description }}
      </p>

      <!-- Plateformes -->
      <div v-if="hasPlatforms" class="mt-3">
        <div class="text-xs text-base-content/60 mb-1">Plateformes :</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(platform, index) in displayedPlatforms"
            :key="index"
            class="badge badge-sm badge-accent"
          >
            {{ platform }}
          </span>
          <span
            v-if="remainingPlatformsCount > 0"
            class="badge badge-sm badge-ghost"
          >
            +{{ remainingPlatformsCount }}
          </span>
        </div>
      </div>

      <!-- Entités liées -->
      <div v-if="hasRelatedEntities" class="mt-2">
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
      <div v-if="identifier.sources.length > 0" class="flex items-center gap-2 mt-3 text-xs text-base-content/60">
        <span>📎</span>
        <span>{{ identifier.sources.length }} source{{ identifier.sources.length > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Finding } from '@/services/api/reports';
import ConfidenceBadge from './shared/ConfidenceBadge.vue';

const props = defineProps<{
  identifier: Finding;
  maxPlatforms?: number;
  maxRelatedEntities?: number;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'duplicate'): void;
  (e: 'delete'): void;
}>();

const identifierTypeIcon = computed(() => {
  const type = props.identifier.metadata?.identifierType;
  const icons: Record<string, string> = {
    email: '📧',
    phone: '📱',
    username: '👤',
    ip: '🌐',
    crypto: '₿',
    rrn: '🆔',
    other: '❓',
  };
  return icons[type || 'other'] || '❓';
});

const identifierTypeLabel = computed(() => {
  const type = props.identifier.metadata?.identifierType;
  const labels: Record<string, string> = {
    email: 'Email',
    phone: 'Téléphone',
    username: 'Username',
    ip: 'IP',
    crypto: 'Crypto',
    rrn: 'RRN',
    other: 'Autre',
  };
  return labels[type || 'other'] || 'Autre';
});

const verificationStatus = computed(() => {
  return props.identifier.metadata?.verificationStatus;
});

const verificationStatusLabel = computed(() => {
  const status = verificationStatus.value;
  const labels: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    suspended: 'Suspendu',
    deleted: 'Supprimé',
    not_found: 'Non trouvé',
    unknown: 'Inconnu',
  };
  return labels[status || 'unknown'] || 'Inconnu';
});

const verificationBadgeClass = computed(() => {
  const status = verificationStatus.value;
  const classes: Record<string, string> = {
    active: 'badge-success',
    inactive: 'badge-warning',
    suspended: 'badge-error',
    deleted: 'badge-ghost',
    not_found: 'badge-error',
    unknown: 'badge-ghost',
  };
  return classes[status || 'unknown'] || 'badge-ghost';
});

const hasPlatforms = computed(() => {
  return props.identifier.metadata?.platforms && props.identifier.metadata.platforms.length > 0;
});

const maxPlatformsToShow = computed(() => props.maxPlatforms || 3);

const displayedPlatforms = computed(() => {
  if (!hasPlatforms.value) return [];
  return props.identifier.metadata?.platforms?.slice(0, maxPlatformsToShow.value) || [];
});

const remainingPlatformsCount = computed(() => {
  if (!hasPlatforms.value) return 0;
  const total = props.identifier.metadata?.platforms?.length || 0;
  return Math.max(0, total - maxPlatformsToShow.value);
});

const hasRelatedEntities = computed(() => {
  return props.identifier.relatedEntities && props.identifier.relatedEntities.length > 0;
});

const maxRelatedEntitiesToShow = computed(() => props.maxRelatedEntities || 2);

const displayedRelatedEntities = computed(() => {
  if (!hasRelatedEntities.value) return [];
  return props.identifier.relatedEntities?.slice(0, maxRelatedEntitiesToShow.value) || [];
});

const remainingEntitiesCount = computed(() => {
  if (!hasRelatedEntities.value) return 0;
  const total = props.identifier.relatedEntities?.length || 0;
  return Math.max(0, total - maxRelatedEntitiesToShow.value);
});

function confirmDelete() {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'identifiant "${props.identifier.label}" ?`)) {
    emit('delete');
  }
}
</script>
