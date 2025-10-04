/**
 * ✅ Composable useConfirmDelete
 * 
 * Confirmation modale avant suppression
 * - Message personnalisable
 * - Style adapté (danger)
 * - Retour boolean
 */

import { ref } from 'vue';

export interface ConfirmDeleteOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface ConfirmDeleteState {
  isOpen: boolean;
  itemToDelete: any;
  confirm: (item: any, options?: ConfirmDeleteOptions) => Promise<boolean>;
  cancel: () => void;
}

export function useConfirmDelete() {
  const isOpen = ref(false);
  const itemToDelete = ref<any>(null);
  const title = ref('Confirmer la suppression');
  const message = ref('Êtes-vous sûr de vouloir supprimer cet élément ?');
  const confirmText = ref('Supprimer');
  const cancelText = ref('Annuler');
  
  let resolvePromise: ((value: boolean) => void) | null = null;

  async function confirm(
    item: any,
    options: ConfirmDeleteOptions = {}
  ): Promise<boolean> {
    itemToDelete.value = item;
    title.value = options.title || 'Confirmer la suppression';
    message.value = options.message || `Êtes-vous sûr de vouloir supprimer "${item.label || 'cet élément'}" ?`;
    confirmText.value = options.confirmText || 'Supprimer';
    cancelText.value = options.cancelText || 'Annuler';
    
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  }

  function handleConfirm() {
    isOpen.value = false;
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
  }

  function handleCancel() {
    isOpen.value = false;
    itemToDelete.value = null;
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
  }

  return {
    isOpen,
    itemToDelete,
    title,
    message,
    confirmText,
    cancelText,
    confirm,
    handleConfirm,
    handleCancel
  };
}
