<template>
  <div class="space-y-6">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <div v-if="safeObjectives.length > 0">
        <!-- Convertir le tableau en liste Markdown pour le rendu -->
        <MarkdownRenderer :content="objectivesAsMarkdown" />
      </div>
      <p v-else class="text-gray-500 dark:text-gray-400 italic">Aucun objectif défini</p>

      <!-- Bouton édition -->
      <div class="flex justify-end">
        <button
          @click="startEditing"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ✏️ Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-6">
      <section>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            🎯 Objectifs OSINT
          </h3>
          <button
            type="button"
            @click="addObjective"
            class="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400"
          >
            ➕ Ajouter un objectif
          </button>
        </div>

        <div v-if="editablePayload.objectives.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic">
          Aucun objectif
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(objective, index) in editablePayload.objectives"
            :key="index"
            class="flex items-start gap-3"
          >
            <input
              v-model="editablePayload.objectives[index]"
              type="text"
              placeholder="Ex: Identifier les profils sur les réseaux sociaux"
              class="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <button
              type="button"
              @click="removeObjective(index)"
              class="px-3 py-2 text-red-600 hover:text-red-700 dark:text-red-400"
            >
              🗑️
            </button>
          </div>
        </div>
      </section>

      <!-- Boutons actions -->
      <div class="flex justify-end gap-3">
        <button
          @click="cancelEditing"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Annuler
        </button>
        <button
          @click="saveChanges"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          💾 Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ObjectivesPayload } from "@/services/api/reports";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";

interface Props {
  payload: ObjectivesPayload;
  moduleId: string;
}

interface Emits {
  (e: "update", payload: ObjectivesPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(false);
const editablePayload = ref<ObjectivesPayload>({ objectives: [] });

// Computed pour gérer le payload vide ou undefined
const safeObjectives = computed(() => {
  return props.payload?.objectives || [];
});

// Convertir les objectifs en liste Markdown pour le rendu
const objectivesAsMarkdown = computed(() => {
  return safeObjectives.value.map(obj => `- ${obj}`).join('\n');
});

function startEditing() {
  editablePayload.value = {
    objectives: props.payload?.objectives ? [...props.payload.objectives] : []
  };
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
  emit("update", editablePayload.value);
  isEditing.value = false;
}
</script>
