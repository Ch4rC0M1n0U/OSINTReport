<template>
  <div class="platform-analysis-module">
    <!-- En-tête avec actions -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-semibold">📱 Analyse de plateformes</span>
        <span class="badge badge-neutral">{{ findings.length }}</span>
      </div>
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

const props = defineProps<{
  modelValue: {
    findings?: Finding[];
    platform?: string;
  };
  readonly?: boolean;
  reportId?: string; // UID du rapport pour isolation des screenshots
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: { findings: Finding[]; platform?: string }): void;
}>();

// État local
const findings = ref<Finding[]>([]);
const isModalOpen = ref(false);
const editingProfile = ref<Finding | null>(null);
const editingIndex = ref<number | null>(null);

// Synchroniser avec modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    findings.value = newValue?.findings || [];
  },
  { immediate: true, deep: true }
);

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
    platform: props.modelValue.platform 
  });
}
</script>

<style scoped>
.platform-analysis-module {
  @apply space-y-4;
}
</style>
