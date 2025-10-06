<template>
  <div class="screenshot-picker">
    <!-- Mode sélection -->
    <div v-if="!isGalleryOpen">
      <!-- Preview de la capture sélectionnée -->
      <div v-if="selectedScreenshot" class="mb-3">
        <div class="relative group">
          <img
            :src="selectedScreenshot"
            :alt="label || 'Capture d\'écran'"
            class="w-full h-48 object-cover rounded-lg border border-base-300"
          />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-circle btn-ghost text-white"
              @click="openGallery"
              title="Changer"
            >
              🖼️
            </button>
            <button
              type="button"
              class="btn btn-sm btn-circle btn-ghost text-white"
              @click="removeScreenshot"
              title="Supprimer"
            >
              ✕
            </button>
          </div>
        </div>
        <p v-if="label" class="text-xs text-base-content/60 mt-1">{{ label }}</p>
      </div>

      <!-- Boutons d'action -->
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline flex-1"
          @click="openGallery"
        >
          <span>🖼️</span>
          <span>{{ selectedScreenshot ? 'Changer' : 'Choisir' }} une capture</span>
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="triggerUpload"
        >
          <span>📤</span>
          <span>Upload</span>
        </button>
      </div>

      <!-- Input file caché -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
      />
    </div>

    <!-- Modal Galerie -->
    <div v-if="isGalleryOpen" class="modal modal-open">
      <div class="modal-box w-11/12 max-w-5xl">
        <h3 class="text-lg font-bold mb-4">📸 Galerie de captures d'écran</h3>

        <!-- Grille de captures -->
        <div v-if="screenshots.length > 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
          <div
            v-for="(screenshot, index) in screenshots"
            :key="index"
            class="relative group cursor-pointer"
            @click="selectScreenshot(screenshot)"
          >
            <img
              :src="screenshot.url"
              :alt="screenshot.name"
              class="w-full h-32 object-cover rounded-lg border-2 transition-all"
              :class="selectedScreenshot === screenshot.url ? 'border-primary' : 'border-base-300 hover:border-primary/50'"
            />
            <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <span class="text-white text-sm">
                {{ selectedScreenshot === screenshot.url ? '✓ Sélectionné' : 'Cliquer pour sélectionner' }}
              </span>
            </div>
            <p class="text-xs text-base-content/60 mt-1 truncate">{{ screenshot.name }}</p>
          </div>
        </div>

        <!-- État vide -->
        <div v-else class="text-center py-12 text-base-content/60">
          <div class="text-6xl mb-4">📸</div>
          <p>Aucune capture d'écran disponible</p>
          <p class="text-sm mt-2">Uploadez une capture pour commencer</p>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeGallery">
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!selectedScreenshot"
            @click="confirmSelection"
          >
            Confirmer
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeGallery"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface Screenshot {
  name: string;
  url: string;
}

const props = defineProps<{
  modelValue?: string;
  label?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isGalleryOpen = ref(false);
const selectedScreenshot = ref<string>(props.modelValue || '');
const screenshots = ref<Screenshot[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// Charger les captures depuis le dossier public
onMounted(async () => {
  await loadScreenshots();
});

async function loadScreenshots() {
  try {
    // Essayer de charger un fichier index.json qui liste les captures
    const response = await fetch('/images/screenshots/index.json');
    if (response.ok) {
      const data = await response.json();
      screenshots.value = data.screenshots || [];
    }
  } catch (error) {
    console.warn('Impossible de charger la liste des captures:', error);
    // Fallback: utiliser des captures par défaut si disponibles
    screenshots.value = generateDefaultScreenshots();
  }
}

function generateDefaultScreenshots(): Screenshot[] {
  // Générer une liste de captures par défaut (à adapter selon vos besoins)
  const defaultScreenshots: Screenshot[] = [];
  for (let i = 1; i <= 10; i++) {
    defaultScreenshots.push({
      name: `screenshot-${i}.png`,
      url: `/images/screenshots/screenshot-${i}.png`
    });
  }
  return defaultScreenshots;
}

function openGallery() {
  isGalleryOpen.value = true;
}

function closeGallery() {
  isGalleryOpen.value = false;
}

function selectScreenshot(screenshot: Screenshot) {
  selectedScreenshot.value = screenshot.url;
}

function confirmSelection() {
  emit('update:modelValue', selectedScreenshot.value);
  closeGallery();
}

function removeScreenshot() {
  selectedScreenshot.value = '';
  emit('update:modelValue', '');
}

function triggerUpload() {
  fileInput.value?.click();
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // Vérifier que c'est une image
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image');
    return;
  }

  // Créer une URL temporaire pour l'aperçu
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    selectedScreenshot.value = dataUrl;
    emit('update:modelValue', dataUrl);
    
    // Ajouter à la galerie temporairement
    screenshots.value.unshift({
      name: file.name,
      url: dataUrl
    });
  };
  reader.readAsDataURL(file);

  // TODO: Implémenter l'upload réel vers le serveur
  console.log('Upload de fichier:', file.name);
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
