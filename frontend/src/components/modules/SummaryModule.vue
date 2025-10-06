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
          💡 Sauvegarde automatique après 30 secondes d'inactivité.
        </p>
      </section>

      <!-- Indicateur discret en bas -->
      <div class="flex items-center justify-between text-xs text-base-content/60 pt-2 border-t border-base-300">
        <div class="flex items-center gap-2">
          <!-- Sauvegarde en cours -->
          <div v-if="autoSave.isSaving.value" class="flex items-center gap-1">
            <span class="loading loading-spinner loading-xs"></span>
            <span>Sauvegarde...</span>
          </div>
          
          <!-- Dernière sauvegarde -->
          <div v-else-if="autoSave.lastSaved.value" class="flex items-center gap-1 text-success">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Sauvegardé {{ formatLastSaved(autoSave.lastSaved.value) }}</span>
          </div>
          
          <!-- En attente -->
          <div v-else class="opacity-50">
            En attente de modifications...
          </div>
        </div>
        
        <!-- Erreur -->
        <div v-if="autoSave.error.value" class="text-error">
          ⚠️ {{ autoSave.error.value }}
        </div>
      </div>

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
  delay: 30000, // 30 secondes
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
