<template>
  <div class="media-gallery-module max-w-7xl mx-auto">
    <!-- En-tête -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">🖼️ Galerie média</span>
        <span class="badge badge-neutral">{{ screenshots.length }}</span>
      </div>
      <button
        v-if="!readonly && reportId"
        type="button"
        class="btn btn-sm btn-primary gap-2"
        @click="openUploadDialog"
      >
        <span>📤</span>
        <span>Ajouter une capture</span>
      </button>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
      <p class="ml-3">Chargement de la galerie...</p>
    </div>

    <!-- Galerie de screenshots -->
    <div
      v-else-if="screenshots.length > 0"
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <div
        v-for="screenshot in screenshots"
        :key="screenshot.filename"
        class="card bg-base-100 border border-base-300 hover:border-primary transition-all cursor-pointer group"
        @click="openFullscreen(screenshot)"
      >
        <!-- Image -->
        <figure class="relative h-48 overflow-hidden">
          <img
            :src="screenshot.url"
            :alt="screenshot.originalName"
            class="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
            <span class="text-4xl opacity-0 group-hover:opacity-100 transition-opacity">
              🔍
            </span>
          </div>
        </figure>

        <!-- Métadonnées -->
        <div class="card-body p-3">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-semibold truncate flex-1" :title="screenshot.originalName">
              {{ screenshot.originalName }}
            </h3>
            <span
              v-if="screenshot.gpsLatitude !== undefined && screenshot.gpsLongitude !== undefined"
              class="badge badge-success badge-xs gap-1"
              title="Image géolocalisée"
            >
              <span>📍</span>
            </span>
          </div>
          
          <div class="text-xs text-base-content/60 space-y-1">
            <div class="flex items-center gap-2">
              <span>📐</span>
              <span>{{ screenshot.width }}x{{ screenshot.height }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span>💾</span>
              <span>{{ formatSize(screenshot.size) }}</span>
            </div>
            <div v-if="screenshot.captureDate" class="flex items-center gap-2">
              <span>📸</span>
              <span :title="formatFullDate(screenshot.captureDate)">
                {{ formatDate(screenshot.captureDate) }}
              </span>
            </div>
            <div v-else class="flex items-center gap-2">
              <span>📅</span>
              <span :title="formatFullDate(screenshot.uploadedAt)">
                {{ formatDate(screenshot.uploadedAt) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="card-actions justify-end mt-2">
            <button
              v-if="!readonly"
              type="button"
              class="btn btn-xs btn-error btn-ghost"
              @click.stop="confirmDelete(screenshot)"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-12 bg-base-200 rounded-lg">
      <div class="text-6xl mb-4">🖼️</div>
      <p class="text-base-content/60 mb-4">
        Aucune capture d'écran dans ce dossier
      </p>
      <button
        v-if="!readonly && reportId"
        type="button"
        class="btn btn-sm btn-primary gap-2"
        @click="openUploadDialog"
      >
        <span>📤</span>
        <span>Ajouter la première capture</span>
      </button>
    </div>

    <!-- Erreur -->
    <div v-if="error" class="alert alert-error mt-4">
      <span>⚠️</span>
      <span>{{ error }}</span>
    </div>

    <!-- Modal upload -->
    <div v-if="showUploadModal" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">📤 Ajouter une capture d'écran</h3>
        
        <div class="form-control">
          <label class="label">
            <span class="label-text">Fichier image</span>
          </label>
          <input
            type="file"
            class="file-input file-input-bordered w-full"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            @change="handleFileSelect"
          />
          <label class="label">
            <span class="label-text-alt">PNG, JPG ou WebP (10MB max)</span>
          </label>
        </div>

        <div v-if="uploadError" class="alert alert-error mt-4">
          <span>⚠️</span>
          <span>{{ uploadError }}</span>
        </div>

        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            :disabled="isUploading"
            @click="closeUploadDialog"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!selectedFile || isUploading"
            @click="handleUpload"
          >
            <span v-if="isUploading" class="loading loading-spinner"></span>
            <span v-else>📤</span>
            <span>{{ isUploading ? 'Upload...' : 'Téléverser' }}</span>
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeUploadDialog"></div>
    </div>

    <!-- Modal fullscreen -->
    <div v-if="fullscreenImage" class="modal modal-open">
      <div class="modal-box max-w-6xl">
        <h3 class="font-bold text-lg mb-4">{{ fullscreenImage.originalName }}</h3>
        
        <img
          :src="fullscreenImage.url"
          :alt="fullscreenImage.originalName"
          class="w-full rounded-lg"
        />

        <div class="mt-4 text-sm text-base-content/60 grid grid-cols-2 gap-2">
          <div><strong>Dimensions :</strong> {{ fullscreenImage.width }}x{{ fullscreenImage.height }}</div>
          <div><strong>Taille :</strong> {{ formatSize(fullscreenImage.size) }}</div>
          <div v-if="fullscreenImage.captureDate">
            <strong>Capture :</strong> {{ formatFullDate(fullscreenImage.captureDate) }}
          </div>
          <div><strong>Téléversé :</strong> {{ formatFullDate(fullscreenImage.uploadedAt) }}</div>
          <div v-if="fullscreenImage.gpsLatitude !== undefined && fullscreenImage.gpsLongitude !== undefined" class="col-span-2">
            <strong>📍 Localisation GPS :</strong>
            <span class="ml-2 font-mono">{{ fullscreenImage.gpsLatitude.toFixed(6) }}°, {{ fullscreenImage.gpsLongitude.toFixed(6) }}°</span>
          </div>
        </div>

        <!-- Carte OpenStreetMap si coordonnées GPS disponibles -->
        <div v-if="fullscreenImage.gpsLatitude !== undefined && fullscreenImage.gpsLongitude !== undefined" class="mt-4">
          <LocationMap
            :latitude="fullscreenImage.gpsLatitude"
            :longitude="fullscreenImage.gpsLongitude"
            :altitude="fullscreenImage.gpsAltitude"
          />
        </div>

        <div class="modal-action">
          <a
            :href="fullscreenImage.url"
            target="_blank"
            class="btn btn-sm btn-ghost gap-2"
          >
            <span>🔗</span>
            <span>Ouvrir dans un nouvel onglet</span>
          </a>
          <button
            type="button"
            class="btn btn-sm"
            @click="fullscreenImage = null"
          >
            Fermer
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="fullscreenImage = null"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { screenshotService, type Screenshot } from '@/services/screenshot';
import LocationMap from '@/components/shared/LocationMap.vue';

const props = defineProps<{
  modelValue?: any;
  readonly?: boolean;
  reportId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const screenshots = ref<Screenshot[]>([]);
const isLoading = ref(false);
const error = ref('');

const showUploadModal = ref(false);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const uploadError = ref('');

const fullscreenImage = ref<Screenshot | null>(null);

watch(() => props.reportId, loadScreenshots, { immediate: true });

onMounted(() => {
  loadScreenshots();
});

async function loadScreenshots() {
  if (!props.reportId) return;

  try {
    isLoading.value = true;
    error.value = '';
    screenshots.value = await screenshotService.list(props.reportId);
  } catch (err: any) {
    console.error('Erreur chargement galerie:', err);
    error.value = err.message || 'Erreur lors du chargement de la galerie';
  } finally {
    isLoading.value = false;
  }
}

function openUploadDialog() {
  showUploadModal.value = true;
  selectedFile.value = null;
  uploadError.value = '';
}

function closeUploadDialog() {
  showUploadModal.value = false;
  selectedFile.value = null;
  uploadError.value = '';
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    uploadError.value = 'Format non supporté. Utilisez PNG, JPG ou WebP.';
    selectedFile.value = null;
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    uploadError.value = 'Fichier trop volumineux (10MB maximum).';
    selectedFile.value = null;
    return;
  }

  selectedFile.value = file;
  uploadError.value = '';
}

async function handleUpload() {
  if (!selectedFile.value || !props.reportId) return;

  try {
    isUploading.value = true;
    uploadError.value = '';

    await screenshotService.upload(selectedFile.value, {
      caseId: props.reportId,
      investigatorName: 'Investigateur',
    });

    await loadScreenshots();
    closeUploadDialog();
  } catch (err: any) {
    console.error('Erreur upload:', err);
    uploadError.value = err.message || "Erreur lors de l'upload";
  } finally {
    isUploading.value = false;
  }
}

async function confirmDelete(screenshot: Screenshot) {
  if (!confirm(`Supprimer "${screenshot.originalName}" ?`)) {
    return;
  }

  try {
    isLoading.value = true;
    await screenshotService.delete(screenshot.filename, props.reportId);
    await loadScreenshots();
  } catch (err: any) {
    console.error('Erreur suppression:', err);
    error.value = err.message || 'Erreur lors de la suppression';
  } finally {
    isLoading.value = false;
  }
}

function openFullscreen(screenshot: Screenshot) {
  fullscreenImage.value = screenshot;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoDate: string): string {
  // Format court: DD/MM/YYYY
  // Ex: "2025-10-05T18:00:35+02:00" → "05/10/2025"
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return isoDate;
  
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Convertit un offset timezone en nom de timezone
 * Ex: "+02:00" (en été) → "CEST", "+01:00" (en hiver) → "CET"
 */
function getTimezoneName(offset: string): string {
  // Map des timezones courantes (peut être étendu)
  const timezoneMap: Record<string, string> = {
    '+02:00': 'CEST', // Central European Summer Time (été)
    '+01:00': 'CET',  // Central European Time (hiver)
    '+00:00': 'UTC',  // Coordinated Universal Time
    '-04:00': 'EDT',  // Eastern Daylight Time
    '-05:00': 'EST',  // Eastern Standard Time
    '+09:00': 'JST',  // Japan Standard Time
    '+08:00': 'CST',  // China Standard Time
    // Ajoutez d'autres selon vos besoins
  };
  
  return timezoneMap[offset] || `UTC${offset}`;
}

function formatFullDate(isoDate: string): string {
  // Format complet avec timezone originale entre parenthèses
  // Ex: "2025-10-05T18:00:35+02:00" → "05/10/2025 18:00:35 (CEST - UTC+02:00)"
  const match = isoDate.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([\+\-]\d{2}:\d{2})?/);
  if (!match) return isoDate;
  
  const [, year, month, day, hours, minutes, seconds, timezone] = match;
  const dateStr = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  
  if (timezone) {
    const tzName = getTimezoneName(timezone);
    return `${dateStr} (${tzName} - UTC${timezone})`;
  }
  
  return dateStr;
}
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.7);
}
</style>
