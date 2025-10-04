<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="text-lg font-bold mb-4">
        {{ isNew ? '➕ Nouvelle entité' : '✏️ Modifier l\'entité' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Nom de l'entité -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Nom de l'entité *</span>
          </label>
          <input
            v-model="localEntity.label"
            type="text"
            placeholder="Ex: John Doe, ACME Corp..."
            class="input input-bordered"
            :class="{ 'input-error': errors.label }"
            required
          />
          <label v-if="errors.label" class="label">
            <span class="label-text-alt text-error">{{ errors.label }}</span>
          </label>
        </div>

        <!-- Type d'entité -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Type d'entité *</span>
          </label>
          <select
            v-model="entityType"
            class="select select-bordered"
            required
          >
            <option value="">-- Sélectionner un type --</option>
            <option value="person">👤 Personne physique</option>
            <option value="organization">🏢 Organisation</option>
            <option value="company">🏭 Entreprise</option>
            <option value="group">👥 Groupe</option>
            <option value="alias">🎭 Pseudonyme</option>
            <option value="other">❓ Autre</option>
          </select>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Description</span>
          </label>
          <textarea
            v-model="localEntity.description"
            placeholder="Description détaillée de l'entité..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- Niveau de confiance -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Niveau de confiance</span>
          </label>
          <select v-model="localEntity.confidence" class="select select-bordered">
            <option value="confirmed">✅ Confirmé</option>
            <option value="probable">🟡 Probable</option>
            <option value="possible">🟠 Possible</option>
            <option value="unknown">❓ Inconnu</option>
          </select>
        </div>

        <!-- Aliases -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Alias / Pseudonymes</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(alias, index) in aliases"
              :key="index"
              class="join w-full"
            >
              <input
                :value="alias"
                @input="updateAlias(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Alias ou pseudonyme"
                class="input input-bordered input-sm join-item flex-1"
              />
              <button
                type="button"
                class="btn btn-sm btn-ghost join-item"
                @click="removeAlias(index)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-block"
              @click="addAlias"
            >
              + Ajouter un alias
            </button>
          </div>
        </div>

        <!-- Entité vérifiée -->
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-3">
            <input
              v-model="isVerified"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">✓ Entité vérifiée</span>
          </label>
        </div>

        <!-- Sources -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Sources ({{ localEntity.sources.length }})</span>
          </label>
          <SourcesListEditor v-model="localEntity.sources" />
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            @click="handleCancel"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isValid"
          >
            {{ isNew ? 'Créer' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop" @click="handleCancel"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import SourcesListEditor from './shared/SourcesListEditor.vue';

const props = defineProps<{
  isOpen: boolean;
  entity: Finding | null;
  existingLabels?: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', entity: Finding): void;
}>();

const isNew = computed(() => !props.entity);

const defaultEntity = (): Finding => ({
  label: '',
  description: '',
  confidence: 'probable' as any,
  sources: [],
  metadata: {
    entityType: '',
    aliases: [],
    isVerified: false,
  },
});

const localEntity = ref<Finding>(defaultEntity());
const errors = ref<Record<string, string>>({});

// Synchroniser avec props
watch(
  () => props.entity,
  (newEntity) => {
    if (newEntity) {
      const cloned = JSON.parse(JSON.stringify(newEntity));
      // S'assurer que metadata existe toujours
      if (!cloned.metadata) {
        cloned.metadata = { entityType: '', aliases: [], isVerified: false };
      }
      localEntity.value = cloned;
    } else {
      localEntity.value = defaultEntity();
    }
    errors.value = {};
  },
  { immediate: true }
);

// Computed properties pour les bindings v-model
const entityType = computed({
  get: () => localEntity.value.metadata?.entityType || '',
  set: (value) => {
    if (!localEntity.value.metadata) {
      localEntity.value.metadata = { entityType: '', aliases: [], isVerified: false };
    }
    localEntity.value.metadata.entityType = value;
  },
});

const aliases = computed(() => localEntity.value.metadata?.aliases || []);

const isVerified = computed({
  get: () => localEntity.value.metadata?.isVerified || false,
  set: (value) => {
    if (!localEntity.value.metadata) {
      localEntity.value.metadata = { entityType: '', aliases: [], isVerified: false };
    }
    localEntity.value.metadata.isVerified = value;
  },
});

// Validation
const isValid = computed(() => {
  return (
    localEntity.value.label.trim() !== '' &&
    localEntity.value.metadata?.entityType !== ''
  );
});

function validateUniqueness(): boolean {
  if (!props.existingLabels) return true;
  
  const isDuplicate = props.existingLabels.some(
    label => label.toLowerCase() === localEntity.value.label.toLowerCase().trim()
  );
  
  if (isDuplicate && isNew.value) {
    errors.value.label = 'Une entité avec ce nom existe déjà';
    return false;
  }
  
  return true;
}

function addAlias() {
  if (!localEntity.value.metadata) {
    localEntity.value.metadata = { entityType: '', aliases: [], isVerified: false };
  }
  if (!localEntity.value.metadata.aliases) {
    localEntity.value.metadata.aliases = [];
  }
  localEntity.value.metadata.aliases.push('');
}

function updateAlias(index: number, value: string) {
  if (localEntity.value.metadata?.aliases) {
    localEntity.value.metadata.aliases[index] = value;
  }
}

function removeAlias(index: number) {
  if (localEntity.value.metadata?.aliases) {
    localEntity.value.metadata.aliases.splice(index, 1);
  }
}

function handleSubmit() {
  errors.value = {};
  
  if (!validateUniqueness()) {
    return;
  }
  
  if (!isValid.value) {
    errors.value.label = 'Le nom est requis';
    return;
  }
  
  // Nettoyer les alias vides
  if (localEntity.value.metadata?.aliases) {
    localEntity.value.metadata.aliases = localEntity.value.metadata.aliases.filter(
      (a: string) => a.trim() !== ''
    );
  }
  
  emit('save', localEntity.value);
}

function handleCancel() {
  errors.value = {};
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
