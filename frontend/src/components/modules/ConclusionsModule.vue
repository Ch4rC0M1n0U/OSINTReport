<template>
  <div class="space-y-6">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-4">
      <div v-if="safeStatements.length > 0">
        <!-- Convertir le tableau en liste Markdown pour le rendu -->
        <MarkdownRenderer :content="statementsAsMarkdown" />
      </div>
      <p v-else class="text-gray-500 dark:text-gray-400 italic">Aucune conclusion</p>

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
            ✓ Conclusions et recommandations
          </h3>
          <button
            type="button"
            @click="addStatement"
            class="px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400"
          >
            ➕ Ajouter une conclusion
          </button>
        </div>

        <div v-if="editablePayload.statements.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic">
          Aucune conclusion
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(statement, index) in editablePayload.statements"
            :key="index"
            class="border border-gray-300 dark:border-gray-600 rounded-lg p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Conclusion {{ index + 1 }}
              </span>
              <button
                type="button"
                @click="removeStatement(index)"
                class="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                🗑️ Supprimer
              </button>
            </div>
            <WysiwygEditor
              v-model="editablePayload.statements[index]"
              :placeholder="`Ex: Les recherches ont permis d'identifier formellement...`"
            />
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
import type { ConclusionsPayload } from "@/services/api/reports";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";

interface Props {
  payload: ConclusionsPayload;
  moduleId: string;
}

interface Emits {
  (e: "update", payload: ConclusionsPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(false);
const editablePayload = ref<ConclusionsPayload>({ statements: [] });

// Computed pour gérer le payload vide ou undefined
const safeStatements = computed(() => {
  return props.payload?.statements || [];
});

// Convertir les statements en liste Markdown pour le rendu
const statementsAsMarkdown = computed(() => {
  return safeStatements.value.map(stmt => `- ${stmt}`).join('\n');
});

function startEditing() {
  editablePayload.value = {
    statements: props.payload?.statements ? [...props.payload.statements] : []
  };
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

function addStatement() {
  editablePayload.value.statements.push("");
}

function removeStatement(index: number) {
  editablePayload.value.statements.splice(index, 1);
}

async function saveChanges() {
  emit("update", editablePayload.value);
  isEditing.value = false;
}
</script>
