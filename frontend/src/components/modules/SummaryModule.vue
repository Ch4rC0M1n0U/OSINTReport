<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <!-- Carte de contenu -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Résumé des faits</h2>
        </div>
        
        <div v-if="safeContent" class="prose dark:prose-invert max-w-none">
          <MarkdownRenderer :content="safeContent" />
        </div>
        <div v-else class="text-center py-8">
          <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-gray-500 dark:text-gray-400 italic">Aucun contenu n'a été ajouté</p>
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
      <!-- Bouton génération IA en haut -->
      <div class="flex justify-end">
        <AIGenerateButton
          context-type="summary"
          :report-data="reportDataForAI"
          label="Générer un résumé avec l'IA"
          size="sm"
          variant="primary"
          @generated="handleAIGenerated"
        />
      </div>

      <!-- Éditeur de contenu WYSIWYG -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📋 Résumé des faits
        </h3>
        <WysiwygEditor
          v-model="editableContent"
          placeholder="Décrivez les éléments recueillis par les enquêteurs, le contexte, les faits principaux... Utilisez le bouton 👤 pour insérer des entités."
          :enable-entity-insertion="true"
          :report-id="report?.id"
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
import { ref, computed, onUnmounted, inject } from "vue";
import type { SummaryPayload } from "@/services/api/reports";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";
import AIGenerateButton from "@/components/ai/AIGenerateButton.vue";
import { useAutoSave } from "@/composables/useAutoSave";
import type { Report } from "@/services/api/reports";

interface Props {
  modelValue: SummaryPayload;
}

interface Emits {
  (e: "update:modelValue", payload: SummaryPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Injecter les données du rapport depuis le parent
const report = inject<Report>('report', null as any);

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

// Gestion de la génération IA
const handleAIGenerated = (text: string) => {
  // Ajouter le texte généré au contenu existant
  if (editableContent.value) {
    editableContent.value += '\n\n' + text;
  } else {
    editableContent.value = text;
  }
  
  // Sauvegarder immédiatement
  autoSave.saveNow();
};

// Préparer les données pour l'IA
const reportDataForAI = computed(() => {
  if (!report) return undefined;
  
  return {
    title: report.title,
    type: 'PRELIMINARY', // Type par défaut pour la génération
    classification: report.classification,
    legalBasis: report.legalBasis || '',
    existingContent: editableContent.value,
  };
});

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
