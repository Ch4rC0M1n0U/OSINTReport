<template>
  <div class="space-y-3">
    <!-- Liste des sources -->
    <div v-if="localSources.length > 0" class="space-y-2">
      <div
        v-for="(source, index) in localSources"
        :key="index"
        class="border border-base-300 rounded-lg p-3 bg-base-200"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 space-y-2">
            <!-- Type et valeur -->
            <div class="flex items-center gap-2">
              <span class="badge badge-sm badge-primary">{{ getSourceTypeLabel(source.type) }}</span>
              <span class="text-sm font-mono truncate">{{ source.value }}</span>
            </div>
            
            <!-- Note -->
            <p v-if="source.note" class="text-xs text-base-content/70">
              {{ source.note }}
            </p>
            
            <!-- Date d'accès -->
            <p v-if="source.accessedAt" class="text-xs text-base-content/50">
              Accès: {{ formatDate(source.accessedAt) }}
            </p>
          </div>

          <!-- Bouton supprimer -->
          <button
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            @click="removeSource(index)"
            title="Supprimer la source"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-4 text-base-content/50 text-sm">
      Aucune source ajoutée
    </div>

    <!-- Bouton ajouter -->
    <button
      type="button"
      class="btn btn-sm btn-ghost btn-block"
      @click="openAddModal"
    >
      + Ajouter une source
    </button>

    <!-- Modal d'ajout de source -->
    <div v-if="isModalOpen" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">Ajouter une source</h3>

        <div class="space-y-3">
          <!-- Type -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Type *</span>
            </label>
            <select v-model="newSource.type" class="select select-bordered select-sm">
              <option value="url">URL</option>
              <option value="document">Document</option>
              <option value="database">Base de données</option>
              <option value="testimony">Témoignage</option>
            </select>
          </div>

          <!-- Valeur -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">{{ getValueLabel(newSource.type) }} *</span>
            </label>
            <input
              v-model="newSource.value"
              type="text"
              :placeholder="getValuePlaceholder(newSource.type)"
              class="input input-bordered input-sm"
            />
          </div>

          <!-- Note -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Note</span>
            </label>
            <textarea
              v-model="newSource.note"
              class="textarea textarea-bordered textarea-sm"
              rows="2"
              placeholder="Note ou contexte..."
            ></textarea>
          </div>

          <!-- Date d'accès -->
          <div v-if="newSource.type === 'url' || newSource.type === 'database'" class="form-control">
            <label class="label">
              <span class="label-text">Date d'accès</span>
            </label>
            <input
              v-model="newSource.accessedAt"
              type="date"
              class="input input-bordered input-sm"
            />
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-sm btn-ghost" @click="closeAddModal">
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-sm btn-primary"
            :disabled="!isSourceValid"
            @click="addSource"
          >
            Ajouter
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeAddModal"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

export interface Source {
  type: 'url' | 'document' | 'database' | 'testimony';
  value: string;
  note?: string;
  accessedAt?: string;
}

const props = defineProps<{
  modelValue: Source[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Source[]): void;
}>();

const localSources = ref<Source[]>([]);
const isModalOpen = ref(false);
const newSource = ref<Source>({
  type: 'url',
  value: '',
  note: '',
  accessedAt: '',
});

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (value) => {
    localSources.value = value || [];
  },
  { immediate: true, deep: true }
);

const isSourceValid = computed(() => {
  return newSource.value.type && newSource.value.value.trim() !== '';
});

function getSourceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    url: 'URL',
    document: 'Document',
    database: 'BDD',
    testimony: 'Témoignage',
  };
  return labels[type] || type;
}

function getValueLabel(type: string): string {
  const labels: Record<string, string> = {
    url: 'URL',
    document: 'Référence du document',
    database: 'Référence BDD',
    testimony: 'Témoin',
  };
  return labels[type] || 'Valeur';
}

function getValuePlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    url: 'https://...',
    document: 'DOC-2024-001',
    database: 'DB-REF-123',
    testimony: 'Nom du témoin',
  };
  return placeholders[type] || '';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

function openAddModal() {
  newSource.value = {
    type: 'url',
    value: '',
    note: '',
    accessedAt: '',
  };
  isModalOpen.value = true;
}

function closeAddModal() {
  isModalOpen.value = false;
}

function addSource() {
  if (!isSourceValid.value) return;
  
  const source: Source = {
    type: newSource.value.type,
    value: newSource.value.value.trim(),
  };
  
  if (newSource.value.note?.trim()) {
    source.note = newSource.value.note.trim();
  }
  
  if (newSource.value.accessedAt) {
    source.accessedAt = newSource.value.accessedAt;
  }
  
  const updated = [...localSources.value, source];
  localSources.value = updated;
  emit('update:modelValue', updated);
  closeAddModal();
}

function removeSource(index: number) {
  const updated = [...localSources.value];
  updated.splice(index, 1);
  localSources.value = updated;
  emit('update:modelValue', updated);
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
