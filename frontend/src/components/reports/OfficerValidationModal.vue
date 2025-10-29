<template>
  <!-- Modal wrapper simple -->
  <div v-if="show" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">🔒 Validation officier</h3>
      
      <template v-if="report">
      <!-- Affichage si déjà validé -->
      <div v-if="report.isLocked && report.validatedAt" class="space-y-4">
        <div class="alert alert-success shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="font-bold">✅ Rapport validé et verrouillé</h3>
            <div class="text-sm">
              Ce rapport a été validé le {{ formatDate(report.validatedAt) }}
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-bold mb-3">Informations du validateur</h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm opacity-70">Nom:</span>
                <div class="font-medium">{{ report.validator?.firstName }} {{ report.validator?.lastName }}</div>
              </div>
              <div v-if="report.validator?.grade">
                <span class="text-sm opacity-70">Grade:</span>
                <div class="font-medium">{{ report.validator.grade }}</div>
              </div>
              <div v-if="report.validator?.unit">
                <span class="text-sm opacity-70">Unite:</span>
                <div class="font-medium">{{ report.validator.unit }}</div>
              </div>
              <div v-if="report.validator?.matricule">
                <span class="text-sm opacity-70">Matricule:</span>
                <div class="font-medium font-mono">{{ report.validator.matricule }}</div>
              </div>
              <div v-if="report.validator?.email">
                <span class="text-sm opacity-70">Email:</span>
                <div class="font-medium">{{ report.validator.email }}</div>
              </div>
            </div>

            <!-- Signature de l'officier -->
            <div v-if="report.validatorSignatureUrl" class="mt-4 pt-4 border-t border-base-300">
              <span class="text-sm opacity-70">Signature de l'officier:</span>
              <div class="mt-2 inline-block max-w-md w-full bg-base-100 p-4 rounded-lg">
                <ProtectedSignature 
                  :src="report.validatorSignatureUrl"
                  alt="Signature de l'officier validateur"
                  class="max-h-32"
                />
              </div>
            </div>

            <!-- Notes du validateur -->
            <div v-if="report.validatorNotes" class="mt-4 pt-4 border-t border-base-300">
              <span class="text-sm opacity-70">Notes du validateur:</span>
              <p class="mt-1 whitespace-pre-wrap">{{ report.validatorNotes }}</p>
            </div>
          </div>
        </div>

        <!-- Action admin uniquement -->
        <div v-if="isAdmin" class="card bg-error/5 border border-error/20">
          <div class="card-body">
            <h3 class="font-bold text-error">⚠️ Zone administrateur</h3>
            <p class="text-sm">
              En tant qu'administrateur, vous pouvez déverrouiller ce rapport pour permettre de nouvelles modifications.
            </p>
            <button
              type="button"
              class="btn btn-error btn-sm mt-2"
              @click="handleRemoveValidation"
              :disabled="loading"
            >
              🔓 Déverrouiller le rapport
            </button>
          </div>
        </div>
      </div>

      <!-- Formulaire de validation -->
      <div v-else class="space-y-4">
        <div class="alert alert-warning shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="font-bold">⚠️ Action irréversible</h3>
            <div class="text-sm">
              En validant ce rapport, il sera <strong>verrouillé</strong> et ne pourra plus être modifié que par vous ou le rédacteur original.
              Votre signature manuscrite et vos informations de profil seront enregistrées.
            </div>
          </div>
        </div>

        <!-- Informations du rapport -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-bold mb-2">📋 Rapport à valider</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-sm opacity-70">Titre:</span>
                <div class="font-medium">{{ report.title }}</div>
              </div>
              <div v-if="report.caseNumber">
                <span class="text-sm opacity-70">N° dossier:</span>
                <div class="font-medium">{{ report.caseNumber }}</div>
              </div>
              <div>
                <span class="text-sm opacity-70">Rédacteur:</span>
                <div class="font-medium">{{ report.owner.firstName }} {{ report.owner.lastName }}</div>
              </div>
              <div>
                <span class="text-sm opacity-70">Statut:</span>
                <div class="font-medium">{{ report.status }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vos informations (automatiques) -->
        <div class="card bg-base-100 border border-primary/20">
          <div class="card-body">
            <h3 class="font-bold mb-2">👤 Vos informations (depuis votre profil)</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-sm opacity-70">Nom complet:</span>
                <div class="font-medium">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
              </div>
              <div v-if="authStore.user?.grade">
                <span class="text-sm opacity-70">Grade:</span>
                <div class="font-medium">{{ authStore.user.grade }}</div>
              </div>
              <div v-if="authStore.user?.unit">
                <span class="text-sm opacity-70">Unite:</span>
                <div class="font-medium">{{ authStore.user.unit }}</div>
              </div>
              <div v-if="authStore.user?.matricule">
                <span class="text-sm opacity-70">Matricule:</span>
                <div class="font-medium font-mono">{{ authStore.user.matricule }}</div>
              </div>
            </div>

            <!-- Aperçu de la signature -->
            <div v-if="authStore.user?.signatureUrl" class="mt-4 pt-4 border-t border-base-300">
              <span class="text-sm opacity-70">Votre signature manuscrite:</span>
              <div class="mt-2 inline-block max-w-md w-full bg-base-200 p-4 rounded-lg">
                <ProtectedSignature 
                  :src="authStore.user.signatureUrl"
                  alt="Votre signature"
                  class="max-h-32"
                />
              </div>
            </div>
            <div v-else class="alert alert-error mt-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="font-bold">❌ Aucune signature manuscrite</span>
                <span class="text-sm">Vous devez ajouter votre signature dans votre profil avant de pouvoir valider un rapport.</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes optionnelles -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Notes de validation (optionnel)</span>
          </label>
          <textarea
            v-model="validatorNotes"
            class="textarea textarea-bordered"
            placeholder="Ajoutez des notes ou commentaires sur la validation..."
            rows="3"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4 border-t border-base-300">
          <button
            type="button"
            class="btn btn-ghost"
            @click="$emit('close')"
            :disabled="loading"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn btn-primary"
            @click="handleValidate"
            :disabled="loading || !authStore.user?.signatureUrl"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            <span v-else>🔒</span>
            Valider et verrouiller
          </button>
        </div>
      </div>
      </template>
      
      <!-- Bouton fermer -->
      <div class="modal-action" v-if="!report || (!report.isLocked || isAdmin)">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="$emit('close')">✕</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Report } from '@/services/api/reports';
import { reportsApi } from '@/services/api/reports';
import ProtectedSignature from '@/components/ProtectedSignature.vue';

const props = defineProps<{
  show: boolean;
  report: Report | null;
  isAdmin: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'validated'): void;
}>();

const authStore = useAuthStore();
const loading = ref(false);
const validatorNotes = ref('');

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function handleValidate() {
  if (!props.report || !authStore.user?.signatureUrl) return;

  loading.value = true;
  try {
    await reportsApi.validateReport(props.report.id, validatorNotes.value || undefined);
    emit('validated');
    emit('close');
    validatorNotes.value = '';
  } catch (error: any) {
    console.error('Erreur lors de la validation:', error);
    alert(error.response?.data?.message || 'Erreur lors de la validation du rapport');
  } finally {
    loading.value = false;
  }
}

async function handleRemoveValidation() {
  if (!props.report) return;

  const confirmed = confirm(
    'Êtes-vous sûr de vouloir déverrouiller ce rapport ? Cette action supprimera la validation et permettra de nouvelles modifications.'
  );
  if (!confirmed) return;

  loading.value = true;
  try {
    await reportsApi.removeValidation(props.report.id);
    emit('validated');
    emit('close');
  } catch (error: any) {
    console.error('Erreur lors du déverrouillage:', error);
    alert(error.response?.data?.message || 'Erreur lors du déverrouillage du rapport');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Style spécifique si nécessaire */
</style>
