<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-2xl">
      <h3 class="text-lg font-bold mb-4">
        👤 Insérer une entité
      </h3>

      <!-- Barre de recherche -->
      <div class="form-control mb-4">
        <label class="label">
          <span class="label-text">Rechercher une entité</span>
        </label>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Nom, prénom, organisation..."
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

      <div v-else-if="filteredEntities.length === 0" class="text-center py-8 text-base-content/60">
        <p>Aucune entité trouvée</p>
        <p class="text-sm mt-2">{{ searchQuery ? 'Essayez une autre recherche' : 'Créez d\'abord des entités pour ce rapport' }}</p>
      </div>

      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
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

interface Props {
  isOpen: boolean;
  reportId?: string;
}

interface Emits {
  (e: 'close'): void;
  (e: 'select', entity: Entity): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref('');
const entities = ref<Entity[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

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
    const response = await entitiesApi.list({
      limit: 100,
    });
    entities.value = response.items;
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du chargement des entités';
    console.error('Erreur chargement entités:', err);
  } finally {
    loading.value = false;
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

// Gérer la recherche (debounce si nécessaire)
function handleSearch() {
  // La recherche est en temps réel sur les entités déjà chargées
  // Pas besoin de debounce pour l'instant
}

// Sélectionner une entité
function selectEntity(entity: Entity) {
  emit('select', entity);
  handleClose();
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
