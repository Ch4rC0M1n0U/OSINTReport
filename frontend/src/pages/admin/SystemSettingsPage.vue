<template>
  <section class="space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="Settings02Icon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Paramètres système</h1>
          <p class="text-base-content/70 mt-1">
            Configuration de l'application et personnalisation selon votre unité
          </p>
        </div>
      </div>
    </header>

    <!-- Chargement -->
    <div v-if="loading" class="bg-base-200 border-l-4 border-info p-12">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-info"></span>
        <p class="text-base-content/70">Chargement des paramètres...</p>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="error" class="bg-base-200 border-l-4 border-error p-5">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-error" />
        <span class="font-medium">{{ error }}</span>
      </div>
    </div>

    <!-- Formulaire -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Section Logo -->
      <div class="bg-base-200 border-l-4 border-accent">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="ImageUploadIcon" :size="24" class="text-accent" />
            <h2 class="text-xl font-semibold">Logo du service</h2>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Logo actuel -->
          <div v-if="logoUrl" class="flex items-center gap-4 p-4 bg-base-300/30 rounded-lg">
            <img :src="logoUrl" alt="Logo actuel" class="h-20 object-contain" />
            <button
              type="button"
              @click.prevent="handleRemoveLogo"
              class="btn btn-error btn-sm gap-2"
              :disabled="uploading"
            >
              <span v-if="uploading" class="loading loading-spinner loading-xs"></span>
              <HugeiconsIcon v-else :icon="Delete02Icon" :size="16" />
              Supprimer
            </button>
          </div>
          <div v-else class="bg-base-300/30 border-l-4 border-info p-4 rounded">
            <div class="flex items-center gap-3">
              <HugeiconsIcon :icon="InformationCircleIcon" :size="20" class="text-info" />
              <span class="text-sm">Aucun logo défini</span>
            </div>
          </div>

          <!-- Upload Logo -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Choisir un nouveau logo</span>
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              @change="handleLogoChange"
              class="file-input file-input-bordered"
              :disabled="uploading"
            />
            <label class="label">
              <span class="label-text-alt text-base-content/60">
                Formats acceptés : PNG, JPG, SVG, WebP (max 5 MB)
              </span>
            </label>
          </div>

          <div v-if="uploading" class="bg-base-300/30 border-l-4 border-info p-4 rounded">
            <div class="flex items-center gap-3">
              <span class="loading loading-spinner loading-sm text-info"></span>
              <span class="text-sm">Upload en cours...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations du service -->
      <div class="bg-base-200 border-l-4 border-info">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Building03Icon" :size="24" class="text-info" />
            <h2 class="text-xl font-semibold">Informations du service</h2>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Service Name -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Nom du service *</span>
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
                <span class="label-text font-medium">Nom complet du service</span>
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
                <span class="label-text font-medium">Adresse</span>
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
                <span class="label-text font-medium">Ville</span>
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
                <span class="label-text font-medium">Code postal</span>
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
                <span class="label-text font-medium">Pays</span>
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

      <!-- Coordonnées de contact -->
      <div class="bg-base-200 border-l-4 border-warning">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="Call02Icon" :size="24" class="text-warning" />
            <h2 class="text-xl font-semibold">Coordonnées de contact</h2>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Phone -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Téléphone</span>
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
                <span class="label-text font-medium">Fax</span>
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
                <span class="label-text font-medium">Email de contact</span>
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
                <span class="label-text font-medium">Site web</span>
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

      <!-- Personnalisation visuelle -->
      <div class="bg-base-200 border-l-4 border-success">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="PaintBoardIcon" :size="24" class="text-success" />
            <h2 class="text-xl font-semibold">Personnalisation visuelle</h2>
          </div>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Primary Color -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Couleur principale</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.primaryColor"
                  type="color"
                  class="w-16 h-12 rounded cursor-pointer border border-base-300"
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
                <span class="label-text font-medium">Couleur secondaire</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.secondaryColor"
                  type="color"
                  class="w-16 h-12 rounded cursor-pointer border border-base-300"
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

      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-4">
        <button
          type="button"
          @click="loadSettings"
          class="btn btn-ghost gap-2"
          :disabled="saving"
        >
          Annuler
        </button>
        <button type="submit" class="btn btn-primary gap-2" :disabled="saving">
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="18" />
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
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
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { settingsApi, type SystemSettings, type UpdateSettingsData } from "@/services/api/settings";
import { useModal } from "@/composables/useModal";
import ModalDialog from "@/components/shared/ModalDialog.vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  Settings02Icon,
  ImageUploadIcon,
  Building03Icon,
  Location01Icon,
  Call02Icon,
  Mail01Icon,
  PaintBoardIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Upload02Icon,
  InformationCircleIcon,
  SearchAreaIcon,
} from "@hugeicons/core-free-icons";

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
