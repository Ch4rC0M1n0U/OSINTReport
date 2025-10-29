<template>
  <div class="space-y-4">
    <!-- Mode lecture -->
    <div v-if="!isEditing" class="space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold">✍️ Signature du rédacteur</span>
        </div>
        <button
          v-if="!readonly"
          type="button"
          class="btn btn-sm btn-primary"
          @click="startEditing"
        >
          ✏️ {{ hasSignature ? 'Modifier' : 'Signer le rapport' }}
        </button>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body">
          <!-- Date -->
          <div class="mb-3">
            <span class="text-sm opacity-70">Date de signature:</span>
            <div class="text-lg font-semibold">
              {{ modelValue.date ? new Date(modelValue.date).toLocaleDateString('fr-FR') : 'Non signé' }}
            </div>
          </div>

          <!-- Informations du rédacteur -->
          <div v-if="modelValue.officer" class="divider my-2"></div>
          <div v-if="modelValue.officer" class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-sm opacity-70">Nom:</span>
              <div class="font-medium">{{ modelValue.officer.name || '—' }}</div>
            </div>
            <div>
              <span class="text-sm opacity-70">Grade:</span>
              <div class="font-medium">{{ modelValue.officer.rank || '—' }}</div>
            </div>
            <div>
              <span class="text-sm opacity-70">Unité:</span>
              <div class="font-medium">{{ modelValue.officer.unit || '—' }}</div>
            </div>
            <div v-if="modelValue.officer.badgeNumber">
              <span class="text-sm opacity-70">Matricule:</span>
              <div class="font-medium font-mono">{{ modelValue.officer.badgeNumber }}</div>
            </div>
          </div>

          <!-- Signature manuscrite -->
          <div v-if="currentUserSignatureUrl" class="mt-4 pt-4 border-t border-base-300">
            <span class="text-sm opacity-70">Signature manuscrite:</span>
            <div class="mt-2 inline-block max-w-md w-full bg-base-100 p-4 rounded-lg">
              <ProtectedSignature 
                :src="currentUserSignatureUrl"
                alt="Signature du rédacteur"
                class="max-h-32"
              />
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
        <h4 class="font-semibold">✏️ {{ hasSignature ? 'Modification' : 'Signature' }} du rapport</h4>
        <div class="flex gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="cancelEditing">
            Annuler
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="saveChanges">
            💾 Signer et enregistrer
          </button>
        </div>
      </div>

      <!-- Avertissement -->
      <div class="alert alert-info shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 class="font-bold">ℹ️ Signature du rapport</h3>
          <div class="text-sm">
            Vos informations de profil (nom, grade, unité, matricule) et votre signature manuscrite seront automatiquement utilisées.
            Assurez-vous que votre profil est à jour avant de signer.
          </div>
        </div>
      </div>

      <div class="card bg-base-200 shadow-sm">
        <div class="card-body">
          <!-- Date -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Date de signature</span>
            </label>
            <input
              v-model="editedDate"
              type="date"
              class="input input-bordered"
            />
          </div>

          <!-- Aperçu des informations (lecture seule) -->
          <div class="divider">Vos informations (depuis votre profil)</div>
          
          <div class="grid grid-cols-2 gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom complet</span>
              </label>
              <input
                :value="userFullName"
                type="text"
                class="input input-bordered"
                disabled
                readonly
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Grade</span>
              </label>
              <input
                :value="authStore.user?.grade || 'Non renseigné'"
                type="text"
                class="input input-bordered"
                disabled
                readonly
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Matricule</span>
              </label>
              <input
                :value="authStore.user?.matricule || 'Non renseigné'"
                type="text"
                class="input input-bordered"
                disabled
                readonly
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Unité / Service</span>
              </label>
              <input
                :value="authStore.user?.unit || 'Non renseigné'"
                type="text"
                class="input input-bordered"
                disabled
                readonly
              />
            </div>
          </div>

          <!-- Aperçu de la signature -->
          <div v-if="currentUserSignatureUrl" class="mt-4">
            <label class="label">
              <span class="label-text">Votre signature manuscrite</span>
            </label>
            <div class="inline-block max-w-md w-full bg-base-100 p-4 rounded-lg border border-base-300">
              <ProtectedSignature 
                :src="currentUserSignatureUrl"
                alt="Votre signature"
                class="max-h-32"
              />
            </div>
          </div>
          <div v-else class="alert alert-warning mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <span class="font-bold">Aucune signature manuscrite</span>
              <span class="text-sm">Ajoutez votre signature dans votre profil avant de signer le rapport.</span>
            </div>
          </div>

          <!-- Notes additionnelles -->
          <div class="form-control mt-4">
            <label class="label">
              <span class="label-text">Notes additionnelles (optionnel)</span>
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
import { ref, watch, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { SignOffPayload } from '@/services/api/reports';
import ProtectedSignature from '@/components/ProtectedSignature.vue';

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

const authStore = useAuthStore();
const isEditing = ref(false);
const editedDate = ref(props.modelValue.date || new Date().toISOString().split('T')[0]);
const editedNotes = ref(props.modelValue.additionalNotes || '');

const userFullName = computed(() => {
  if (authStore.user) {
    return `${authStore.user.firstName} ${authStore.user.lastName}`;
  }
  return 'Non renseigné';
});

const currentUserSignatureUrl = computed(() => {
  return authStore.user?.signatureUrl || null;
});

const hasSignature = computed(() => {
  return !!(props.modelValue.date && props.modelValue.officer?.name);
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!isEditing.value) {
      editedDate.value = newValue.date || new Date().toISOString().split('T')[0];
      editedNotes.value = newValue.additionalNotes || '';
    }
  },
  { deep: true }
);

function startEditing() {
  editedDate.value = props.modelValue.date || new Date().toISOString().split('T')[0];
  editedNotes.value = props.modelValue.additionalNotes || '';
  isEditing.value = true;
}

function cancelEditing() {
  isEditing.value = false;
}

function saveChanges() {
  // Construire l'objet officer avec les données du profil utilisateur
  const officer = {
    name: userFullName.value,
    rank: authStore.user?.grade || '',
    unit: authStore.user?.unit || '',
    badgeNumber: authStore.user?.matricule || undefined,
  };

  emit('update:modelValue', {
    date: editedDate.value,
    officer: officer,
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
