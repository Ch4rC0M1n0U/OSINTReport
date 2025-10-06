<template>
  <div class="space-y-2">
    <label class="label">
      <span class="label-text text-xs">🔗 Identifiants liés</span>
      <span class="label-text-alt text-xs opacity-60">
        Lier des identifiants déjà analysés dans le rapport
      </span>
    </label>

    <!-- Liste des identifiants déjà liés -->
    <div v-if="selectedIdentifiers.length > 0" class="space-y-1">
      <div
        v-for="(identifier, index) in selectedIdentifiers"
        :key="identifier.finding.label"
        class="flex items-center gap-2 p-2 bg-base-200 rounded text-xs"
      >
        <span class="badge badge-sm badge-primary">{{ getIdentifierType(identifier) }}</span>
        <span class="flex-1 font-mono">{{ identifier.finding.label }}</span>
        <button
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          @click="removeIdentifier(index)"
          title="Retirer le lien"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Sélecteur pour ajouter un identifiant -->
    <div v-if="availableIdentifiers.length > 0" class="join w-full">
      <select
        v-model="selectedIdentifierId"
        class="select select-bordered select-sm join-item flex-1"
      >
        <option value="">-- Ajouter un identifiant --</option>
        <option
          v-for="identifier in availableIdentifiers"
          :key="identifier.finding.label"
          :value="identifier.finding.label"
        >
          {{ getIdentifierType(identifier) }} - {{ identifier.finding.label }}
        </option>
      </select>
      <button
        type="button"
        class="btn btn-sm btn-primary join-item"
        :disabled="!selectedIdentifierId"
        @click="addIdentifier"
      >
        + Ajouter
      </button>
    </div>

    <!-- Message si aucun identifiant disponible -->
    <div v-else-if="selectedIdentifiers.length === 0" class="text-xs text-base-content/60 italic p-2">
      Aucun identifiant disponible dans ce rapport.
      <br />
      Créez d'abord un module "Recherche d'identifiant".
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Finding } from '@/services/api/reports';

interface IdentifierWithIndex {
  finding: Finding;
  moduleId: string;
  index: number;
}

const props = defineProps<{
  modelValue: string[]; // Labels des identifiants liés
  allIdentifiers: IdentifierWithIndex[]; // Tous les identifiants du rapport avec leur contexte
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const selectedIdentifierId = ref('');

// Identifiants déjà sélectionnés
const selectedIdentifiers = computed(() => {
  return props.modelValue
    .map(label => props.allIdentifiers.find(i => i.finding.label === label))
    .filter(Boolean) as IdentifierWithIndex[];
});

// Identifiants disponibles (non encore liés)
const availableIdentifiers = computed(() => {
  return props.allIdentifiers.filter(
    identifier => !props.modelValue.includes(identifier.finding.label)
  );
});

function getIdentifierType(identifier: IdentifierWithIndex): string {
  // Détection automatique du type selon le label
  const label = identifier.finding.label.toLowerCase();
  
  if (label.includes('@') && label.includes('.')) {
    return '� Email';
  }
  if (label.match(/^\+?\d{8,15}$/)) {
    return '� Téléphone';
  }
  if (label.startsWith('@')) {
    return '� Username';
  }
  
  return '🔖 Identifiant';
}

function addIdentifier() {
  if (selectedIdentifierId.value) {
    const updated = [...props.modelValue, selectedIdentifierId.value];
    emit('update:modelValue', updated);
    selectedIdentifierId.value = '';
  }
}

function removeIdentifier(index: number) {
  const identifier = selectedIdentifiers.value[index];
  const updated = props.modelValue.filter(label => label !== identifier.finding.label);
  emit('update:modelValue', updated);
}
</script>
