<template>
  <div class="platform-analysis-module">
    <!-- En-tête avec actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">📱 Analyse de plateformes</span>
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
          <span>Ajouter un bloc de texte</span>
        </button>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary gap-2"
          @click="openCreateModal"
        >
          <span>➕</span>
          <span>Nouveau profil</span>
        </button>
      </div>
    </div>

    <!-- Blocs de texte enrichi -->
    <div v-if="richTextBlocks.length > 0" class="space-y-4 mb-6">
      <div
        v-for="(block, index) in richTextBlocks"
        :key="block.id"
        class="card bg-base-100 border border-base-300 p-4"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-base">📝 Bloc {{ index + 1 }}</span>
            <input
              v-if="!readonly"
              v-model="block.title"
              type="text"
              placeholder="Titre du bloc (optionnel)"
              class="input input-sm input-bordered flex-1 max-w-xs"
              @input="emitUpdate"
            />
            <span v-else-if="block.title" class="text-base-content/70">
              — {{ block.title }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!readonly && index > 0"
              type="button"
              @click="moveBlockUp(index)"
              class="btn btn-ghost btn-xs"
              title="Déplacer vers le haut"
            >
              ↑
            </button>
            <button
              v-if="!readonly && index < richTextBlocks.length - 1"
              type="button"
              @click="moveBlockDown(index)"
              class="btn btn-ghost btn-xs"
              title="Déplacer vers le bas"
            >
              ↓
            </button>
            <button
              v-if="!readonly"
              type="button"
              @click="deleteBlock(index)"
              class="btn btn-ghost btn-xs btn-circle text-error"
              title="Supprimer ce bloc"
            >
              ✕
            </button>
          </div>
        </div>
        <WysiwygEditor
          v-model="block.content"
          :placeholder="`Ajoutez votre analyse... Utilisez le bouton 👤 pour insérer des entités ou des données de plateforme.`"
          :enable-entity-insertion="true"
          :report-id="reportId"
          :findings="findings"
          @update:model-value="emitUpdate"
        />
      </div>
    </div>

    <!-- Liste des profils (cartes compactes) -->
    <div v-if="findings.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <PlatformCard
        v-for="(profile, index) in findings"
        :key="index"
        :profile="profile"
        @edit="openEditModal(index)"
        @duplicate="duplicateProfile(index)"
        @delete="deleteProfile(index)"
      />
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-12 bg-base-200 rounded-lg">
      <div class="text-6xl mb-4">📱</div>
      <p class="text-base-content/60 mb-4">
        Aucun profil de plateforme analysé
      </p>
      <button
        v-if="!readonly"
        type="button"
        class="btn btn-sm btn-primary gap-2"
        @click="openCreateModal"
      >
        <span>➕</span>
        <span>Ajouter le premier profil</span>
      </button>
    </div>

    <!-- Modal CRUD -->
    <PlatformEditModal
      :is-open="isModalOpen"
      :profile="editingProfile"
      :existing-profiles="existingProfiles"
      :report-id="reportId"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import PlatformCard from './PlatformCard.vue';
import PlatformEditModal from './PlatformEditModal.vue';
import WysiwygEditor from '../shared/WysiwygEditor.vue';

interface RichTextBlock {
  id: string;
  title: string;
  content: string;
}

const props = defineProps<{
  modelValue: {
    findings?: Finding[];
    platform?: string;
    notes?: string; // LEGACY: pour compatibilité ascendante
    richTextBlocks?: RichTextBlock[];
  };
  readonly?: boolean;
  reportId?: string; // UID du rapport pour isolation des screenshots
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { 
    findings: Finding[]; 
    platform?: string; 
    notes?: string;
    richTextBlocks?: RichTextBlock[];
  }): void;
}>();

// État local
const findings = ref<Finding[]>([]);
const richTextBlocks = ref<RichTextBlock[]>([]);
const isModalOpen = ref(false);
const editingProfile = ref<Finding | null>(null);
const editingIndex = ref<number | null>(null);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue?.findings || [];
    
    // Migrer les anciennes notes vers richTextBlocks si nécessaire
    if (newValue?.richTextBlocks) {
      richTextBlocks.value = newValue.richTextBlocks;
    } else if (newValue?.notes && newValue.notes.trim().length > 0) {
      // Migration: convertir l'ancien champ notes en un bloc
      richTextBlocks.value = [{
        id: generateId(),
        title: 'Notes migrées',
        content: newValue.notes
      }];
    } else {
      richTextBlocks.value = [];
    }
  },
  { immediate: true, deep: true }
);

// Générer un ID unique
function generateId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Ajouter un nouveau bloc de texte
function addRichTextBlock() {
  richTextBlocks.value.push({
    id: generateId(),
    title: '',
    content: ''
  });
  emitUpdate();
}

// Supprimer un bloc
function deleteBlock(index: number) {
  if (confirm('Supprimer ce bloc de texte ?')) {
    richTextBlocks.value.splice(index, 1);
    emitUpdate();
  }
}

// Déplacer un bloc vers le haut
function moveBlockUp(index: number) {
  if (index > 0) {
    const temp = richTextBlocks.value[index];
    richTextBlocks.value[index] = richTextBlocks.value[index - 1];
    richTextBlocks.value[index - 1] = temp;
    emitUpdate();
  }
}

// Déplacer un bloc vers le bas
function moveBlockDown(index: number) {
  if (index < richTextBlocks.value.length - 1) {
    const temp = richTextBlocks.value[index];
    richTextBlocks.value[index] = richTextBlocks.value[index + 1];
    richTextBlocks.value[index + 1] = temp;
    emitUpdate();
  }
}

// Profils existants pour validation d'unicité
const existingProfiles = computed(() => {
  return findings.value
    .filter((_, i) => i !== editingIndex.value)
    .map(f => f.label);
});

// Ouvrir modal création
function openCreateModal() {
  editingProfile.value = null;
  editingIndex.value = null;
  isModalOpen.value = true;
}

// Ouvrir modal édition
function openEditModal(index: number) {
  editingProfile.value = JSON.parse(JSON.stringify(findings.value[index]));
  editingIndex.value = index;
  isModalOpen.value = true;
}

// Dupliquer un profil
function duplicateProfile(index: number) {
  const original = findings.value[index];
  const duplicate: Finding = JSON.parse(JSON.stringify(original));
  duplicate.label = `${original.label} (copie)`;
  
  editingProfile.value = duplicate;
  editingIndex.value = null;
  isModalOpen.value = true;
}

// Supprimer un profil
function deleteProfile(index: number) {
  const updated = [...findings.value];
  updated.splice(index, 1);
  findings.value = updated;
  emitUpdate();
}

// Fermer modal
function closeModal() {
  isModalOpen.value = false;
  editingProfile.value = null;
  editingIndex.value = null;
}

// Sauvegarder (création ou mise à jour)
function handleSave(profile: Finding) {
  const updated = [...findings.value];
  
  if (editingIndex.value !== null) {
    updated[editingIndex.value] = profile;
  } else {
    updated.push(profile);
  }
  
  findings.value = updated;
  emitUpdate();
  closeModal();
}

// Émettre la mise à jour
function emitUpdate() {
  emit('update:modelValue', { 
    findings: findings.value,
    platform: props.modelValue.platform,
    richTextBlocks: richTextBlocks.value,
    // notes: deprecated, gardé pour compatibilité
    notes: richTextBlocks.value.length > 0 
      ? richTextBlocks.value.map(b => b.content).join('\n\n')
      : undefined
  });
}
</script>

<style scoped>
.platform-analysis-module {
  @apply space-y-4;
}
</style>
