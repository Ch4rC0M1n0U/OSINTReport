<template>
  <div class="space-y-4 max-w-5xl mx-auto">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <!-- Carte de contenu -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-100 dark:border-gray-700">
          <div class="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
            <svg class="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Conservation des données</h2>
          <span class="ml-auto px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-semibold">
            {{ datasets.length }} dataset{{ datasets.length > 1 ? 's' : '' }}
          </span>
        </div>

        <div class="space-y-4">
          <!-- Blocs de texte enrichi -->
          <RichTextBlockList
            v-if="richTextBlocks.length > 0"
            :blocks="richTextBlocks"
            :readonly="readonly"
            :report-id="reportId"
            :findings="findings"
            placeholder="Ajoutez des informations sur la conservation des données... Utilisez le bouton 👤 pour insérer des entités."
            @update="emitUpdate"
            @delete="deleteBlock"
            @move-up="moveBlockUp"
            @move-down="moveBlockDown"
          />

          <!-- Liste des datasets -->
          <div v-if="datasets.length > 0" class="space-y-3">
            <div
              v-for="(dataset, index) in datasets"
              :key="index"
              class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <h4 class="font-bold text-gray-900 dark:text-white mb-2">{{ dataset.label }}</h4>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">{{ dataset.description }}</p>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-600 dark:text-gray-400">Politique:</span>
                  <span class="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded">
                    {{ dataset.retentionPolicy }}
                  </span>
                </div>
                <div v-if="dataset.location" class="flex items-center gap-2">
                  <span class="font-medium text-gray-600 dark:text-gray-400">Localisation:</span>
                  <span class="text-gray-900 dark:text-white font-semibold">{{ dataset.location }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div v-else-if="!richTextBlocks.length" class="text-center py-8">
            <svg class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 italic">Aucune donnée enregistrée</p>
          </div>
        </div>
      </div>

      <!-- Boutons -->
      <div class="flex items-center justify-between">
        <button
          v-if="!readonly && richTextBlocks.length > 0"
          type="button"
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-not-allowed"
          disabled
        >
          {{ richTextBlocks.length }} bloc{{ richTextBlocks.length > 1 ? 's' : '' }} de texte
        </button>
        <div class="flex-1"></div>
        <button
          v-if="!readonly"
          type="button"
          @click="startEditing"
          class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Modifier
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification des données</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Enregistrer
          </button>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="(dataset, index) in editedDatasets"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-3">
            <div class="flex justify-between mb-2">
              <span class="font-semibold">Dataset #{{ index + 1 }}</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-circle text-error"
                @click="removeDataset(index)"
              >
                🗑️
              </button>
            </div>

            <div class="space-y-2">
              <input
                v-model="dataset.label"
                type="text"
                placeholder="Type de données"
                class="input input-bordered input-sm w-full"
              />
              <textarea
                v-model="dataset.description"
                placeholder="Description"
                class="textarea textarea-bordered textarea-sm w-full"
                rows="2"
              ></textarea>
              <div class="grid grid-cols-2 gap-2">
                <input
                  v-model="dataset.retentionPolicy"
                  type="text"
                  placeholder="Politique de rétention"
                  class="input input-bordered input-sm"
                />
                <input
                  v-model="dataset.location"
                  type="text"
                  placeholder="Localisation"
                  class="input input-bordered input-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-block" @click="addDataset">
          + Ajouter un dataset
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import type { DataRetentionPayload, Dataset, Finding } from '@/services/api/reports';
import { useRichTextBlocks, type RichTextBlock } from '@/composables/useRichTextBlocks';
import RichTextBlockList from '@/components/shared/RichTextBlockList.vue';

const props = withDefaults(
  defineProps<{
    modelValue: DataRetentionPayload;
    readonly?: boolean;
    reportId?: string;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: DataRetentionPayload): void;
}>();

// Injecter les findings depuis le contexte du rapport
const findings = inject<Finding[]>('reportFindings', []);

const isEditing = ref(false);
const datasets = ref<Dataset[]>(props.modelValue.datasets || []);
const editedDatasets = ref<Dataset[]>([]);

// Gestion des blocs de texte riche
const {
  richTextBlocks,
  addRichTextBlock,
  deleteBlock,
  moveBlockUp,
  moveBlockDown,
  setBlocks,
} = useRichTextBlocks(props.modelValue.richTextBlocks || [], emitUpdate);

watch(
  () => props.modelValue,
  (newValue) => {
    datasets.value = newValue.datasets || [];
    if (newValue.richTextBlocks) {
      setBlocks(newValue.richTextBlocks);
    }
  },
  { deep: true }
);

function emitUpdate() {
  emit('update:modelValue', {
    datasets: datasets.value,
    richTextBlocks: richTextBlocks.value,
  });
}

function startEditing() {
  editedDatasets.value = JSON.parse(JSON.stringify(datasets.value));
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editedDatasets.value = [];
}

function saveChanges() {
  datasets.value = editedDatasets.value;
  emit('update:modelValue', {
    datasets: datasets.value,
    richTextBlocks: richTextBlocks.value,
  });
  isEditing.value = false;
}

function addDataset() {
  editedDatasets.value.push({
    label: '',
    description: '',
    retentionPolicy: '',
    location: '',
  });
}

function removeDataset(index: number) {
  editedDatasets.value.splice(index, 1);
}
</script>

<style scoped>
.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
