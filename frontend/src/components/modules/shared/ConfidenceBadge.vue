<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeClasses,
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ConfidenceLevel } from "@/services/api/reports";

interface Props {
  level: ConfidenceLevel;
}

const props = defineProps<Props>();

const badgeClasses = computed(() => {
  switch (props.level) {
    case "confirmed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "probable":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "possible":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "unknown":
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
});

const label = computed(() => {
  switch (props.level) {
    case "confirmed":
      return "✓ Confirmé";
    case "probable":
      return "◉ Probable";
    case "possible":
      return "◯ Possible";
    case "unknown":
      return "? Inconnu";
    default:
      return props.level;
  }
});
</script>
