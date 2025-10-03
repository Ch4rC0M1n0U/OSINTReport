<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">✍️ Validation finale</span>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary"
          @click="startEditing"
        >
          ✏️ Modifier
        </button>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body">
          <!-- Date -->
          <div class="mb-3">
            <span class="text-sm opacity-70">Date de validation:</span>
            <div class="text-lg font-semibold">
              {{ modelValue.date ? new Date(modelValue.date).toLocaleDateString('fr-FR') : 'Non définie' }}
            </div>
          </div>

          <!-- Officier -->
          <div class="divider my-2"></div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm opacity-70">Nom:</span>
              <div class="font-medium">{{ modelValue.officer?.name || '—' }}</div>
            </div>
            <div>
              <span class="text-sm opacity-70">Grade:</span>
              <div class="font-medium">{{ modelValue.officer?.rank || '—' }}</div>
            </div>
            <div>
              <span class="text-sm opacity-70">Unité:</span>
              <div class="font-medium">{{ modelValue.officer?.unit || '—' }}</div>
            </div>
            <div v-if="modelValue.officer?.badgeNumber">
              <span class="text-sm opacity-70">Matricule:</span>
              <div class="font-medium font-mono">{{ modelValue.officer.badgeNumber }}</div>
            </div>
          </div>

          <!-- Notes additionnelles -->
          <div v-if="modelValue.additionalNotes" class="mt-4 pt-4 border-t border-base-300">
            <span class="text-sm opacity-70">Notes:</span>
            <p class="mt-1 whitespace-pre-wrap">{{ modelValue.additionalNotes }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode édition -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-semibold">✏️ Modification de la validation</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Enregistrer
          </button>
        </div>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body">
          <!-- Date -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date de validation</span>
            </label>
            <input
              v-model="editedDate"
              type="date"
              class="input input-bordered"
            />
          </div>

          <!-- Officier -->
          <div class="divider">Informations de l'officier</div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom complet</span>
              </label>
              <input
                v-model="editedOfficer.name"
                type="text"
                placeholder="Ex: Jean Dupont"
                class="input input-bordered"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Grade</span>
              </label>
              <input
                v-model="editedOfficer.rank"
                type="text"
                placeholder="Ex: Inspecteur Principal"
                class="input input-bordered"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Unité</span>
              </label>
              <input
                v-model="editedOfficer.unit"
                type="text"
                placeholder="Ex: Brigade Cyber"
                class="input input-bordered"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Matricule (optionnel)</span>
              </label>
              <input
                v-model="editedOfficer.badgeNumber"
                type="text"
                placeholder="Ex: 12345"
                class="input input-bordered"
              />
            </div>
          </div>

          <!-- Notes additionnelles -->
          <div class="form-control mt-4">
            <label class="label">
              <span class="label-text">Notes additionnelles</span>
            </label>
            <textarea
              v-model="editedNotes"
              class="textarea textarea-bordered"
              placeholder="Notes complémentaires..."
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { SignOffPayload, Officer } from '@/services/api/reports';

const props = withDefaults(
  defineProps<{
    modelValue: SignOffPayload;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: SignOffPayload): void;
}>();

const isEditing = ref(false);
const editedDate = ref(props.modelValue.date || '');
const editedOfficer = ref<Officer>(props.modelValue.officer || { name: '', rank: '', unit: '' });
const editedNotes = ref(props.modelValue.additionalNotes || '');

watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEditing.value) {
      editedDate.value = newValue.date || '';
      editedOfficer.value = newValue.officer || { name: '', rank: '', unit: '' };
      editedNotes.value = newValue.additionalNotes || '';
    }
  },
  { deep: true }
);

function startEditing() {
  editedDate.value = props.modelValue.date || '';
  editedOfficer.value = JSON.parse(JSON.stringify(props.modelValue.officer || { name: '', rank: '', unit: '' }));
  editedNotes.value = props.modelValue.additionalNotes || '';
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

function saveChanges() {
  emit('update:modelValue', {
    date: editedDate.value,
    officer: editedOfficer.value,
    additionalNotes: editedNotes.value || undefined
  });
  isEditing.value = false;
}
</script>

<style scoped>
.card {
  transition: all 0.2s ease;
}
</style>
