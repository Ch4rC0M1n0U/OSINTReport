<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <!-- Carte de contenu -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Objectifs OSINT</h2>
        </div>
        
        <div class="space-y-4">
          <!-- Blocs de texte enrichi -->
          <RichTextBlockList
            v-if="richTextBlocks.length > 0"
            :blocks="richTextBlocks"
            :readonly="true"
            :report-id="reportId"
            :findings="findings"
            placeholder="Ajoutez des informations sur les objectifs OSINT..."
          />
          
          <div v-if="safeObjectives.length > 0" class="prose dark:prose-invert max-w-none">
            <MarkdownRenderer :content="objectivesAsMarkdown" />
          </div>
          
          <div v-if="!richTextBlocks.length && !safeObjectives.length" class="text-center py-8">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 italic">Aucun objectif n'a été défini</p>
          </div>
        </div>
      </div>

      <!-- Bouton édition -->
      <div class="flex justify-end gap-2">
        <button
          v-if="richTextBlocks.length > 0"
          disabled
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-not-allowed"
        >
          {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
        </button>
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

    <!-- Mode édition -->
    <div v-else class="space-y-6">
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold">
            🎯 Objectifs OSINT
          </h3>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="addRichTextBlock"
              class="btn btn-sm btn-outline gap-2"
              title="Ajouter un bloc de texte enrichi"
            >
              <span>📝</span>
              <span>Ajouter un texte</span>
            </button>
            <button
              type="button"
              @click="addObjective"
              class="btn btn-sm btn-primary"
            >
              ➕ Ajouter un objectif
            </button>
          </div>
        </div>

        <!-- Blocs de texte enrichi en mode édition -->
        <RichTextBlockList
          v-if="richTextBlocks.length > 0"
          :blocks="richTextBlocks"
          :readonly="false"
          :report-id="reportId"
          :findings="findings"
          placeholder="Ajoutez des informations sur les objectifs OSINT... Utilisez le bouton 👤 pour insérer des entités."
          class="mb-4"
          @update="() => {}"
          @delete="deleteBlock"
          @move-up="moveBlockUp"
          @move-down="moveBlockDown"
        />

        <div v-if="editablePayload.objectives.length === 0" class="text-sm text-base-content/60 italic">
          Aucun objectif
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(objective, index) in editablePayload.objectives"
            :key="index"
            class="join w-full"
          >
            <input
              v-model="editablePayload.objectives[index]"
              type="text"
              placeholder="Ex: Identifier les profils sur les réseaux sociaux"
              class="input input-sm join-item flex-1 px-0 border-0 border-b border-base-300 bg-transparent focus:outline-none focus:border-primary transition-colors"
              @keyup.enter="addObjective"
            />
            <button
              type="button"
              @click="removeObjective(index)"
              class="btn btn-sm btn-error join-item"
            >
              ✕
            </button>
          </div>
        </div>
      </section>

      <!-- Boutons actions -->
      <div class="flex justify-end gap-3">
        <button
          @click="cancelEditing"
          class="btn btn-ghost"
        >
          Annuler
        </button>
        <button
          @click="saveChanges"
          class="btn btn-success"
        >
          💾 Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from "vue";
import type { ObjectivesPayload, Finding } from "@/services/api/reports";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

interface Props {
  modelValue: ObjectivesPayload;
  reportId?: string;
}

interface Emits {
  (e: "update:modelValue", payload: ObjectivesPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Injecter les findings depuis le contexte du rapport
const findings = inject<Finding[]>('reportFindings', []);

const isEditing = ref(false);
const editablePayload = ref<ObjectivesPayload>({ objectives: [] });

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || []);

// Computed pour gérer le payload vide ou undefined
const safeObjectives = computed(() => {
  return props.modelValue?.objectives || [];
});

// Convertir les objectifs en liste Markdown pour le rendu
const objectivesAsMarkdown = computed(() => {
  return safeObjectives.value.map(obj => `- ${obj}`).join('\n');
});

function startEditing() {
  editablePayload.value = {
    objectives: props.modelValue?.objectives ? [...props.modelValue.objectives] : [],
    richTextBlocks: props.modelValue?.richTextBlocks || [],
  };
  if (props.modelValue?.richTextBlocks) {
    setBlocks(props.modelValue.richTextBlocks);
  }
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

function addObjective() {
  editablePayload.value.objectives.push("");
}

function removeObjective(index: number) {
  editablePayload.value.objectives.splice(index, 1);
}

async function saveChanges() {
  emit("update:modelValue", {
    objectives: editablePayload.value.objectives,
    richTextBlocks: richTextBlocks.value,
  });
  isEditing.value = false;
}
</script>
