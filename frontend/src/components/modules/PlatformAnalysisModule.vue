<template>
  <div class="platform-analysis-module">
    <!-- En-tête avec actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">📱 Analyse de plateformes</span>
        <span class="badge badge-neutral">{{ findings.length }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-outline gap-2"
          @click="toggleTextSection"
        >
          <span>📝</span>
          <span>{{ showTextSection ? 'Masquer' : 'Ajouter' }} une rubrique texte</span>
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

    <!-- Section de texte enrichi (optionnelle) -->
    <div v-if="showTextSection" class="card bg-base-100 border border-base-300 p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-base">📝 Notes et analyse</h4>
        <button
          v-if="!readonly"
          type="button"
          @click="toggleTextSection"
          class="btn btn-ghost btn-xs btn-circle"
          title="Masquer la section"
        >
          ✕
        </button>
      </div>
      <WysiwygEditor
        v-model="notesText"
        placeholder="Ajoutez vos notes, analyses et observations concernant les plateformes... Utilisez le bouton 👤 pour insérer des entités."
        :enable-entity-insertion="true"
        :report-id="reportId"
      />
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

const props = defineProps<{
  modelValue: {
    findings?: Finding[];
    platform?: string;
    notes?: string;
  };
  readonly?: boolean;
  reportId?: string; // UID du rapport pour isolation des screenshots
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { findings: Finding[]; platform?: string; notes?: string }): void;
}>();

// État local
const findings = ref<Finding[]>([]);
const notesText = ref<string>('');
const showTextSection = ref(false);
const isModalOpen = ref(false);
const editingProfile = ref<Finding | null>(null);
const editingIndex = ref<number | null>(null);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue?.findings || [];
    notesText.value = newValue?.notes || '';
    // Afficher automatiquement la section si des notes existent
    if (newValue?.notes && newValue.notes.trim().length > 0) {
      showTextSection.value = true;
    }
  },
  { immediate: true, deep: true }
);

// Synchroniser les notes avec le parent
watch(notesText, () => {
  emitUpdate();
});

// Basculer l'affichage de la section de texte
function toggleTextSection() {
  showTextSection.value = !showTextSection.value;
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
    notes: notesText.value
  });
}
</script>

<style scoped>
.platform-analysis-module {
  @apply space-y-4;
}
</style>
