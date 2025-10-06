<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold mb-2">Paramètres système</h1>
      <p class="text-base-content/70">
        Configuration de l'application et personnalisation selon votre unité
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Logo Section -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Logo du service</h2>

          <!-- Current Logo -->
          <div v-if="logoUrl" class="flex items-center gap-4 mb-4">
            <img :src="logoUrl" alt="Logo actuel" class="h-20 object-contain" />
            <button
              type="button"
              @click.prevent="handleRemoveLogo"
              class="btn btn-error btn-sm"
              :disabled="uploading"
            >
              <span v-if="uploading" class="loading loading-spinner loading-xs"></span>
              <span v-else>🗑️</span>
              Supprimer
            </button>
          </div>
          <div v-else class="alert alert-info mb-4">
            <span>Aucun logo défini</span>
          </div>

          <!-- Upload Logo -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Choisir un nouveau logo</span>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              @change="handleLogoChange"
              class="file-input file-input-bordered"
              :disabled="uploading"
            />
            <label class="label">
              <span class="label-text-alt">Formats acceptés : PNG, JPG, SVG, WebP (max 5 MB)</span>
            </label>
          </div>

          <div v-if="uploading" class="alert alert-info">
            <span class="loading loading-spinner"></span>
            <span>Upload en cours...</span>
          </div>
        </div>
      </div>

      <!-- Service Information -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Informations du service</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Service Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom du service *</span>
              </label>
              <input
                v-model="form.serviceName"
                type="text"
                placeholder="Ex: OSINT"
                class="input input-bordered"
                required
              />
            </div>

            <!-- Service Full Name -->
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Nom complet du service</span>
              </label>
              <input
                v-model="form.serviceFullName"
                type="text"
                placeholder="Ex: DR5 - OSINT - BRUXELLES"
                class="input input-bordered"
              />
            </div>

            <!-- Address -->
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Adresse</span>
              </label>
              <input
                v-model="form.serviceAddress"
                type="text"
                placeholder="Ex: Rue de la Loi 16"
                class="input input-bordered"
              />
            </div>

            <!-- City -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Ville</span>
              </label>
              <input
                v-model="form.serviceCity"
                type="text"
                placeholder="Ex: Bruxelles"
                class="input input-bordered"
              />
            </div>

            <!-- Postal Code -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Code postal</span>
              </label>
              <input
                v-model="form.servicePostalCode"
                type="text"
                placeholder="Ex: 1000"
                class="input input-bordered"
              />
            </div>

            <!-- Country -->
            <div class="form-control md:col-span-2">
              <label class="label">
                <span class="label-text">Pays</span>
              </label>
              <input
                v-model="form.serviceCountry"
                type="text"
                placeholder="Ex: Belgique"
                class="input input-bordered"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Coordonnées de contact</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Phone -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Téléphone</span>
              </label>
              <input
                v-model="form.phoneNumber"
                type="tel"
                placeholder="Ex: +32 2 123 45 67"
                class="input input-bordered"
              />
            </div>

            <!-- Fax -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Fax</span>
              </label>
              <input
                v-model="form.faxNumber"
                type="tel"
                placeholder="Ex: +32 2 123 45 68"
                class="input input-bordered"
              />
            </div>

            <!-- Email -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Email de contact</span>
              </label>
              <input
                v-model="form.emailContact"
                type="email"
                placeholder="Ex: contact@police.belgium.eu"
                class="input input-bordered"
              />
            </div>

            <!-- Website -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Site web</span>
              </label>
              <input
                v-model="form.websiteUrl"
                type="url"
                placeholder="Ex: https://www.police.be"
                class="input input-bordered"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Branding -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Personnalisation visuelle</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Primary Color -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Couleur principale</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.primaryColor"
                  type="color"
                  class="w-16 h-12 rounded cursor-pointer"
                />
                <input
                  v-model="form.primaryColor"
                  type="text"
                  placeholder="#003f87"
                  class="input input-bordered flex-1"
                />
              </div>
            </div>

            <!-- Secondary Color -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">Couleur secondaire</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.secondaryColor"
                  type="color"
                  class="w-16 h-12 rounded cursor-pointer"
                />
                <input
                  v-model="form.secondaryColor"
                  type="text"
                  placeholder="#0066cc"
                  class="input input-bordered flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Link to Search Management -->
      <div class="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="flex-1">
          <h3 class="font-bold">Gestion de l'index de recherche</h3>
          <div class="text-sm">
            Pour gérer l'index MeiliSearch, réindexer les rapports ou consulter les statistiques de recherche,
            rendez-vous sur la page dédiée.
          </div>
        </div>
        <router-link to="/admin/search" class="btn btn-primary btn-sm">
          🔍 Gérer la recherche
        </router-link>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-4">
        <button
          type="button"
          @click="loadSettings"
          class="btn btn-ghost"
          :disabled="saving"
        >
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="loading loading-spinner"></span>
          💾 Enregistrer
        </button>
      </div>
    </form>

    <!-- Modal Dialog -->
    <ModalDialog
      v-model="modal.isOpen.value"
      :title="modal.config.value.title"
      :message="modal.config.value.message"
      :type="modal.config.value.type"
      :confirm-text="modal.config.value.confirmText"
      :cancel-text="modal.config.value.cancelText"
      :is-confirm="modal.config.value.type === 'confirm' || modal.config.value.type === 'error'"
      @confirm="modal.handleConfirm"
      @cancel="modal.handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { settingsApi, type SystemSettings, type UpdateSettingsData } from "@/services/api/settings";
import { useModal } from "@/composables/useModal";
import ModalDialog from "@/components/shared/ModalDialog.vue";

const modal = useModal();

// State
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const error = ref<string | null>(null);
const settings = ref<SystemSettings | null>(null);

// Form
const form = ref<UpdateSettingsData>({
  serviceName: "OSINT",
  serviceFullName: null,
  serviceAddress: null,
  serviceCity: null,
  servicePostalCode: null,
  serviceCountry: "Belgique",
  phoneNumber: null,
  faxNumber: null,
  emailContact: null,
  websiteUrl: null,
  primaryColor: "#003f87",
  secondaryColor: "#0066cc",
});

// Computed
const logoUrl = computed(() => {
  if (!settings.value?.logoUrl) return null;
  return settingsApi.getLogoUrl(settings.value.logoUrl);
});

// Methods
async function loadSettings() {
  loading.value = true;
  error.value = null;

  try {
    const data = await settingsApi.getSettings();
    settings.value = data;

    // Populate form
    form.value = {
      serviceName: data.serviceName,
      serviceFullName: data.serviceFullName,
      serviceAddress: data.serviceAddress,
      serviceCity: data.serviceCity,
      servicePostalCode: data.servicePostalCode,
      serviceCountry: data.serviceCountry,
      phoneNumber: data.phoneNumber,
      faxNumber: data.faxNumber,
      emailContact: data.emailContact,
      websiteUrl: data.websiteUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || "Erreur lors du chargement des paramètres";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  saving.value = true;

  try {
    const updated = await settingsApi.updateSettings(form.value);
    settings.value = updated;

    await modal.showSuccess("Paramètres mis à jour avec succès !");
  } catch (err: any) {
    await modal.showError(
      err.response?.data?.message || "Erreur lors de la mise à jour des paramètres"
    );
    console.error(err);
  } finally {
    saving.value = false;
  }
}

async function handleLogoChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

  // Vérifier la taille
  if (file.size > 5 * 1024 * 1024) {
    modal.showError("Le fichier est trop volumineux (max 5 MB)");
    target.value = "";
    return;
  }

  uploading.value = true;

  try {
    const updated = await settingsApi.uploadLogo(file);
    settings.value = updated;
    modal.showSuccess("Logo uploadé avec succès !");
  } catch (err: any) {
    modal.showError(
      err.response?.data?.message || "Erreur lors de l'upload du logo"
    );
    console.error(err);
  } finally {
    uploading.value = false;
    // Reset input
    target.value = "";
  }
}

async function handleRemoveLogo() {
  console.log("handleRemoveLogo appelé");
  
  const confirmed = await modal.showConfirm(
    "Êtes-vous sûr de vouloir supprimer le logo ?",
    "Confirmer la suppression"
  );

  console.log("Confirmation:", confirmed);
  
  if (!confirmed) return;

  uploading.value = true;

  try {
    console.log("Appel de settingsApi.removeLogo()");
    const updated = await settingsApi.removeLogo();
    console.log("Logo supprimé, updated:", updated);
    settings.value = updated;
    modal.showSuccess("Logo supprimé avec succès !");
  } catch (err: any) {
    console.error("Erreur suppression logo:", err);
    modal.showError(
      err.response?.data?.message || "Erreur lors de la suppression du logo"
    );
    console.error(err);
  } finally {
    uploading.value = false;
  }
}

// Lifecycle
onMounted(() => {
  loadSettings();
});
</script>
