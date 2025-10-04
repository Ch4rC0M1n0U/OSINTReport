<template>
  <div class="space-y-6">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <!-- Contenu du résumé -->
      <div v-if="safeContent" class="text-gray-700 dark:text-gray-300">
        <MarkdownRenderer :content="safeContent" />
      </div>
      <p v-else class="text-gray-500 dark:text-gray-400 italic">Aucun contenu</p>

      <!-- Bouton édition -->
      <div class="flex justify-end">
        <button
          @click="startEditing"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          ✏️ Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition avec auto-save -->
    <div v-else class="space-y-6">
      <!-- Indicateur auto-save -->
      <div class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
            ✨ Sauvegarde automatique activée
          </span>
        </div>
        <div class="flex items-center gap-2">
          <!-- Indicateur de sauvegarde en cours -->
          <div v-if="autoSave.isSaving.value" class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium">Sauvegarde...</span>
          </div>
          
          <!-- Dernière sauvegarde -->
          <div v-else-if="autoSave.lastSaved.value" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Sauvegardé {{ formatLastSaved(autoSave.lastSaved.value) }}</span>
          </div>
        </div>
      </div>

      <!-- Erreur auto-save -->
      <div v-if="autoSave.error.value" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-sm text-red-700 dark:text-red-300">
        ⚠️ {{ autoSave.error.value }}
      </div>

      <!-- Éditeur de contenu WYSIWYG -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📋 Résumé des faits
        </h3>
        <WysiwygEditor
          v-model="editableContent"
          placeholder="Décrivez les éléments recueillis par les enquêteurs, le contexte, les faits principaux..."
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Le contenu est automatiquement sauvegardé 2 secondes après avoir arrêté de taper.
        </p>
      </section>

      <!-- Bouton terminer -->
      <div class="flex justify-end">
        <button
          @click="finishEditing"
          class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          ✓ Terminer l'édition
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import type { SummaryPayload } from "@/services/api/reports";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";
import { useAutoSave } from "@/composables/useAutoSave";

interface Props {
  modelValue: SummaryPayload;
}

interface Emits {
  (e: "update:modelValue", payload: SummaryPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(false);
const editableContent = ref("");

// Computed pour gérer le payload vide ou undefined
const safeContent = computed(() => {
  return props.modelValue?.content || "";
});

// Auto-save setup
const autoSave = useAutoSave(editableContent, {
  delay: 2000,
  enabled: isEditing,
  onSave: async (content: string) => {
    emit("update:modelValue", { content });
  }
});

function startEditing() {
  editableContent.value = props.modelValue?.content || "";
  isEditing.value = true;
}

async function finishEditing() {
  // Sauvegarde immédiate avant de quitter
  await autoSave.saveNow();
  isEditing.value = false;
}

// Formater "il y a X secondes/minutes"
function formatLastSaved(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 5) return "à l'instant";
  if (seconds < 60) return `il y a ${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  
  const hours = Math.floor(minutes / 60);
  return `il y a ${hours}h`;
}

// Cleanup au démontage
onUnmounted(() => {
  autoSave.cleanup();
});
</script>
