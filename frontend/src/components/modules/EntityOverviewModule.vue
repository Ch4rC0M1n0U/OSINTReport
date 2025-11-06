<template>
  <div class="entity-overview-module max-w-5xl mx-auto">
    <!-- En-tête avec actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">👤 Entités identifiées</span>
        <span class="badge badge-neutral">{{ findings.length }}</span>
        <span v-if="richTextBlocks.length > 0" class="badge badge-info">
          {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-outline gap-2"
          @click="addRichTextBlock"
          title="Ajouter un bloc de texte enrichi"
        >
          <span>📝</span>
          <span>Ajouter un texte</span>
        </button>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary gap-2"
          @click="openCreateModal"
        >
          <span>➕</span>
          <span>Nouvelle entité</span>
        </button>
      </div>
    </div>

    <!-- Blocs de texte enrichi -->
    <RichTextBlockList
      v-if="richTextBlocks.length > 0"
      :blocks="richTextBlocks"
      :readonly="readonly"
      :report-id="reportId"
      :findings="findings"
      placeholder="Ajoutez des informations sur les entités identifiées... Utilisez le bouton 👤 pour insérer des entités."
      class="mb-4"
      @update="emitUpdate"
      @delete="deleteBlock"
      @move-up="moveBlockUp"
      @move-down="moveBlockDown"
    />

    <!-- Liste des entités (cartes compactes) -->
    <div v-if="findings.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <EntityCard
        v-for="(entity, index) in findings"
        :key="index"
        :entity="entity"
        @edit="openEditModal(index)"
        @duplicate="duplicateEntity(index)"
        @delete="deleteEntity(index)"
      />
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-12 bg-base-200 rounded-lg">
      <div class="text-6xl mb-4">👤</div>
      <p class="text-base-content/60 mb-4">
        Aucune entité identifiée pour le moment
      </p>
      <button
        v-if="!readonly"
        type="button"
        class="btn btn-sm btn-primary gap-2"
        @click="openCreateModal"
      >
        <span>➕</span>
        <span>Ajouter la première entité</span>
      </button>
    </div>

    <!-- Modal CRUD -->
    <EntityEditModal
      :is-open="isModalOpen"
      :entity="editingEntity"
      :existing-labels="existingLabels"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import EntityCard from './EntityCard.vue';
import EntityEditModal from './EntityEditModal.vue';
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

const props = defineProps<{
  modelValue: {
    findings?: Finding[];
    richTextBlocks?: any[];
  };
  readonly?: boolean;
  reportId?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { findings: Finding[]; richTextBlocks?: any[] }): void;
}>();

// État local
const findings = ref<Finding[]>([]);
const isModalOpen = ref(false);
const editingEntity = ref<Finding | null>(null);
const editingIndex = ref<number | null>(null);

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || [], emitUpdate);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue?.findings || [];
    if (newValue?.richTextBlocks) {
      setBlocks(newValue.richTextBlocks);
    }
  },
  { immediate: true, deep: true }
);

function emitUpdate() {
  emit('update:modelValue', {
    findings: findings.value,
    richTextBlocks: richTextBlocks.value,
  });
}

// Labels existants pour validation d'unicité
const existingLabels = computed(() => {
  return findings.value
    .filter((_, i) => i !== editingIndex.value)
    .map(f => f.label);
});

// Ouvrir modal création
function openCreateModal() {
  editingEntity.value = null;
  editingIndex.value = null;
  isModalOpen.value = true;
}

// Ouvrir modal édition
function openEditModal(index: number) {
  editingEntity.value = JSON.parse(JSON.stringify(findings.value[index]));
  editingIndex.value = index;
  isModalOpen.value = true;
}

// Dupliquer une entité
function duplicateEntity(index: number) {
  const original = findings.value[index];
  const duplicate: Finding = JSON.parse(JSON.stringify(original));
  duplicate.label = `${original.label} (copie)`;
  
  editingEntity.value = duplicate;
  editingIndex.value = null;
  isModalOpen.value = true;
}

// Supprimer une entité
function deleteEntity(index: number) {
  const updated = [...findings.value];
  updated.splice(index, 1);
  findings.value = updated;
  emitUpdate();
}

// Fermer modal
function closeModal() {
  isModalOpen.value = false;
  editingEntity.value = null;
  editingIndex.value = null;
}

// Sauvegarder (création ou mise à jour)
function handleSave(entity: Finding) {
  const updated = [...findings.value];
  
  if (editingIndex.value !== null) {
    updated[editingIndex.value] = entity;
  } else {
    updated.push(entity);
  }
  
  findings.value = updated;
  emitUpdate();
  closeModal();
}
</script>

<style scoped>
.entity-overview-module {
  @apply space-y-4;
}
</style>
