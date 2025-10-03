<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleBackdropClick"
      >
        <!-- Modal Card -->
        <Transition name="modal-slide">
          <div
            v-if="modelValue"
            :class="[
              'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden',
              'transform transition-all duration-300'
            ]"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header avec icône -->
            <div :class="[
              'px-6 py-4 border-b dark:border-gray-700',
              headerColorClass
            ]">
              <div class="flex items-center gap-3">
                <!-- Icône dynamique -->
                <div :class="[
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  iconBackgroundClass
                ]">
                  <span class="text-2xl">{{ iconEmoji }}</span>
                </div>
                
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                  {{ title }}
                </h3>
                
                <!-- Bouton fermer si pas de confirmation requise -->
                <button
                  v-if="!isConfirm"
                  @click="handleClose"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="px-6 py-4">
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ message }}
              </p>
              
              <!-- Slot pour contenu personnalisé -->
              <slot />
            </div>

            <!-- Footer avec boutons -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
              <template v-if="isConfirm">
                <!-- Modal de confirmation -->
                <button
                  @click="handleCancel"
                  class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  {{ cancelText }}
                </button>
                <button
                  @click="handleConfirm"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    confirmButtonClass
                  ]"
                >
                  {{ confirmText }}
                </button>
              </template>
              
              <template v-else>
                <!-- Modal d'information -->
                <button
                  @click="handleClose"
                  :class="[
                    'px-6 py-2 rounded-lg font-medium transition-colors',
                    confirmButtonClass
                  ]"
                >
                  {{ confirmText }}
                </button>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  closeOnBackdrop?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  confirmText: 'OK',
  cancelText: 'Annuler',
  isConfirm: false,
  closeOnBackdrop: true,
});

const emit = defineEmits<Emits>();

// Configuration des couleurs selon le type
const iconEmoji = computed(() => {
  switch (props.type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'confirm': return '❓';
    default: return 'ℹ️';
  }
});

const headerColorClass = computed(() => {
  switch (props.type) {
    case 'success': return 'bg-green-50 dark:bg-green-900/20';
    case 'error': return 'bg-red-50 dark:bg-red-900/20';
    case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20';
    case 'confirm': return 'bg-blue-50 dark:bg-blue-900/20';
    default: return 'bg-gray-50 dark:bg-gray-900/20';
  }
});

const iconBackgroundClass = computed(() => {
  switch (props.type) {
    case 'success': return 'bg-green-100 dark:bg-green-800';
    case 'error': return 'bg-red-100 dark:bg-red-800';
    case 'warning': return 'bg-yellow-100 dark:bg-yellow-800';
    case 'confirm': return 'bg-blue-100 dark:bg-blue-800';
    default: return 'bg-gray-100 dark:bg-gray-700';
  }
});

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'success': return 'bg-green-600 hover:bg-green-700 text-white';
    case 'error': return 'bg-red-600 hover:bg-red-700 text-white';
    case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 text-white';
    case 'confirm': return 'bg-blue-600 hover:bg-blue-700 text-white';
    default: return 'bg-blue-600 hover:bg-blue-700 text-white';
  }
});

function handleClose() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  emit('confirm');
  emit('update:modelValue', false);
}

function handleCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    handleClose();
  }
}
</script>

<style scoped>
/* Animations pour le backdrop */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Animations pour le modal */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s ease;
}

.modal-slide-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
