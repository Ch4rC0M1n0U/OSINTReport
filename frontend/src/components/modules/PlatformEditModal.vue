<template>
  <div v-if="isOpen" class="modal modal-open">
    <div class="modal-box w-11/12 max-w-3xl">
      <h3 class="text-lg font-bold mb-4">
        {{ isNew ? '➕ Nouveau profil' : '✏️ Modifier le profil' }}
      </h3>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Plateforme -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Plateforme *</span>
          </label>
          <select
            v-model="platform"
            class="select select-bordered"
            required
          >
            <option value="">-- Sélectionner une plateforme --</option>
            <option value="facebook">📘 Facebook</option>
            <option value="instagram">📷 Instagram</option>
            <option value="twitter">🐦 X (Twitter)</option>
            <option value="linkedin">💼 LinkedIn</option>
            <option value="tiktok">🎵 TikTok</option>
            <option value="snapchat">👻 Snapchat</option>
            <option value="telegram">✈️ Telegram</option>
            <option value="whatsapp">💬 WhatsApp</option>
            <option value="youtube">📹 YouTube</option>
            <option value="reddit">🤖 Reddit</option>
            <option value="discord">🎮 Discord</option>
            <option value="other">❓ Autre</option>
          </select>
        </div>

        <!-- Nom du profil / Username -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Nom du profil / Username *</span>
          </label>
          <input
            v-model="localProfile.label"
            type="text"
            placeholder="@username ou Nom du profil"
            class="input input-bordered"
            :class="{ 'input-error': errors.label }"
            required
          />
          <label v-if="errors.label" class="label">
            <span class="label-text-alt text-error">{{ errors.label }}</span>
          </label>
        </div>

        <!-- Description / Bio -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Description / Bio</span>
          </label>
          <textarea
            v-model="localProfile.description"
            placeholder="Bio du profil, description, informations relevées..."
            class="textarea textarea-bordered"
            rows="3"
          ></textarea>
        </div>

        <!-- Statut du compte -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Statut du compte</span>
          </label>
          <select v-model="accountStatus" class="select select-bordered select-sm">
            <option value="active">✅ Actif</option>
            <option value="inactive">⭕ Inactif</option>
            <option value="suspended">⛔ Suspendu</option>
            <option value="deleted">🗑️ Supprimé</option>
            <option value="private">🔒 Privé</option>
            <option value="unknown">❓ Inconnu</option>
          </select>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Dernière activité (date et heure) -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Dernière activité (date et heure)</span>
            </label>
            <input
              v-model="lastActive"
              type="datetime-local"
              class="input input-bordered input-sm"
            />
          </div>

          <!-- Nombre d'abonnés -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Nombre d'abonnés</span>
            </label>
            <input
              v-model.number="followers"
              type="number"
              min="0"
              placeholder="Ex: 1250"
              class="input input-bordered input-sm"
            />
          </div>
        </div>

        <!-- URL du profil -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">URL du profil</span>
          </label>
          <input
            v-model="profileUrl"
            type="url"
            placeholder="https://..."
            class="input input-bordered input-sm"
          />
        </div>

        <!-- Capture d'écran -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Capture d'écran du profil</span>
          </label>
          <ScreenshotPicker
            v-model="screenshot"
            label="Capture du profil"
            :case-id="reportId || 'UNKNOWN'"
          />
        </div>

        <!-- Niveau de confiance -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Niveau de confiance</span>
          </label>
          <select v-model="localProfile.confidence" class="select select-bordered select-sm">
            <option value="confirmed">✅ Confirmé</option>
            <option value="probable">🟡 Probable</option>
            <option value="possible">🟠 Possible</option>
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
                placeholder="Nom de l'entité..."
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
              + Ajouter une entité
            </button>
          </div>
        </div>

        <!-- Sources -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Sources ({{ localProfile.sources.length }})</span>
          </label>
          <SourcesListEditor v-model="localProfile.sources" />
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
  profile: Finding | null;
  existingProfiles?: string[];
  reportId?: string; // UID du rapport pour isolation des screenshots
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', profile: Finding): void;
}>();

const isNew = computed(() => !props.profile);

const defaultProfile = (): Finding => ({
  label: '',
  description: '',
  confidence: 'probable' as any,
  sources: [],
  relatedEntities: [],
  metadata: {
    platform: '',
    accountStatus: 'unknown',
    lastActive: '',
    followers: 0,
    profileUrl: '',
    screenshot: '',
  },
});

const localProfile = ref<Finding>(defaultProfile());
const errors = ref<Record<string, string>>({});

// Synchroniser avec props
watch(
  () => props.profile,
  (newProfile) => {
    if (newProfile) {
      const cloned = JSON.parse(JSON.stringify(newProfile));
      if (!cloned.metadata) {
        cloned.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '', screenshot: '' };
      }
      if (!cloned.relatedEntities) {
        cloned.relatedEntities = [];
      }
      localProfile.value = cloned;
    } else {
      localProfile.value = defaultProfile();
    }
    errors.value = {};
  },
  { immediate: true }
);

// Computed properties pour les bindings
const platform = computed({
  get: () => localProfile.value.metadata?.platform || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.platform = value;
  },
});

const accountStatus = computed({
  get: () => localProfile.value.metadata?.accountStatus || 'unknown',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.accountStatus = value;
  },
});

const lastActive = computed({
  get: () => localProfile.value.metadata?.lastActive || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.lastActive = value;
  },
});

const followers = computed({
  get: () => localProfile.value.metadata?.followers || 0,
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '' };
    }
    localProfile.value.metadata.followers = value;
  },
});

const profileUrl = computed({
  get: () => localProfile.value.metadata?.profileUrl || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '', screenshot: '' };
    }
    localProfile.value.metadata.profileUrl = value;
  },
});

const screenshot = computed({
  get: () => localProfile.value.metadata?.screenshot || '',
  set: (value) => {
    if (!localProfile.value.metadata) {
      localProfile.value.metadata = { platform: '', accountStatus: 'unknown', lastActive: '', followers: 0, profileUrl: '', screenshot: '' };
    }
    localProfile.value.metadata.screenshot = value;
  },
});

const relatedEntities = computed(() => localProfile.value.relatedEntities || []);

// Validation
const isValid = computed(() => {
  return (
    localProfile.value.label.trim() !== '' &&
    localProfile.value.metadata?.platform !== ''
  );
});

function validateUniqueness(): boolean {
  if (!props.existingProfiles) return true;
  
  const isDuplicate = props.existingProfiles.some(
    profile => profile.toLowerCase() === localProfile.value.label.toLowerCase().trim()
  );
  
  if (isDuplicate && isNew.value) {
    errors.value.label = 'Ce profil existe déjà dans la liste';
    return false;
  }
  
  return true;
}

function addRelatedEntity() {
  if (!localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities = [];
  }
  localProfile.value.relatedEntities.push('');
}

function updateRelatedEntity(index: number, value: string) {
  if (localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities[index] = value;
  }
}

function removeRelatedEntity(index: number) {
  if (localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities.splice(index, 1);
  }
}

function handleSubmit() {
  errors.value = {};
  
  if (!validateUniqueness()) {
    return;
  }
  
  if (!isValid.value) {
    errors.value.label = 'Le nom du profil et la plateforme sont requis';
    return;
  }
  
  // Nettoyer les entités vides
  if (localProfile.value.relatedEntities) {
    localProfile.value.relatedEntities = localProfile.value.relatedEntities.filter(
      (e: string) => e.trim() !== ''
    );
  }
  
  emit('save', localProfile.value);
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
