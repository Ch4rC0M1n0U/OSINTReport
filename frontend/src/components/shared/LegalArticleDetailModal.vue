<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div
          class="bg-base-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-start justify-between p-6 border-b border-base-300">
            <div class="flex-1 pr-4">
              <h2 class="text-2xl font-bold mb-1">{{ article?.code || 'Détail de l\'article' }}</h2>
              <p class="text-sm opacity-70">{{ article?.title }}</p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              @click="closeModal"
            >
              ✕
            </button>
          </div>

          <!-- Content avec scroll -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <div v-if="article">
              <!-- Badge catégorie et description -->
              <div class="flex items-start gap-4 mb-6">
                <span
                  class="badge badge-lg shrink-0"
                  :class="`badge-${getCategoryColor(article.category)}`"
                >
                  {{ article.category }}
                </span>
                <p class="text-sm opacity-80 flex-1">{{ article.description }}</p>
              </div>

              <!-- Métadonnées -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-base-200 rounded-lg">
                <div>
                  <div class="text-xs uppercase font-bold opacity-60 mb-1">Dernière mise à jour</div>
                  <div class="font-medium">📅 {{ article.lastUpdate }}</div>
                </div>
                <div>
                  <div class="text-xs uppercase font-bold opacity-60 mb-1">Source juridique</div>
                  <div class="font-medium text-sm">📖 {{ article.source }}</div>
                </div>
              </div>

              <!-- Texte complet de l'article -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="text-sm font-bold uppercase opacity-60">⚖️ Texte légal</div>
                  <div class="flex-1 h-px bg-base-300"></div>
                </div>
                <div class="p-4 bg-base-200 rounded-lg">
                  <p class="text-sm text-justify leading-relaxed whitespace-pre-line">
                    {{ article.fullText }}
                  </p>
                </div>
              </div>

              <!-- Alerte d'information -->
              <div class="alert alert-info">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  class="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span class="text-sm">
                  Ce texte est fourni à titre informatif. Pour toute application juridique, veuillez
                  consulter la version officielle publiée au Moniteur belge.
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between p-6 border-t border-base-300">
            <a
              href="https://www.ejustice.just.fgov.be/"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-ghost gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="w-4 h-4"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
              Consulter sur eJustice.be
            </a>
            <button
              type="button"
              class="btn btn-primary"
              @click="closeModal"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { type LegalArticle, LEGAL_CATEGORIES } from "@/data/legal-basis";

const props = defineProps<{
  isOpen: boolean;
  article: LegalArticle | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function closeModal() {
  emit("close");
}

function getCategoryColor(category: string): string {
  return LEGAL_CATEGORIES.find((c) => c.value === category)?.color || "neutral";
}
</script>

<style scoped>
/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
}

/* Scrollbar personnalisée */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: hsl(var(--b2));
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--bc) / 0.2);
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--bc) / 0.3);
}
</style>
