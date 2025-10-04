/**
 * 🔍 Composable useValidation
 * 
 * Validation générique pour formulaires
 * - Règles configurables
 * - Messages d'erreur
 * - Validation temps réel
 */

import { ref, computed, type Ref } from 'vue';

export type ValidationRule<T = any> = {
  validate: (value: T, allValues?: any) => boolean;
  message: string;
};

export interface ValidationOptions<T = any> {
  rules: Record<string, ValidationRule<T>[]>;
  validateOn?: 'blur' | 'change' | 'submit';
}

export interface ValidationState {
  errors: Ref<Record<string, string[]>>;
  isValid: Ref<boolean>;
  validate: (field?: string) => boolean;
  reset: () => void;
  touch: (field: string) => void;
  touched: Ref<Record<string, boolean>>;
}

export function useValidation<T extends Record<string, any>>(
  formData: Ref<T>,
  options: ValidationOptions
): ValidationState {
  const errors = ref<Record<string, string[]>>({});
  const touched = ref<Record<string, boolean>>({});

  // Valider un champ spécifique
  function validateField(field: string): boolean {
    const rules = options.rules[field];
    if (!rules) return true;

    const fieldErrors: string[] = [];
    const value = formData.value[field];

    for (const rule of rules) {
      if (!rule.validate(value, formData.value)) {
        fieldErrors.push(rule.message);
      }
    }

    errors.value[field] = fieldErrors;
    return fieldErrors.length === 0;
  }

  // Valider tous les champs
  function validate(field?: string): boolean {
    if (field) {
      return validateField(field);
    }

    let isFormValid = true;
    for (const fieldName in options.rules) {
      const fieldValid = validateField(fieldName);
      if (!fieldValid) {
        isFormValid = false;
      }
    }

    return isFormValid;
  }

  // Marquer un champ comme touché
  function touch(field: string) {
    touched.value[field] = true;
  }

  // Réinitialiser les erreurs
  function reset() {
    errors.value = {};
    touched.value = {};
  }

  // Computed: est-ce que le formulaire est valide ?
  const isValid = computed(() => {
    for (const field in errors.value) {
      if (errors.value[field].length > 0) {
        return false;
      }
    }
    return true;
  });

  return {
    errors,
    isValid,
    validate,
    reset,
    touch,
    touched
  };
}

// Règles de validation communes
export const commonRules = {
  required: (message = 'Ce champ est requis'): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value != null;
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.length >= min;
      if (Array.isArray(value)) return value.length >= min;
      return true;
    },
    message: message || `Minimum ${min} caractères requis`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.length <= max;
      if (Array.isArray(value)) return value.length <= max;
      return true;
    },
    message: message || `Maximum ${max} caractères autorisés`
  }),

  email: (message = 'Email invalide'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  url: (message = 'URL invalide'): ValidationRule => ({
    validate: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  unique: <T>(
    existingValues: T[],
    compareFn: (a: T, b: T) => boolean,
    message = 'Cette valeur existe déjà'
  ): ValidationRule<T> => ({
    validate: (value) => {
      return !existingValues.some(existing => compareFn(value, existing));
    },
    message
  }),

  custom: (
    validateFn: (value: any, allValues?: any) => boolean,
    message: string
  ): ValidationRule => ({
    validate: validateFn,
    message
  })
};
