<template>
  <div class="screenshot-picker">
    <!-- Preview de la capture sélectionnée -->
    <div v-if="hasScreenshot" class="mb-3">
      <div class="relative group cursor-pointer" @click="openFullscreen">
        <img
          :src="modelValue"
          :alt="label"
          class="w-full h-48 object-cover rounded-lg border border-base-300"
        />
        <div
          class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2"
        >
          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost text-white"
            @click.stop="openGallery"
            title="Changer"
          >
            🖼️
          </button>
          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost text-white"
            @click.stop="removeScreenshot"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      </div>
      <p class="text-xs text-base-content/60 mt-1">{{ label }}</p>
    </div>

    <!-- Boutons d'action -->
    <div class="flex gap-2">
      <button
        type="button"
        class="btn btn-sm btn-outline flex-1"
        @click="openGallery"
      >
        <span>🖼️</span>
        <span>{{ hasScreenshot ? 'Changer' : 'Choisir' }} une capture</span>
      </button>
      <label class="btn btn-sm btn-outline cursor-pointer">
        <span>📤</span>
        <span>Upload</span>
        <input
          type="file"
          class="hidden"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          @change="handleFileUpload"
        />
      </label>
    </div>

    <!-- Erreur d'upload -->
    <div v-if="uploadError" class="alert alert-error mt-2 text-sm">
      <span>⚠️</span>
      <span>{{ uploadError }}</span>
    </div>

    <!-- Modal Galerie -->
    <div v-if="showModal" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <h3 class="font-bold text-lg mb-4">
          📸 Galerie de captures d'écran
        </h3>

        <!-- Loader -->
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
          <p class="ml-3">Chargement...</p>
        </div>

        <!-- Grille de screenshots -->
        <div
          v-else-if="screenshots.length > 0"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto"
        >
          <div
            v-for="screenshot in screenshots"
            :key="screenshot.filename"
            class="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-all"
            @click="selectScreenshot(screenshot)"
          >
            <img
              :src="screenshot.url"
              :alt="screenshot.originalName"
              class="w-full h-32 object-cover"
            />
            <div
              class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
            >
              <p class="text-white text-xs font-semibold px-2 text-center">
                {{ screenshot.originalName }}
              </p>
              <p class="text-white/70 text-xs">
                {{ formatSize(screenshot.size) }} • {{ screenshot.width }}x{{ screenshot.height }}
              </p>
              <p v-if="screenshot.captureDate" class="text-white/60 text-xs">
                📸 {{ formatDate(screenshot.captureDate) }}
              </p>
              <button
                type="button"
                class="btn btn-xs btn-error mt-2"
                @click="deleteScreenshot(screenshot, $event)"
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Aucun screenshot -->
        <div v-else class="text-center py-12">
          <p class="text-base-content/60">
            Aucune capture d'écran disponible.
          </p>
          <p class="text-sm text-base-content/40 mt-2">
            Utilisez le bouton "Upload" pour ajouter une capture.
          </p>
        </div>

        <!-- Erreur -->
        <div v-if="uploadError" class="alert alert-error mt-4">
          <span>⚠️</span>
          <span>{{ uploadError }}</span>
        </div>

        <!-- Boutons du modal -->
        <div class="modal-action">
          <button
            type="button"
            class="btn"
            @click="showModal = false"
          >
            Fermer
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showModal = false"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { screenshotService, type Screenshot } from '../../services/screenshot';

interface Props {
  modelValue: string;
  label?: string;
  caseId: string; // OBLIGATOIRE : UID du dossier pour isolation
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Capture d\'écran',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const showModal = ref(false);
const screenshots = ref<Screenshot[]>([]);
const isLoading = ref(false);
const uploadError = ref('');

const hasScreenshot = computed(() => !!props.modelValue);

/**
 * Chargement des screenshots depuis l'API (filtré par caseId)
 */
async function loadScreenshots() {
  try {
    isLoading.value = true;
    uploadError.value = '';
    screenshots.value = await screenshotService.list(props.caseId);
  } catch (error: any) {
    console.error('Erreur chargement screenshots:', error);
    uploadError.value = error.message || 'Erreur lors du chargement des captures';
  } finally {
    isLoading.value = false;
  }
}

/**
 * Ouverture du modal et chargement des screenshots
 */
function openGallery() {
  showModal.value = true;
  loadScreenshots();
}

/**
 * Sélection d'un screenshot de la galerie
 */
function selectScreenshot(screenshot: Screenshot) {
  emit('update:modelValue', screenshot.url);
  showModal.value = false;
}

/**
 * Gestion de l'upload de fichier
 */
async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Validation du type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Format non supporté. Utilisez PNG, JPG ou WebP.';
    return;
  }

  // Validation de la taille (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'Fichier trop volumineux (10MB maximum).';
    return;
  }

  try {
    isLoading.value = true;
    uploadError.value = '';

    // Upload via l'API sécurisée avec le caseId du dossier
    const result = await screenshotService.upload(file, {
      caseId: props.caseId,
      investigatorName: 'Investigateur', // TODO: Passer le vrai nom depuis le store
    });

    // Mise à jour de la sélection
    emit('update:modelValue', result.url);
    
    // Rechargement de la liste
    await loadScreenshots();
    
    // Fermeture du modal si ouvert
    if (showModal.value) {
      showModal.value = false;
    }
  } catch (error: any) {
    console.error('Erreur upload:', error);
    uploadError.value = error.message || 'Erreur lors de l\'upload';
  } finally {
    isLoading.value = false;
    // Reset de l'input
    target.value = '';
  }
}

/**
 * Suppression de la capture sélectionnée
 */
function removeScreenshot() {
  emit('update:modelValue', '');
}

/**
 * Ouverture de la capture en plein écran
 */
function openFullscreen() {
  if (props.modelValue) {
    window.open(props.modelValue, '_blank');
  }
}

/**
 * Suppression d'un screenshot de la galerie
 */
async function deleteScreenshot(screenshot: Screenshot, event: Event) {
  event.stopPropagation();
  
  if (!confirm(`Supprimer "${screenshot.originalName}" ?`)) {
    return;
  }

  try {
    isLoading.value = true;
    await screenshotService.delete(screenshot.filename, props.caseId);
    await loadScreenshots();
    
    // Si c'était le screenshot sélectionné, le retirer
    if (props.modelValue === screenshot.url) {
      removeScreenshot();
    }
  } catch (error: any) {
    console.error('Erreur suppression:', error);
    uploadError.value = error.message || 'Erreur lors de la suppression';
  } finally {
    isLoading.value = false;
  }
}

/**
 * Formatage de la taille de fichier
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Convertit un offset timezone en nom de timezone
 */
function getTimezoneName(offset: string): string {
  const timezoneMap: Record<string, string> = {
    '+02:00': 'CEST', '+01:00': 'CET', '+00:00': 'UTC',
    '-04:00': 'EDT', '-05:00': 'EST', '+09:00': 'JST', '+08:00': 'CST',
  };
  return timezoneMap[offset] || `UTC${offset}`;
}

/**
 * Formatage de la date de capture EXIF avec timezone originale
 * Ex: "2025-10-05T18:00:35+02:00" → "05/10/2025 18:00 (CEST - UTC+02:00)"
 */
function formatDate(isoDate: string): string {
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/);
  if (!match) return isoDate;
  
  const [, year, month, day, hours, minutes, , timezone] = match;
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}`;
  
  if (timezone) {
    const tzName = getTimezoneName(timezone);
    return `${dateStr} (${tzName} - UTC${timezone})`;
  }
  
  return dateStr;
}
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>
