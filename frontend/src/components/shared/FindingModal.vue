/**
 * 🔍 Modal générique pour création/édition de Findings
 * Utilisé par EntityOverview, IdentifierLookup, PlatformAnalysis
 */
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ mode === 'create' ? createTitle : editTitle }}
              </h3>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content (slot) -->
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <slot name="content"></slot>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                @click="closeModal"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                @click="handleSave"
                :disabled="!canSave"
                class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {{ mode === 'create' ? '✓ Créer' : '💾 Enregistrer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  mode: 'create' | 'edit';
  createTitle?: string;
  editTitle?: string;
  canSave?: boolean;
}

interface Emits {
  (e: 'close'): void;
  (e: 'save'): void;
}

const props = withDefaults(defineProps<Props>(), {
  createTitle: 'Créer un élément',
  editTitle: 'Modifier l\'élément',
  canSave: true
});

const emit = defineEmits<Emits>();

function closeModal() {
  emit('close');
}

function handleSave() {
  if (props.canSave) {
    emit('save');
  }
}

function handleBackdropClick() {
  // Optionnel : ne fermer que si on clique sur le backdrop
  closeModal();
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .fixed > div:last-child,
.modal-leave-active .fixed > div:last-child {
  transition: transform 0.2s ease;
}

.modal-enter-from .fixed > div:last-child,
.modal-leave-to .fixed > div:last-child {
  transform: scale(0.95);
}
</style>
