/**
 * ⚠️ Modal de confirmation de suppression
 * Composant réutilisable pour toutes les confirmations
 */
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="handleCancel"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div
            class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full"
            @click.stop
          >
            <!-- Icon -->
            <div class="flex items-center justify-center pt-6">
              <div class="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            <!-- Header -->
            <div class="px-6 pt-4 text-center">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h3>
            </div>

            <!-- Content -->
            <div class="px-6 py-4 text-center">
              <p class="text-gray-600 dark:text-gray-400">
                {{ message }}
              </p>
              <p v-if="itemLabel" class="mt-2 font-medium text-gray-900 dark:text-white">
                "{{ itemLabel }}"
              </p>
              <p class="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
                ⚠️ Cette action est irréversible
              </p>
            </div>

            <!-- Footer -->
            <div class="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                @click="handleCancel"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {{ cancelText }}
              </button>
              <button
                @click="handleConfirm"
                class="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                {{ confirmText }}
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
  title?: string;
  message?: string;
  itemLabel?: string;
  confirmText?: string;
  cancelText?: string;
}

interface Emits {
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirmer la suppression',
  message: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
  confirmText: 'Supprimer',
  cancelText: 'Annuler'
});

const emit = defineEmits<Emits>();

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
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

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
