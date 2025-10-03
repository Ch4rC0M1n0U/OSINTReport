import { ref } from 'vue';

interface ModalConfig {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export function useModal() {
  const isOpen = ref(false);
  const config = ref<ModalConfig>({
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Annuler',
  });

  let resolvePromise: ((value: boolean) => void) | null = null;

  /**
   * Afficher un modal d'information
   */
  function showAlert(message: string, title = 'Information', type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    config.value = {
      title,
      message,
      type,
      confirmText: 'OK',
    };
    isOpen.value = true;

    return new Promise<void>((resolve) => {
      const handleClose = () => {
        isOpen.value = false;
        resolve();
      };
      resolvePromise = handleClose as any;
    });
  }

  /**
   * Afficher un modal de succès
   */
  function showSuccess(message: string, title = 'Succès') {
    return showAlert(message, title, 'success');
  }

  /**
   * Afficher un modal d'erreur
   */
  function showError(message: string, title = 'Erreur') {
    return showAlert(message, title, 'error');
  }

  /**
   * Afficher un modal d'avertissement
   */
  function showWarning(message: string, title = 'Attention') {
    return showAlert(message, title, 'warning');
  }

  /**
   * Afficher un modal de confirmation
   */
  function showConfirm(
    message: string,
    title = 'Confirmation',
    confirmText = 'Confirmer',
    cancelText = 'Annuler'
  ): Promise<boolean> {
    config.value = {
      title,
      message,
      type: 'confirm',
      confirmText,
      cancelText,
    };
    isOpen.value = true;

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  }

  /**
   * Confirmer avec un message de danger
   */
  function showDangerConfirm(
    message: string,
    title = 'Action dangereuse',
    confirmText = 'Supprimer',
    cancelText = 'Annuler'
  ): Promise<boolean> {
    config.value = {
      title,
      message,
      type: 'error',
      confirmText,
      cancelText,
    };
    isOpen.value = true;

    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve;
    });
  }

  function handleConfirm() {
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;
    }
    isOpen.value = false;
  }

  function handleCancel() {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
    isOpen.value = false;
  }

  function close() {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }
    isOpen.value = false;
  }

  return {
    // État
    isOpen,
    config,
    
    // Méthodes d'affichage
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showDangerConfirm,
    
    // Gestionnaires
    handleConfirm,
    handleCancel,
    close,
  };
}
