<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg font-semibold">🖼️ Galerie média</span>
          <span class="badge badge-neutral">{{ items.length }}</span>
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

      <!-- Description -->
      <div v-if="modelValue.description" class="alert">
        <p>{{ modelValue.description }}</p>
      </div>

      <!-- Grille de médias -->
      <div v-if="items.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div
          v-for="(item, index) in items"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-3">
            <div class="aspect-square bg-base-300 rounded flex items-center justify-center mb-2">
              <span class="text-4xl">🖼️</span>
            </div>
            <div class="text-sm font-semibold truncate">{{ item.caption }}</div>
            <div v-if="item.date" class="text-xs opacity-70">{{ item.date }}</div>
            <div v-if="item.source" class="text-xs opacity-70">Source: {{ item.source }}</div>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-12 opacity-60">
        <div class="text-5xl mb-3">🖼️</div>
        <p>Aucun média</p>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-ghost mt-3"
          @click="startEditing"
        >
          Ajouter un média
        </button>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification de la galerie</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Enregistrer
          </button>
        </div>
      </div>

      <!-- Description -->
      <div class="form-control">
        <label class="label"><span class="label-text">Description</span></label>
        <textarea
          v-model="editedDescription"
          class="textarea textarea-bordered"
          placeholder="Description de la galerie..."
          rows="2"
        ></textarea>
      </div>

      <!-- Liste des médias -->
      <div class="space-y-3">
        <div
          v-for="(item, index) in editedItems"
          :key="index"
          class="card bg-base-200 shadow-sm"
        >
          <div class="card-body p-3">
            <div class="flex justify-between items-start mb-2">
              <span class="font-semibold">Média #{{ index + 1 }}</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost btn-circle text-error"
                @click="removeItem(index)"
              >
                🗑️
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div class="form-control col-span-2">
                <input
                  v-model="item.attachmentId"
                  type="text"
                  placeholder="ID de pièce jointe"
                  class="input input-bordered input-sm"
                />
              </div>
              <div class="form-control col-span-2">
                <input
                  v-model="item.caption"
                  type="text"
                  placeholder="Légende"
                  class="input input-bordered input-sm"
                />
              </div>
              <div class="form-control">
                <input
                  v-model="item.date"
                  type="text"
                  placeholder="Date"
                  class="input input-bordered input-sm"
                />
              </div>
              <div class="form-control">
                <input
                  v-model="item.source"
                  type="text"
                  placeholder="Source"
                  class="input input-bordered input-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-outline btn-block" @click="addItem">
          + Ajouter un média
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { MediaGalleryPayload, MediaItem } from '@/services/api/reports';

const props = withDefaults(
  defineProps<{
    modelValue: MediaGalleryPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: MediaGalleryPayload): void;
}>();

const isEditing = ref(false);
const items = ref<MediaItem[]>(props.modelValue.items || []);
const editedItems = ref<MediaItem[]>([]);
const editedDescription = ref(props.modelValue.description || '');

watch(
  () => props.modelValue,
  (newValue) => {
    items.value = newValue.items || [];
  },
  { deep: true }
);

function startEditing() {
  editedItems.value = JSON.parse(JSON.stringify(items.value));
  editedDescription.value = props.modelValue.description || '';
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
  editedItems.value = [];
}

function saveChanges() {
  items.value = editedItems.value;
  emit('update:modelValue', {
    items: items.value,
    description: editedDescription.value || undefined
  });
  isEditing.value = false;
}

function addItem() {
  editedItems.value.push({
    attachmentId: '',
    caption: '',
    date: '',
    source: '',
  });
}

function removeItem(index: number) {
  editedItems.value.splice(index, 1);
}
</script>

<style scoped>
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
