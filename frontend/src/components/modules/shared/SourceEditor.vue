<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
    <!-- Type de source -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Type de source *
      </label>
      <select
        v-model="localSource.type"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="url">URL</option>
        <option value="document">Document</option>
        <option value="database">Base de données</option>
        <option value="testimony">Témoignage</option>
      </select>
    </div>

    <!-- Valeur -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {{ valueLabel }} *
      </label>
      <input
        v-model="localSource.value"
        type="text"
        :placeholder="valuePlaceholder"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Note (optionnel) -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Note
      </label>
      <textarea
        v-model="localSource.note"
        rows="2"
        placeholder="Note ou contexte sur cette source..."
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Date d'accès (pour URL/Database) -->
    <div v-if="localSource.type === 'url' || localSource.type === 'database'">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Date d'accès
      </label>
      <input
        v-model="localSource.accessedAt"
        type="datetime-local"
        class="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
      />
    </div>

    <!-- Bouton de suppression -->
    <div class="flex justify-end pt-2">
      <button
        type="button"
        @click="$emit('remove')"
        class="px-3 py-1.5 text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      >
        🗑️ Supprimer cette source
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import type { Source } from "@/services/api/reports";

interface Props {
  modelValue: Source;
}

interface Emits {
  (e: "update:modelValue", value: Source): void;
  (e: "remove"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localSource = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const valueLabel = computed(() => {
  switch (localSource.value.type) {
    case "url":
      return "URL";
    case "document":
      return "Référence du document";
    case "database":
      return "Nom de la base de données";
    case "testimony":
      return "Identité du témoin";
    default:
      return "Valeur";
  }
});

const valuePlaceholder = computed(() => {
  switch (localSource.value.type) {
    case "url":
      return "https://example.com/...";
    case "document":
      return "PV-2025-001234, p. 5";
    case "database":
      return "BCNG, requête #12345";
    case "testimony":
      return "M. Dupont, agent 54321";
    default:
      return "";
  }
});

// Émettre les changements
watch(
  localSource,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
  { deep: true }
);
</script>
