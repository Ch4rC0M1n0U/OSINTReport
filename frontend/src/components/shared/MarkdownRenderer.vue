<template>
  <div class="markdown-content max-w-none" v-html="renderedHtml" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";

interface Props {
  content: string;
}

const props = defineProps<Props>();

// Configuration de marked pour une sécurité optimale
marked.setOptions({
  breaks: true, // Convertir les retours à la ligne en <br>
  gfm: true, // GitHub Flavored Markdown
});

const renderedHtml = computed(() => {
  if (!props.content) return "";
  return marked(props.content);
});
</script>

<style scoped>
/* Listes non ordonnées - Puces modernes avec icône checkmark */
.markdown-content :deep(ul) {
  list-style: none !important;
  padding-left: 0 !important;
  margin-bottom: 1rem;
}

.markdown-content :deep(ul li) {
  position: relative;
  padding-left: 1.75rem !important;
  margin-bottom: 0.5rem;
}

.markdown-content :deep(ul li::before) {
  content: "→" !important;
  position: absolute;
  left: 0;
  color: #3b82f6 !important; /* blue-500 */
  font-weight: 600;
  font-size: 1.1em;
}

.dark .markdown-content :deep(ul li::before) {
  color: #60a5fa !important; /* blue-400 */
}

/* Listes imbriquées - variation de style */
.markdown-content :deep(ul ul li::before) {
  content: "•" !important;
  font-size: 1.3em;
  color: #8b5cf6 !important; /* violet-500 */
}

.dark .markdown-content :deep(ul ul li::before) {
  color: #a78bfa !important; /* violet-400 */
}

/* Listes ordonnées - Numéros avec fond coloré */
.markdown-content :deep(ol) {
  list-style: none !important;
  padding-left: 0 !important;
  margin-bottom: 1rem;
  counter-reset: list-counter;
}

.markdown-content :deep(ol li) {
  position: relative;
  padding-left: 2.5rem !important;
  margin-bottom: 0.75rem;
  counter-increment: list-counter;
}

.markdown-content :deep(ol li::before) {
  content: counter(list-counter) !important;
  position: absolute;
  left: 0;
  top: 0.1rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
  color: white !important;
  font-weight: 600;
  font-size: 0.75rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .markdown-content :deep(ol li::before) {
  background: linear-gradient(135deg, #60a5fa, #3b82f6) !important;
}

/* Paragraphes */
.markdown-content :deep(p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

/* Emphases */
.markdown-content :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.dark .markdown-content :deep(strong) {
  color: #f9fafb;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #4b5563;
}

.dark .markdown-content :deep(em) {
  color: #d1d5db;
}

/* Titres */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3) {
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

.dark .markdown-content :deep(h1),
.dark .markdown-content :deep(h2),
.dark .markdown-content :deep(h3) {
  color: #f9fafb;
}

/* Citations */
.markdown-content :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  background: #eff6ff;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-style: italic;
  color: #1e40af;
  margin: 1rem 0;
}

.dark .markdown-content :deep(blockquote) {
  border-left-color: #60a5fa;
  background: rgba(59, 130, 246, 0.1);
  color: #93c5fd;
}

/* Ligne horizontale */
.markdown-content :deep(hr) {
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
  margin: 1.5rem 0;
}

.dark .markdown-content :deep(hr) {
  background: linear-gradient(90deg, transparent, #4b5563, transparent);
}
</style>
