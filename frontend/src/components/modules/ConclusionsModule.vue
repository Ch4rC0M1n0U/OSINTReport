<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <!-- Carte de contenu -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Conclusions et recommandations</h2>
        </div>
        
        <div v-if="safeStatements.length > 0" class="prose dark:prose-invert max-w-none">
          <MarkdownRenderer :content="statementsAsMarkdown" />
        </div>
        <div v-else class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400 italic">Aucune conclusion n'a été ajoutée</p>
        </div>
      </div>

      <!-- Bouton édition -->
      <div class="flex justify-end">
        <button
          @click="startEditing"
          class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modifier
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
          <div v-if="isSaving" class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-xs font-medium">Sauvegarde...</span>
          </div>
          
          <!-- Dernière sauvegarde -->
          <div v-else-if="lastSaved" class="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Sauvegardé {{ formatLastSaved(lastSaved) }}</span>
          </div>
        </div>
      </div>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            ✓ Conclusions et recommandations
          </h3>
          <button
            type="button"
            @click="addStatement"
            class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            ➕ Ajouter une conclusion
          </button>
        </div>

        <div v-if="editableStatements.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          Aucune conclusion. Cliquez sur "Ajouter une conclusion" pour commencer.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(statement, index) in editableStatements"
            :key="index"
            class="border border-gray-300 dark:border-gray-600 rounded-lg p-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conclusion {{ index + 1 }}
              </span>
              <button
                type="button"
                @click="removeStatement(index)"
                class="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                🗑️ Supprimer
              </button>
            </div>
            <WysiwygEditor
              v-model="editableStatements[index]"
              :placeholder="`Ex: Les recherches ont permis d'identifier formellement... Utilisez le bouton 👤 pour insérer des entités.`"
              :enable-entity-insertion="true"
              :report-id="report?.id"
              @update:model-value="() => debouncedSave()"
            />
          </div>
        </div>
        
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
          💡 Chaque modification est automatiquement sauvegardée 2 secondes après avoir arrêté de taper.
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
import { ref, computed, inject } from "vue";
import type { ConclusionsPayload } from "@/services/api/reports";
import type { Report } from "@/services/api/reports";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";

interface Props {
  modelValue: ConclusionsPayload;
}

interface Emits {
  (e: "update:modelValue", payload: ConclusionsPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Injecter les données du rapport depuis le parent
const report = inject<Report>('report', null as any);

const isEditing = ref(false);
const editableStatements = ref<string[]>([]);
const isSaving = ref(false);
const lastSaved = ref<Date | null>(null);

let saveTimeout: NodeJS.Timeout | null = null;

// Computed pour gérer le payload vide ou undefined
const safeStatements = computed(() => {
  return props.modelValue?.statements || [];
});

// Convertir les statements en liste Markdown pour le rendu
const statementsAsMarkdown = computed(() => {
  return safeStatements.value.map(stmt => `- ${stmt}`).join('\n');
});

function startEditing() {
  editableStatements.value = props.modelValue?.statements ? [...props.modelValue.statements] : [];
  isEditing.value = true;
}

function addStatement() {
  editableStatements.value.push("");
  // Sauvegarde immédiate après ajout
  saveNow();
}

async function removeStatement(index: number) {
  editableStatements.value.splice(index, 1);
  // Sauvegarde immédiate après suppression
  await saveNow();
}

// Sauvegarde avec debounce
function debouncedSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveNow();
  }, 2000);
}

// Sauvegarde immédiate
async function saveNow() {
  if (isSaving.value) return;

  try {
    isSaving.value = true;
    emit("update:modelValue", { statements: [...editableStatements.value] });
    lastSaved.value = new Date();
  } catch (error) {
    console.error('Save failed:', error);
  } finally {
    isSaving.value = false;
  }
}

async function finishEditing() {
  // Sauvegarde finale
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  await saveNow();
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
</script>
