<template>
  <div class="identifier-lookup-module">
    <!-- En-tête avec actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">🔍 Recherche d'identifiants</span>
        <span class="badge badge-neutral">{{ findings.length }}</span>
      </div>
      <button
        v-if="!readonly"
        type="button"
        class="btn btn-sm btn-primary gap-2"
        @click="openCreateModal"
      >
        <span>➕</span>
        <span>Nouvel identifiant</span>
      </button>
    </div>

    <!-- Liste des identifiants (cartes compactes) -->
    <div v-if="findings.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <IdentifierCard
        v-for="(identifier, index) in findings"
        :key="index"
        :identifier="identifier"
        @edit="openEditModal(index)"
        @duplicate="duplicateIdentifier(index)"
        @delete="deleteIdentifier(index)"
      />
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-12 bg-base-200 rounded-lg">
      <div class="text-6xl mb-4">🔍</div>
      <p class="text-base-content/60 mb-4">
        Aucun identifiant recherché pour le moment
      </p>
      <button
        v-if="!readonly"
        type="button"
        class="btn btn-sm btn-primary gap-2"
        @click="openCreateModal"
      >
        <span>➕</span>
        <span>Ajouter le premier identifiant</span>
      </button>
    </div>

    <!-- Modal CRUD -->
    <IdentifierEditModal
      :is-open="isModalOpen"
      :identifier="editingIdentifier"
      :existing-values="existingValues"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import IdentifierCard from './IdentifierCard.vue';
import IdentifierEditModal from './IdentifierEditModal.vue';

const props = defineProps<{
  modelValue: {
    findings?: Finding[];
  };
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { findings: Finding[] }): void;
}>();

// État local
const findings = ref<Finding[]>([]);
const isModalOpen = ref(false);
const editingIdentifier = ref<Finding | null>(null);
const editingIndex = ref<number | null>(null);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue?.findings || [];
  },
  { immediate: true, deep: true }
);

// Valeurs existantes pour validation d'unicité
const existingValues = computed(() => {
  return findings.value
    .filter((_, i) => i !== editingIndex.value)
    .map(f => f.label);
});

// Ouvrir modal création
function openCreateModal() {
  editingIdentifier.value = null;
  editingIndex.value = null;
  isModalOpen.value = true;
}

// Ouvrir modal édition
function openEditModal(index: number) {
  editingIdentifier.value = JSON.parse(JSON.stringify(findings.value[index]));
  editingIndex.value = index;
  isModalOpen.value = true;
}

// Dupliquer un identifiant
function duplicateIdentifier(index: number) {
  const original = findings.value[index];
  const duplicate: Finding = JSON.parse(JSON.stringify(original));
  duplicate.label = `${original.label} (copie)`;
  
  editingIdentifier.value = duplicate;
  editingIndex.value = null;
  isModalOpen.value = true;
}

// Supprimer un identifiant
function deleteIdentifier(index: number) {
  const updated = [...findings.value];
  updated.splice(index, 1);
  findings.value = updated;
  emitUpdate();
}

// Fermer modal
function closeModal() {
  isModalOpen.value = false;
  editingIdentifier.value = null;
  editingIndex.value = null;
}

// Sauvegarder (création ou mise à jour)
function handleSave(identifier: Finding) {
  const updated = [...findings.value];
  
  if (editingIndex.value !== null) {
    updated[editingIndex.value] = identifier;
  } else {
    updated.push(identifier);
  }
  
  findings.value = updated;
  emitUpdate();
  closeModal();
}

// Émettre la mise à jour
function emitUpdate() {
  emit('update:modelValue', { findings: findings.value });
}
</script>

<style scoped>
.identifier-lookup-module {
  @apply space-y-4;
}
</style>
