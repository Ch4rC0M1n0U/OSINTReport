<template>
  <div v-if="legalBasis" class="space-y-2">
    <div v-if="label" class="text-sm opacity-70">{{ label }}</div>
    <div 
      class="flex flex-wrap gap-2 p-2 rounded border border-base-300"
      :class="scrollable ? 'max-h-32 overflow-y-auto' : ''"
    >
      <component
        :is="clickable ? 'button' : 'span'"
        v-for="article in articles"
        :key="article"
        :type="clickable ? 'button' : undefined"
        class="badge badge-primary badge-sm font-mono transition-colors"
        :class="clickable ? 'cursor-pointer hover:badge-secondary' : ''"
        :title="clickable ? `Cliquer pour voir les détails de ${article}` : undefined"
        @click="clickable ? $emit('click-article', article) : undefined"
      >
        {{ article }}
      </component>
    </div>
  </div>
  <div v-else class="font-medium">{{ emptyText }}</div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { parseLegalBasis } from "@/data/legal-basis";

const props = withDefaults(
  defineProps<{
    legalBasis: string | null | undefined;
    label?: string;
    clickable?: boolean;
    scrollable?: boolean;
    emptyText?: string;
  }>(),
  {
    label: "Base légale",
    clickable: false,
    scrollable: true,
    emptyText: "—",
  }
);

defineEmits<{
  (e: "click-article", articleCode: string): void;
}>();

const articles = computed(() => parseLegalBasis(props.legalBasis));
</script>

<style scoped>
/* Scrollbar personnalisée */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: hsl(var(--b2));
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>
