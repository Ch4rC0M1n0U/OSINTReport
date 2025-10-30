<script setup lang="ts">
import { onMounted, reactive, ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/services/http";
import { HugeiconsIcon } from "@hugeicons/vue";
import { 
  User02Icon,
  Time01Icon,
  Upload01Icon,
  IdIcon,
  Cancel01Icon,
  PencilEdit01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Mail01Icon,
  Call02Icon,
  UserCircle02Icon,
  Camera01Icon,
  Delete02Icon
} from "@hugeicons/core-free-icons";
import SignaturePad from "@/components/SignaturePad.vue";
import ProtectedSignature from "@/components/ProtectedSignature.vue";
import TwoFactorSection from "@/components/profile/TwoFactorSection.vue";

const authStore = useAuthStore();
const saving = ref(false);
const message = ref<{ type: "success" | "error"; text: string } | null>(null);
const showSignaturePad = ref(false);

// Formulaire User Profile
const profileForm = reactive({
  firstName: "",
  lastName: "",
  matricule: "",
  email: "",
  phone: "",
  grade: "",
  unit: "",
  avatarUrl: "",
  signatureUrl: "",
});

// Liste des grades
const grades = [
  { value: "Inspecteur", label: "Inspecteur" },
  { value: "Premier Inspecteur", label: "Premier Inspecteur" },
  { value: "Inspecteur principal", label: "Inspecteur principal" },
  { value: "Premier Inspecteur Principal", label: "Premier Inspecteur Principal" },
  { value: "Commissaire", label: "Commissaire" },
  { value: "Premier Commissaire", label: "Premier Commissaire" },
];

// Formulaire Time Preferences
const timeForm = reactive({
  timezone: "Europe/Brussels",
  dateFormat: "12h",
  firstDayOfWeek: "monday",
});

// Liste des timezones
const timezones = [
  { value: "Europe/Brussels", label: "GMT+1:00 - Brussels (CET)" },
  { value: "Europe/Paris", label: "GMT+1:00 - Paris (CET)" },
  { value: "Europe/London", label: "GMT+0:00 - London (GMT)" },
  { value: "America/New_York", label: "GMT-5:00 - New York (EST)" },
  { value: "America/Los_Angeles", label: "GMT-8:00 - Los Angeles (PST)" },
  { value: "Asia/Tokyo", label: "GMT+9:00 - Tokyo (JST)" },
  { value: "Australia/Sydney", label: "GMT+11:00 - Sydney (AEDT)" },
];

const dateFormats = [
  { value: "12h", label: "12-hour (AM/PM)" },
  { value: "24h", label: "24-hour" },
];

const firstDayOptions = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "saturday", label: "Saturday" },
];

const fullName = computed(() => {
  return `${profileForm.firstName} ${profileForm.lastName}`;
});

const userInitials = computed(() => {
  if (!profileForm.firstName || !profileForm.lastName) return "";
  return `${profileForm.firstName.charAt(0)}${profileForm.lastName.charAt(0)}`.toUpperCase();
});

onMounted(() => {
  if (authStore.user) {
    profileForm.firstName = authStore.user.firstName;
    profileForm.lastName = authStore.user.lastName;
    profileForm.matricule = authStore.user.matricule || "";
    profileForm.email = authStore.user.email || "";
    profileForm.phone = authStore.user.phone || "";
    profileForm.grade = authStore.user.grade || "";
    profileForm.unit = authStore.user.unit || "";
    profileForm.avatarUrl = authStore.user.avatarUrl || "";
    profileForm.signatureUrl = authStore.user.signatureUrl || "";
    
    // Charger les préférences de temps
    timeForm.timezone = authStore.user.timezone || "Europe/Brussels";
    timeForm.dateFormat = authStore.user.dateFormat || "24h";
    timeForm.firstDayOfWeek = authStore.user.firstDayOfWeek || "monday";
  }
});

async function handleProfileUpdate() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      matricule: profileForm.matricule,
      email: profileForm.email,
      phone: profileForm.phone || null,
      grade: profileForm.grade || null,
      unit: profileForm.unit || null,
      avatarUrl: profileForm.avatarUrl || null,
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);
      profileForm.avatarUrl = response.data.user.avatarUrl || "";
    }

    message.value = {
      type: "success",
      text: "Profil mis à jour avec succès !",
    };

    // Auto-hide success message
    setTimeout(() => {
      message.value = null;
    }, 3000);
  } catch (err: any) {
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de la mise à jour du profil",
    };
  } finally {
    saving.value = false;
  }
}

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // Validation
  if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
    message.value = {
      type: "error",
      text: "Seuls les fichiers PNG et JPEG sont acceptés",
    };
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    message.value = {
      type: "error",
      text: "Le fichier est trop volumineux (max 5MB)",
    };
    return;
  }

  saving.value = true;
  message.value = null;

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);
      profileForm.avatarUrl = response.data.user.avatarUrl || "";
    }

    message.value = {
      type: "success",
      text: "Photo de profil mise à jour !",
    };

    setTimeout(() => {
      message.value = null;
    }, 3000);
  } catch (err: any) {
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de l'upload de l'image",
    };
  } finally {
    saving.value = false;
    target.value = "";
  }
}

async function handleTimePreferencesUpdate() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      timezone: timeForm.timezone,
      dateFormat: timeForm.dateFormat,
      firstDayOfWeek: timeForm.firstDayOfWeek,
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);
      
      message.value = {
        type: "success",
        text: "Préférences de temps mises à jour avec succès",
      };

      setTimeout(() => {
        message.value = null;
      }, 3000);
    }
  } catch (err: any) {
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de la mise à jour des préférences",
    };
  } finally {
    saving.value = false;
  }
}

async function handleSignatureSave(dataUrl: string) {
  saving.value = true;
  message.value = null;

  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append("signature", blob, "signature.png");

    // Upload signature
    const uploadResponse = await api.post("/users/me/signature", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (uploadResponse.data.user) {
      authStore.updateUser(uploadResponse.data.user);
      profileForm.signatureUrl = uploadResponse.data.user.signatureUrl || "";
    }

    showSignaturePad.value = false;
    message.value = {
      type: "success",
      text: "Signature enregistrée avec succès !",
    };

    setTimeout(() => {
      message.value = null;
    }, 3000);
  } catch (err: any) {
    console.error('Error saving signature:', err);
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de l'enregistrement de la signature",
    };
  } finally {
    saving.value = false;
  }
}

function handleSignatureCancel() {
  showSignaturePad.value = false;
}

async function removeSignature() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      signatureUrl: null,
    });

    if (response.data.user) {
      authStore.updateUser(response.data.user);
      profileForm.signatureUrl = "";
    }

    message.value = {
      type: "success",
      text: "Signature supprimée avec succès !",
    };

    setTimeout(() => {
      message.value = null;
    }, 3000);
  } catch (err: any) {
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de la suppression de la signature",
    };
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="max-w-5xl mx-auto space-y-6 pb-8">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="UserCircle02Icon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Mon profil</h1>
          <p class="text-base-content/70 mt-1">
            Gérez vos informations personnelles et préférences
          </p>
        </div>
      </div>
    </header>

    <!-- Alert Messages -->
    <div v-if="message" class="bg-base-200 border-l-4 p-4" :class="message.type === 'success' ? 'border-success' : 'border-error'">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <HugeiconsIcon 
            :icon="message.type === 'success' ? CheckmarkCircle01Icon : AlertCircleIcon" 
            :size="24"
            :class="message.type === 'success' ? 'text-success' : 'text-error'"
          />
          <span class="font-medium">{{ message.text }}</span>
        </div>
        <button @click="message = null" class="btn btn-ghost btn-sm btn-circle">
          <HugeiconsIcon :icon="Cancel01Icon" :size="16" />
        </button>
      </div>
    </div>

    <!-- User Profile Section -->
    <div class="bg-base-200 border-l-4 border-accent">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="User02Icon" :size="24" class="text-accent" />
          <div>
            <h2 class="text-xl font-semibold">Informations personnelles</h2>
            <p class="text-sm text-base-content/60">Gérez vos informations de profil et photo</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="flex flex-col lg:flex-row gap-8 mb-6">
          <!-- Avatar Section -->
          <div class="flex flex-col items-center gap-4">
            <div class="avatar">
              <div
                v-if="profileForm.avatarUrl"
                class="w-32 h-32 rounded-full ring-4 ring-accent ring-offset-4 ring-offset-base-200"
              >
                <img 
                  :src="profileForm.avatarUrl" 
                  :alt="fullName"
                  @error="profileForm.avatarUrl = ''"
                />
              </div>
              <div
                v-else
                class="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-primary text-white flex items-center justify-center text-3xl font-bold ring-4 ring-accent ring-offset-4 ring-offset-base-200"
              >
                {{ userInitials }}
              </div>
            </div>

            <!-- Upload Photo Buttons -->
            <div class="flex flex-col gap-2 w-full">
              <label class="btn btn-sm btn-accent gap-2">
                <HugeiconsIcon :icon="Camera01Icon" :size="16" />
                <span>Changer la photo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>
              <button 
                type="button"
                @click="profileForm.avatarUrl = ''"
                class="btn btn-sm btn-ghost gap-2"
                v-if="profileForm.avatarUrl"
              >
                <HugeiconsIcon :icon="Delete02Icon" :size="16" />
                Supprimer
              </button>
            </div>
          </div>

          <!-- User Info Form -->
          <div class="flex-1 space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <!-- Prénom -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Prénom</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HugeiconsIcon :icon="User02Icon" :size="18" class="text-base-content/40" />
                  </div>
                  <input
                    v-model="profileForm.firstName"
                    type="text"
                    placeholder="Gaëtan"
                    class="input input-bordered w-full pl-10"
                    required
                  />
                </div>
              </label>

              <!-- Nom -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Nom</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HugeiconsIcon :icon="User02Icon" :size="18" class="text-base-content/40" />
                  </div>
                  <input
                    v-model="profileForm.lastName"
                    type="text"
                    placeholder="Dupont"
                    class="input input-bordered w-full pl-10"
                    required
                  />
                </div>
              </label>

              <!-- Matricule -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Matricule</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HugeiconsIcon :icon="IdIcon" :size="18" class="text-base-content/40" />
                  </div>
                  <input
                    v-model="profileForm.matricule"
                    type="text"
                    placeholder="BE-POL-2024-001"
                    class="input input-bordered w-full pl-10"
                    required
                  />
                </div>
              </label>

              <!-- Email -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Email professionnel</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HugeiconsIcon :icon="Mail01Icon" :size="18" class="text-base-content/40" />
                  </div>
                  <input
                    v-model="profileForm.email"
                    type="email"
                    placeholder="admin@police.belgium.eu"
                    class="input input-bordered w-full pl-10"
                    required
                  />
                </div>
              </label>

              <!-- Téléphone -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Téléphone</span>
                </div>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HugeiconsIcon :icon="Call02Icon" :size="18" class="text-base-content/40" />
                  </div>
                  <input
                    v-model="profileForm.phone"
                    type="tel"
                    placeholder="+32 2 123 45 67"
                    class="input input-bordered w-full pl-10"
                  />
                </div>
              </label>

              <!-- Grade -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Grade</span>
                </div>
                <select
                  v-model="profileForm.grade"
                  class="select select-bordered"
                >
                  <option value="">Sélectionnez un grade</option>
                  <option v-for="grade in grades" :key="grade.value" :value="grade.value">
                    {{ grade.label }}
                  </option>
                </select>
                <div class="label">
                  <span class="label-text-alt text-base-content/50">Utilisé pour la signature des rapports</span>
                </div>
              </label>

              <!-- Unité/Service -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text font-medium">Unité / Service</span>
                </div>
                <input
                  v-model="profileForm.unit"
                  type="text"
                  placeholder="Ex: DR5 - OSINT - BRUXELLES"
                  class="input input-bordered"
                />
                <div class="label">
                  <span class="label-text-alt text-base-content/50">Votre unité ou service d'affectation</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Update Button -->
        <div class="flex justify-end pt-4 border-t border-base-300">
          <button 
            @click="handleProfileUpdate"
            class="btn btn-primary gap-2"
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="18" />
            {{ saving ? 'Mise à jour...' : 'Mettre à jour le profil' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Time Preferences Section -->
    <div class="bg-base-200 border-l-4 border-info">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="Time01Icon" :size="24" class="text-info" />
          <div>
            <h2 class="text-xl font-semibold">Préférences de temps</h2>
            <p class="text-sm text-base-content/60">Configurez votre fuseau horaire et format d'heure</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <!-- Timezone -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Fuseau horaire</span>
            </label>
            <select v-model="timeForm.timezone" class="select select-bordered w-full">
              <option v-for="tz in timezones" :key="tz.value" :value="tz.value">
                {{ tz.label }}
              </option>
            </select>
          </div>

          <!-- Datetime Format -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Format d'heure</span>
            </label>
            <select v-model="timeForm.dateFormat" class="select select-bordered w-full">
              <option v-for="fmt in dateFormats" :key="fmt.value" :value="fmt.value">
                {{ fmt.label }}
              </option>
            </select>
          </div>

          <!-- First day of week -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Premier jour de la semaine</span>
            </label>
            <select v-model="timeForm.firstDayOfWeek" class="select select-bordered w-full">
              <option v-for="day in firstDayOptions" :key="day.value" :value="day.value">
                {{ day.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end pt-4 border-t border-base-300">
          <button 
            @click="handleTimePreferencesUpdate"
            class="btn btn-info gap-2"
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="18" />
            {{ saving ? 'Mise à jour...' : 'Mettre à jour' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Signature Section -->
    <div class="bg-base-200 border-l-4 border-warning">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="PencilEdit01Icon" :size="24" class="text-warning" />
          <div>
            <h2 class="text-xl font-semibold">Signature manuscrite</h2>
            <p class="text-sm text-base-content/60">Votre signature sera utilisée dans les rapports générés</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <!-- Signature display area - Always visible -->
        <div class="mb-6">
          <label class="label">
            <span class="label-text font-medium">
              {{ showSignaturePad ? 'Dessinez votre signature' : 'Ma signature' }}
            </span>
          </label>
          
          <!-- Signature pad for drawing -->
          <div v-if="showSignaturePad">
            <SignaturePad 
              @save="handleSignatureSave"
              @cancel="handleSignatureCancel"
            />
          </div>
          
          <!-- Current signature or placeholder -->
          <div v-else>
            <!-- Signature exists -->
            <div v-if="profileForm.signatureUrl" class="inline-block max-w-md w-full bg-base-100 p-4 rounded-lg">
              <ProtectedSignature 
                :src="profileForm.signatureUrl"
                max-height="200px"
              />
            </div>
            
            <!-- No signature placeholder -->
            <div v-else class="border-2 border-dashed border-base-300 rounded-lg p-12 bg-base-100/50 text-center">
              <div class="p-4 rounded-lg bg-warning/10 inline-block mb-4">
                <HugeiconsIcon :icon="PencilEdit01Icon" :size="48" class="text-warning" />
              </div>
              <p class="text-base-content/70 font-medium mb-2">Aucune signature enregistrée</p>
              <p class="text-sm text-base-content/50">
                Ajoutez votre signature manuscrite pour personnaliser vos rapports
              </p>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-2 flex-wrap">
          <!-- When signature pad is NOT showing -->
          <template v-if="!showSignaturePad">
            <!-- If signature exists: Show Modify and Delete buttons -->
            <template v-if="profileForm.signatureUrl">
              <button 
                @click="showSignaturePad = true"
                class="btn btn-warning gap-2"
              >
                <HugeiconsIcon :icon="PencilEdit01Icon" :size="18" />
                Modifier la signature
              </button>
              <button 
                @click="removeSignature"
                class="btn btn-outline btn-error gap-2"
                :disabled="saving"
              >
                <span v-if="saving" class="loading loading-spinner loading-sm"></span>
                <HugeiconsIcon v-else :icon="Delete02Icon" :size="18" />
                Supprimer la signature
              </button>
            </template>
            
            <!-- If no signature: Show only Add button -->
            <button 
              v-else
              @click="showSignaturePad = true"
              class="btn btn-warning gap-2"
            >
              <HugeiconsIcon :icon="PencilEdit01Icon" :size="18" />
              Ajouter une signature
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 2FA Section -->
    <TwoFactorSection />

    <!-- Read-only Info Section -->
    <div class="bg-base-200 border-l-4 border-success">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="IdIcon" :size="24" class="text-success" />
          <div>
            <h2 class="text-xl font-semibold">Informations du compte</h2>
            <p class="text-sm text-base-content/60">Informations en lecture seule gérées par les administrateurs</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="flex items-center gap-3 bg-base-100 p-4 rounded-lg">
          <div class="p-2 rounded-lg bg-success/10">
            <HugeiconsIcon :icon="UserCircle02Icon" :size="24" class="text-success" />
          </div>
          <div>
            <p class="text-sm text-base-content/60 font-medium">Rôle</p>
            <p class="text-lg font-semibold">{{ authStore.user?.roleName || "—" }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
