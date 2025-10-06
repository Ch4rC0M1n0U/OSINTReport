<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="text-lg font-bold mb-4">
        {{ isNew ? '➕ Nouvel identifiant' : '✏️ Modifier l\'identifiant' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Type d'identifiant -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Type d'identifiant *</span>
          </label>
          <select
            v-model="identifierType"
            class="select select-bordered"
            required
          >
            <option value="">-- Sélectionner un type --</option>
            <option value="email">📧 Email</option>
            <option value="phone">📱 Téléphone</option>
            <option value="username">👤 Nom d'utilisateur</option>
            <option value="ip">🌐 Adresse IP</option>
            <option value="crypto">₿ Adresse crypto</option>
            <option value="rrn">🆔 Numéro national (RRN)</option>
            <option value="other">❓ Autre</option>
          </select>
        </div>

        <!-- Valeur de l'identifiant -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Identifiant *</span>
          </label>
          <input
            v-model="localIdentifier.label"
            type="text"
            :placeholder="getPlaceholder(identifierType)"
            class="input input-bordered font-mono"
            :class="{ 'input-error': errors.label }"
            required
          />
          <label v-if="errors.label" class="label">
            <span class="label-text-alt text-error">{{ errors.label }}</span>
          </label>
        </div>

        <!-- Description -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Description / Contexte</span>
          </label>
          <textarea
            v-model="localIdentifier.description"
            placeholder="Contexte de découverte, notes d'investigation..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- Niveau de confiance -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Niveau de confiance</span>
          </label>
          <select v-model="localIdentifier.confidence" class="select select-bordered">
            <option value="confirmed">✅ Confirmé</option>
            <option value="probable">🟡 Probable</option>
            <option value="possible">🟠 Possible</option>
            <option value="unknown">❓ Inconnu</option>
          </select>
        </div>

        <!-- Plateformes où trouvé -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Plateformes trouvées</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(platform, index) in platforms"
              :key="index"
              class="join w-full"
            >
              <input
                :value="platform"
                @input="updatePlatform(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Ex: Facebook, Instagram, LinkedIn..."
                class="input input-bordered input-sm join-item flex-1"
              />
              <button
                type="button"
                class="btn btn-sm btn-ghost join-item"
                @click="removePlatform(index)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-block"
              @click="addPlatform"
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
          <select v-model="verificationStatus" class="select select-bordered select-sm">
            <option value="active">✅ Actif</option>
            <option value="inactive">⭕ Inactif</option>
            <option value="suspended">⛔ Suspendu</option>
            <option value="deleted">🗑️ Supprimé</option>
            <option value="not_found">❌ Non trouvé</option>
            <option value="unknown">❓ Inconnu</option>
          </select>
        </div>

        <!-- Entités liées -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Entités liées</span>
          </label>
          <div class="space-y-2">
            <div
              v-for="(entity, index) in relatedEntities"
              :key="index"
              class="join w-full"
            >
              <input
                :value="entity"
                @input="updateRelatedEntity(index, ($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="Nom de l'entité liée..."
                class="input input-bordered input-sm join-item flex-1"
              />
              <button
                type="button"
                class="btn btn-sm btn-ghost join-item"
                @click="removeRelatedEntity(index)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-block"
              @click="addRelatedEntity"
            >
              + Ajouter une entité liée
            </button>
          </div>
        </div>

        <!-- Capture d'écran -->
        <div v-if="reportId" class="form-control">
          <label class="label">
            <span class="label-text">Capture d'écran</span>
          </label>
          <ScreenshotPicker
            v-model="screenshot"
            label="Preuve de l'identifiant"
            :case-id="reportId"
          />
        </div>

        <!-- Sources -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Sources ({{ localIdentifier.sources.length }})</span>
          </label>
          <SourcesListEditor v-model="localIdentifier.sources" />
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
import ScreenshotPicker from '../shared/ScreenshotPicker.vue';

const props = defineProps<{
  isOpen: boolean;
  identifier: Finding | null;
  existingValues?: string[];
  reportId?: string; // UID du rapport pour screenshots
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', identifier: Finding): void;
}>();

const isNew = computed(() => !props.identifier);

const defaultIdentifier = (): Finding => ({
  label: '',
  description: '',
  confidence: 'probable' as any,
  sources: [],
  relatedEntities: [],
  metadata: {
    identifierType: '',
    platforms: [],
    verificationStatus: 'unknown',
  },
});

const localIdentifier = ref<Finding>(defaultIdentifier());
const errors = ref<Record<string, string>>({});

// Screenshot (optionnel)
const screenshot = ref('');

// Synchroniser avec props
watch(
  () => props.identifier,
  (newIdentifier) => {
    if (newIdentifier) {
      const cloned = JSON.parse(JSON.stringify(newIdentifier));
      if (!cloned.metadata) {
        cloned.metadata = { identifierType: '', platforms: [], verificationStatus: 'unknown' };
      }
      if (!cloned.relatedEntities) {
        cloned.relatedEntities = [];
      }
      localIdentifier.value = cloned;
      screenshot.value = cloned.screenshot || '';
    } else {
      localIdentifier.value = defaultIdentifier();
      screenshot.value = '';
    }
    errors.value = {};
  },
  { immediate: true }
);

// Computed properties pour les bindings v-model
const identifierType = computed({
  get: () => localIdentifier.value.metadata?.identifierType || '',
  set: (value) => {
    if (!localIdentifier.value.metadata) {
      localIdentifier.value.metadata = { identifierType: '', platforms: [], verificationStatus: 'unknown' };
    }
    localIdentifier.value.metadata.identifierType = value;
  },
});

const platforms = computed(() => localIdentifier.value.metadata?.platforms || []);

const verificationStatus = computed({
  get: () => localIdentifier.value.metadata?.verificationStatus || 'unknown',
  set: (value) => {
    if (!localIdentifier.value.metadata) {
      localIdentifier.value.metadata = { identifierType: '', platforms: [], verificationStatus: 'unknown' };
    }
    localIdentifier.value.metadata.verificationStatus = value;
  },
});

const relatedEntities = computed(() => localIdentifier.value.relatedEntities || []);

// Validation
const isValid = computed(() => {
  return (
    localIdentifier.value.label.trim() !== '' &&
    localIdentifier.value.metadata?.identifierType !== ''
  );
});

function validateUniqueness(): boolean {
  if (!props.existingValues) return true;
  
  const isDuplicate = props.existingValues.some(
    value => value.toLowerCase() === localIdentifier.value.label.toLowerCase().trim()
  );
  
  if (isDuplicate && isNew.value) {
    errors.value.label = 'Cet identifiant existe déjà dans la liste';
    return false;
  }
  
  return true;
}

function getPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    email: 'exemple@domaine.com',
    phone: '+32 XXX XX XX XX',
    username: '@username',
    ip: '192.168.1.1',
    crypto: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    rrn: 'XX.XX.XX-XXX.XX',
    other: 'Identifiant...',
  };
  return placeholders[type] || 'Identifiant...';
}

function addPlatform() {
  if (!localIdentifier.value.metadata) {
    localIdentifier.value.metadata = { identifierType: '', platforms: [], verificationStatus: 'unknown' };
  }
  if (!localIdentifier.value.metadata.platforms) {
    localIdentifier.value.metadata.platforms = [];
  }
  localIdentifier.value.metadata.platforms.push('');
}

function updatePlatform(index: number, value: string) {
  if (localIdentifier.value.metadata?.platforms) {
    localIdentifier.value.metadata.platforms[index] = value;
  }
}

function removePlatform(index: number) {
  if (localIdentifier.value.metadata?.platforms) {
    localIdentifier.value.metadata.platforms.splice(index, 1);
  }
}

function addRelatedEntity() {
  if (!localIdentifier.value.relatedEntities) {
    localIdentifier.value.relatedEntities = [];
  }
  localIdentifier.value.relatedEntities.push('');
}

function updateRelatedEntity(index: number, value: string) {
  if (localIdentifier.value.relatedEntities) {
    localIdentifier.value.relatedEntities[index] = value;
  }
}

function removeRelatedEntity(index: number) {
  if (localIdentifier.value.relatedEntities) {
    localIdentifier.value.relatedEntities.splice(index, 1);
  }
}

function handleSubmit() {
  errors.value = {};
  
  if (!validateUniqueness()) {
    return;
  }
  
  if (!isValid.value) {
    errors.value.label = 'L\'identifiant et le type sont requis';
    return;
  }
  
  // Nettoyer les tableaux vides
  if (localIdentifier.value.metadata?.platforms) {
    localIdentifier.value.metadata.platforms = localIdentifier.value.metadata.platforms.filter(
      (p: string) => p.trim() !== ''
    );
  }
  
  if (localIdentifier.value.relatedEntities) {
    localIdentifier.value.relatedEntities = localIdentifier.value.relatedEntities.filter(
      (e: string) => e.trim() !== ''
    );
  }
  
  // Ajouter le screenshot si présent
  const finalIdentifier = { ...localIdentifier.value };
  if (screenshot.value) {
    (finalIdentifier as any).screenshot = screenshot.value;
  }
  
  emit('save', finalIdentifier);
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
