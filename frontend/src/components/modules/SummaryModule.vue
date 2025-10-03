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
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          ✏️ Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-6">
      <!-- Éditeur de contenu WYSIWYG -->
      <section>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          📋 Résumé des faits
        </h3>
        <WysiwygEditor
          v-model="editablePayload.content"
          placeholder="Décrivez les éléments recueillis par les enquêteurs, le contexte, les faits principaux..."
        />
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 Utilisez la barre d'outils pour formater le texte. Le contenu est sauvegardé en Markdown.
        </p>
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
import type { SummaryPayload } from "@/services/api/reports";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer.vue";

interface Props {
  payload: SummaryPayload;
  moduleId: string;
}

interface Emits {
  (e: "update", payload: SummaryPayload): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEditing = ref(false);
const editablePayload = ref<SummaryPayload>({ content: "" });

// Computed pour gérer le payload vide ou undefined
const safeContent = computed(() => {
  return props.payload?.content || "";
});

function startEditing() {
  editablePayload.value = {
    content: props.payload?.content || ""
  };
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

async function saveChanges() {
  emit("update", editablePayload.value);
  isEditing.value = false;
}
</script>
