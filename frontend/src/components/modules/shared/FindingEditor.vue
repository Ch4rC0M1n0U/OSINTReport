<template>
  <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
    <!-- En-tête avec label et confiance -->
    <div class="flex items-start justify-between gap-4">
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Label *
        </label>
        <input
          v-model="localFinding.label"
          type="text"
          placeholder="Ex: Numéro de téléphone actif"
          class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confiance
        </label>
        <select
          v-model="localFinding.confidence"
          class="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="confirmed">✓ Confirmé</option>
          <option value="probable">◉ Probable</option>
          <option value="possible">◯ Possible</option>
          <option value="unknown">? Inconnu</option>
        </select>
      </div>
    </div>

    <!-- Description -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Description *
      </label>
      <WysiwygEditor
        v-model="localFinding.description"
        placeholder="Détails de la constatation..."
      />
    </div>

    <!-- Sources -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sources ({{ localFinding.sources.length }})
        </label>
        <button
          type="button"
          @click="addSource"
          class="px-3 py-1 text-sm font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ➕ Ajouter une source
        </button>
      </div>

      <div v-if="localFinding.sources.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic">
        Aucune source ajoutée
      </div>

      <div v-else class="space-y-3">
        <SourceEditor
          v-for="(source, index) in localFinding.sources"
          :key="index"
          v-model="localFinding.sources[index]"
          @remove="removeSource(index)"
        />
      </div>
    </div>

    <!-- Pièces jointes (optionnel) -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Pièces jointes
      </label>
      <input
        v-model="attachmentsText"
        type="text"
        placeholder="Chemins séparés par des virgules: /uploads/photo1.jpg, /uploads/doc.pdf"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Entités liées (optionnel) -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Entités liées
      </label>
      <input
        v-model="relatedEntitiesText"
        type="text"
        placeholder="IDs d'entités séparés par des virgules"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Bouton de suppression du Finding -->
    <div class="flex justify-end pt-2 border-t border-gray-300 dark:border-gray-600">
      <button
        type="button"
        @click="$emit('remove')"
        class="px-4 py-2 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      >
        🗑️ Supprimer cette constatation
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { Finding, Source } from "@/services/api/reports";
import SourceEditor from "./SourceEditor.vue";
import WysiwygEditor from "@/components/shared/WysiwygEditor.vue";

interface Props {
  modelValue: Finding;
}

interface Emits {
  (e: "update:modelValue", value: Finding): void;
  (e: "remove"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localFinding = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Gestion des pièces jointes (string[] <-> comma-separated text)
const attachmentsText = computed({
  get: () => (localFinding.value.attachments || []).join(", "),
  set: (value) => {
    const trimmed = value.trim();
    localFinding.value.attachments = trimmed
      ? trimmed.split(",").map((s) => s.trim())
      : undefined;
  },
});

// Gestion des entités liées (string[] <-> comma-separated text)
const relatedEntitiesText = computed({
  get: () => (localFinding.value.relatedEntities || []).join(", "),
  set: (value) => {
    const trimmed = value.trim();
    localFinding.value.relatedEntities = trimmed
      ? trimmed.split(",").map((s) => s.trim())
      : undefined;
  },
});

function addSource() {
  if (!localFinding.value.sources) {
    localFinding.value.sources = [];
  }
  localFinding.value.sources.push({
    type: "url",
    value: "",
  });
}

function removeSource(index: number) {
  localFinding.value.sources.splice(index, 1);
}

// Émettre les changements
watch(
  localFinding,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>
