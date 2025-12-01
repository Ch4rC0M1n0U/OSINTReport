<template>
  <div class="platform-analysis-module max-w-5xl mx-auto">
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
        <!-- Bouton Import avec sous-menu -->
        <div v-if="!readonly" class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-sm btn-outline gap-2">
            <span>📥</span>
            <span>Import</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </label>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-300">
            <li class="menu-title">
              <span>Sources d'import</span>
            </li>
            <li>
              <button @click="openElephantasticImport" class="gap-2">
                <span>🐘</span>
                <span>Elephantastic</span>
              </button>
            </li>
            <li class="disabled">
              <span class="gap-2 opacity-50">
                <span>🔍</span>
                <span>Maltego (bientôt)</span>
              </span>
            </li>
            <li class="disabled">
              <span class="gap-2 opacity-50">
                <span>🕷️</span>
                <span>SpiderFoot (bientôt)</span>
              </span>
            </li>
          </ul>
        </div>
        
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
    <div v-if="richTextBlocks.length > 0" class="space-y-4 mb-6 max-w-5xl mx-auto">
      <div
        v-for="(block, index) in richTextBlocks"
        :key="block.id"
        class="card bg-base-100 border-2 border-base-300 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden"
      >
        <div class="card-body p-5 space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1">
              <span class="badge badge-primary badge-lg font-semibold gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Bloc {{ index + 1 }}
              </span>
              <input
                v-if="!readonly"
                v-model="block.title"
                type="text"
                placeholder="Titre du bloc (optionnel)"
                class="input input-sm input-bordered flex-1 max-w-xs border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 rounded-lg"
                @input="emitUpdate"
              />
              <span v-else-if="block.title" class="text-base-content/70 font-medium">
                {{ block.title }}
              </span>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                v-if="!readonly && index > 0"
                type="button"
                @click="moveBlockUp(index)"
                class="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 hover:text-primary transition-all duration-200"
                title="Déplacer vers le haut"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                v-if="!readonly && index < richTextBlocks.length - 1"
                type="button"
                @click="moveBlockDown(index)"
                class="btn btn-ghost btn-sm btn-circle hover:bg-primary/10 hover:text-primary transition-all duration-200"
                title="Déplacer vers le bas"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                v-if="!readonly"
                type="button"
                @click="deleteBlock(index)"
                class="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10 transition-all duration-200"
                title="Supprimer ce bloc"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
    
    <!-- Modal Import Elephantastic -->
    <ElephantasticImportModal
      :is-open="isElephantasticModalOpen"
      :existing-profiles="existingProfiles"
      @close="isElephantasticModalOpen = false"
      @import="handleElephantasticImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Finding } from '@/services/api/reports';
import PlatformCard from './PlatformCard.vue';
import PlatformEditModal from './PlatformEditModal.vue';
import WysiwygEditor from '../shared/WysiwygEditor.vue';
import ElephantasticImportModal from '../import/ElephantasticImportModal.vue';

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
const isElephantasticModalOpen = ref(false);
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

// Ouvrir modal import Elephantastic
function openElephantasticImport() {
  isElephantasticModalOpen.value = true;
}

// Gérer l'import Elephantastic
async function handleElephantasticImport(importedFindings: Finding[]) {
  if (importedFindings.length === 0) return;
  
  // Télécharger les images externes de chaque finding
  const { downloadExternalImages } = await import('@/services/import/elephantastic');
  
  const findingsWithLocalImages = await Promise.all(
    importedFindings.map(finding => downloadExternalImages(finding, props.reportId))
  );
  
  // Ajouter les findings importés avec images locales
  findings.value = [...findings.value, ...findingsWithLocalImages];
  emitUpdate();
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
