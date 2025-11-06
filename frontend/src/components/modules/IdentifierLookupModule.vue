<template>
  <div class="identifier-lookup-module max-w-5xl mx-auto">
    <!-- En-tête avec actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">🔍 Recherche d'identifiants</span>
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
          <span>Nouvel identifiant</span>
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
      placeholder="Ajoutez des informations sur la recherche d'identifiants... Utilisez le bouton 👤 pour insérer des entités."
      class="mb-4"
      @update="emitUpdate"
      @delete="deleteBlock"
      @move-up="moveBlockUp"
      @move-down="moveBlockDown"
    />

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
      :report-id="reportId"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue';
import type { Finding } from '@/services/api/reports';
import IdentifierCard from './IdentifierCard.vue';
import IdentifierEditModal from './IdentifierEditModal.vue';
import { useRichTextBlocks } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

const props = defineProps<{
  modelValue: {
    findings?: Finding[];
    richTextBlocks?: any[];
  };
  readonly?: boolean;
  reportId?: string; // UID du rapport pour screenshots
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { findings: Finding[]; richTextBlocks?: any[] }): void;
}>();

// Injecter les findings depuis le contexte du rapport (si disponibles)
const allFindings = inject<Finding[]>('reportFindings', []);

// État local
const findings = ref<Finding[]>([]);
const isModalOpen = ref(false);
const editingIdentifier = ref<Finding | null>(null);
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
  emit('update:modelValue', { 
    findings: findings.value,
    richTextBlocks: richTextBlocks.value,
  });
}
</script>

<style scoped>
.identifier-lookup-module {
  @apply space-y-4;
}
</style>
