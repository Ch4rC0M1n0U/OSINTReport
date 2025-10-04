<template>
  <div class="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
    <div class="card-body p-4">
      <!-- En-tête -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xl">{{ entityTypeIcon }}</span>
            <h4 class="font-semibold truncate">{{ entity.label }}</h4>
            <span
              v-if="entity.metadata?.isVerified"
              class="badge badge-success badge-sm gap-1"
              title="Entité vérifiée"
            >
              <span>✓</span>
              <span class="hidden sm:inline">Vérifié</span>
            </span>
          </div>
          
          <!-- Type d'entité -->
          <div class="flex items-center gap-2 text-sm text-base-content/70">
            <span class="badge badge-sm badge-ghost">
              {{ entityTypeLabel }}
            </span>
            <ConfidenceBadge :level="entity.confidence || 'unknown'" />
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
      <p v-if="entity.description" class="text-sm text-base-content/80 line-clamp-2 mt-2">
        {{ entity.description }}
      </p>

      <!-- Aliases -->
      <div v-if="hasAliases" class="mt-2">
        <div class="text-xs text-base-content/60 mb-1">Alias :</div>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="(alias, index) in displayedAliases"
            :key="index"
            class="badge badge-sm badge-outline"
          >
            {{ alias }}
          </span>
          <span
            v-if="remainingAliasCount > 0"
            class="badge badge-sm badge-ghost"
          >
            +{{ remainingAliasCount }}
          </span>
        </div>
      </div>

      <!-- Sources -->
      <div v-if="entity.sources.length > 0" class="flex items-center gap-2 mt-3 text-xs text-base-content/60">
        <span>📎</span>
        <span>{{ entity.sources.length }} source{{ entity.sources.length > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Finding } from '@/services/api/reports';
import ConfidenceBadge from './shared/ConfidenceBadge.vue';

const props = defineProps<{
  entity: Finding;
  maxAliases?: number;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'duplicate'): void;
  (e: 'delete'): void;
}>();

const entityTypeIcon = computed(() => {
  const type = props.entity.metadata?.entityType;
  const icons: Record<string, string> = {
    person: '👤',
    organization: '🏢',
    company: '🏭',
    group: '👥',
    alias: '🎭',
    other: '❓',
  };
  return icons[type || 'other'] || '❓';
});

const entityTypeLabel = computed(() => {
  const type = props.entity.metadata?.entityType;
  const labels: Record<string, string> = {
    person: 'Personne',
    organization: 'Organisation',
    company: 'Entreprise',
    group: 'Groupe',
    alias: 'Pseudonyme',
    other: 'Autre',
  };
  return labels[type || 'other'] || 'Autre';
});

const hasAliases = computed(() => {
  return props.entity.metadata?.aliases && props.entity.metadata.aliases.length > 0;
});

const maxAliasesToShow = computed(() => props.maxAliases || 3);

const displayedAliases = computed(() => {
  if (!hasAliases.value) return [];
  return props.entity.metadata?.aliases?.slice(0, maxAliasesToShow.value) || [];
});

const remainingAliasCount = computed(() => {
  if (!hasAliases.value) return 0;
  const total = props.entity.metadata?.aliases?.length || 0;
  return Math.max(0, total - maxAliasesToShow.value);
});

function confirmDelete() {
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'entité "${props.entity.label}" ?`)) {
    emit('delete');
  }
}
</script>
