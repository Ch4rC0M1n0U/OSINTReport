/**
 * 🔄 Composable useAutoSave
 * 
 * Auto-sauvegarde avec debounce pour éditeurs WYSIWYG
 * - Délai configurable (défaut 2s)
 * - Indicateur visuel de sauvegarde
 * - Gestion des erreurs
 */

import { ref, watch, type Ref } from 'vue';

export interface AutoSaveOptions {
  delay?: number; // Délai en ms (défaut: 30000 = 30s)
  onSave: (value: string) => Promise<void>;
  enabled?: Ref<boolean>; // Activer/désactiver l'auto-save
}

export interface AutoSaveState {
  isSaving: Ref<boolean>;
  lastSaved: Ref<Date | null>;
  error: Ref<string | null>;
  saveNow: () => Promise<void>;
  cleanup: () => void;
}

export function useAutoSave(
  content: Ref<string>,
  options: AutoSaveOptions
): AutoSaveState {
  const delay = options.delay || 30000; // 30 secondes par défaut
  const isSaving = ref(false);
  const lastSaved = ref<Date | null>(null);
  const error = ref<string | null>(null);
  
  let timeoutId: NodeJS.Timeout | null = null;

  // Fonction de sauvegarde
  async function save(value: string) {
    if (isSaving.value) return;

    try {
      isSaving.value = true;
      error.value = null;
      
      await options.onSave(value);
      
      lastSaved.value = new Date();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur de sauvegarde';
      console.error('Auto-save failed:', err);
    } finally {
      isSaving.value = false;
    }
  }

  // Debounced save
  function debouncedSave(value: string) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      save(value);
    }, delay);
  }

  // Watcher sur le contenu
  watch(content, (newValue) => {
    // Ne sauvegarder que si activé
    if (options.enabled && !options.enabled.value) {
      return;
    }

    debouncedSave(newValue);
  });

  // Cleanup au démontage
  function cleanup() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  // Sauvegarde immédiate (pour bouton "Terminer")
  async function saveNow() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    await save(content.value);
  }

  return {
    isSaving,
    lastSaved,
    error,
    saveNow,
    cleanup
  };
}
