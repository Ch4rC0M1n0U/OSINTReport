<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">🗄️ Conservation des données</span>
          <span class="badge badge-neutral">{{ datasets.length }}</span>
        </div>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary"
          @click="startEditing"
        >
          ✏️ Modifier
        </button>
      </div>

      <!-- Liste des datasets -->
      <div v-if="datasets.length > 0" class="space-y-3">
        <div
          v-for="(dataset, index) in datasets"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-4">
            <h4 class="font-bold">{{ dataset.label }}</h4>
            <p class="text-sm opacity-80">{{ dataset.description }}</p>
            <div class="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <span class="opacity-70">Politique:</span>
                <span class="ml-1 badge badge-warning badge-sm">{{ dataset.retentionPolicy }}</span>
              </div>
              <div v-if="dataset.location">
                <span class="opacity-70">Localisation:</span>
                <span class="ml-1 font-medium">{{ dataset.location }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 opacity-60">
        <div class="text-5xl mb-3">🗄️</div>
        <p>Aucune donnée enregistrée</p>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-ghost mt-3"
          @click="startEditing"
        >
          Ajouter une donnée
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
import { ref, watch } from 'vue';
import type { DataRetentionPayload, Dataset } from '@/services/api/reports';

const props = withDefaults(
  defineProps<{
    modelValue: DataRetentionPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: DataRetentionPayload): void;
}>();

const isEditing = ref(false);
const datasets = ref<Dataset[]>(props.modelValue.datasets || []);
const editedDatasets = ref<Dataset[]>([]);

watch(
  () => props.modelValue,
  (newValue) => {
    datasets.value = newValue.datasets || [];
  },
  { deep: true }
);

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
    datasets: datasets.value
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
