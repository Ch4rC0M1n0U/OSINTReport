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
  Cancel01Icon
} from "@hugeicons/core-free-icons";

const authStore = useAuthStore();
const saving = ref(false);
const message = ref<{ type: "success" | "error"; text: string } | null>(null);

// Formulaire User Profile
const profileForm = reactive({
  firstName: "",
  lastName: "",
  matricule: "",
  email: "",
  phone: "",
  grade: "",
  avatarUrl: "",
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
    profileForm.email = authStore.user.email;
    profileForm.phone = authStore.user.phone || "";
    profileForm.grade = authStore.user.grade || "";
    profileForm.avatarUrl = authStore.user.avatarUrl || "";
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
  // TODO: Implémenter la sauvegarde des préférences temporelles
  console.log("Time preferences:", timeForm);
}
</script>

<template>
  <section class="max-w-4xl mx-auto space-y-6 pb-8">
    <!-- Alert Messages -->
    <div v-if="message" :class="`alert alert-${message.type} shadow-lg`" class="mb-6">
      <div class="flex items-center gap-2">
        <HugeiconsIcon 
          :icon="message.type === 'success' ? User02Icon : Cancel01Icon" 
          class="w-5 h-5"
        />
        <span>{{ message.text }}</span>
      </div>
      <button @click="message = null" class="btn btn-ghost btn-sm btn-circle">
        <HugeiconsIcon :icon="Cancel01Icon" class="w-4 h-4" />
      </button>
    </div>

    <!-- User Profile Section -->
    <div class="bg-base-100 rounded-lg shadow-md border border-base-200">
      <div class="p-6 border-b border-base-200">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="User02Icon" class="w-6 h-6 text-primary" />
          <div>
            <h2 class="text-xl font-semibold">User Profile</h2>
            <p class="text-sm text-base-content/60">Manage your account information and settings</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="flex flex-col sm:flex-row gap-6 mb-6">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <div class="avatar">
              <div
                v-if="profileForm.avatarUrl"
                class="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
              >
                <img 
                  :src="profileForm.avatarUrl" 
                  :alt="fullName"
                  @error="profileForm.avatarUrl = ''"
                />
              </div>
              <div
                v-else
                class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center text-2xl font-bold ring ring-primary ring-offset-base-100 ring-offset-2"
              >
                {{ userInitials }}
              </div>
            </div>
          </div>

          <!-- User Info Form -->
          <div class="flex-1 space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <!-- Prénom -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text">Prénom</span>
                </div>
                <input
                  v-model="profileForm.firstName"
                  type="text"
                  placeholder="Gaëtan"
                  class="input input-bordered"
                  required
                />
              </label>

              <!-- Nom -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text">Nom</span>
                </div>
                <input
                  v-model="profileForm.lastName"
                  type="text"
                  placeholder="Dupont"
                  class="input input-bordered"
                  required
                />
              </label>

              <!-- Matricule -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text">Matricule</span>
                </div>
                <input
                  v-model="profileForm.matricule"
                  type="text"
                  placeholder="BE-POL-2024-001"
                  class="input input-bordered"
                  required
                />
              </label>

              <!-- Email -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text">Email professionnel</span>
                </div>
                <input
                  v-model="profileForm.email"
                  type="email"
                  placeholder="admin@police.belgium.eu"
                  class="input input-bordered"
                  required
                />
              </label>

              <!-- Téléphone -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text">Téléphone</span>
                </div>
                <input
                  v-model="profileForm.phone"
                  type="tel"
                  placeholder="+32 2 123 45 67"
                  class="input input-bordered"
                />
              </label>

              <!-- Grade -->
              <label class="form-control">
                <div class="label">
                  <span class="label-text">Grade</span>
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
                  <span class="label-text-alt">Utilisé pour la signature des rapports</span>
                </div>
              </label>
            </div>

            <!-- Upload Photo Button -->
            <div class="flex flex-wrap gap-2 pt-2">
              <label class="btn btn-primary btn-sm">
                <HugeiconsIcon :icon="Upload01Icon" class="w-4 h-4" />
                <span>Upload Photo</span>
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
                class="btn btn-outline btn-sm"
                v-if="profileForm.avatarUrl"
              >
                Remove Photo
              </button>
            </div>
          </div>
        </div>

        <!-- Update Button -->
        <div class="flex justify-end pt-4 border-t border-base-200">
          <button 
            @click="handleProfileUpdate"
            class="btn btn-primary"
            :disabled="saving"
          >
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="Upload01Icon" class="w-4 h-4" />
            {{ saving ? 'Mise à jour...' : 'Mettre à jour' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Time Preferences Section -->
    <div class="bg-base-100 rounded-lg shadow-md border border-base-200">
      <div class="p-6 border-b border-base-200">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="Time01Icon" class="w-6 h-6 text-primary" />
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
        <div class="flex justify-end items-center pt-4 border-t border-base-200">
          <div class="flex gap-2">
            <button type="button" class="btn btn-ghost">
              <HugeiconsIcon :icon="Cancel01Icon" class="w-4 h-4" />
              Annuler
            </button>
            <button 
              @click="handleTimePreferencesUpdate"
              class="btn btn-primary"
            >
              <HugeiconsIcon :icon="Upload01Icon" class="w-4 h-4" />
              Mettre à jour
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Read-only Info Section -->
    <div class="bg-base-100 rounded-lg shadow-md border border-base-200">
      <div class="p-6 border-b border-base-200">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="IdIcon" class="w-6 h-6 text-primary" />
          <div>
            <h2 class="text-xl font-semibold">Informations du compte</h2>
            <p class="text-sm text-base-content/60">Informations en lecture seule gérées par les administrateurs</p>
          </div>
        </div>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-1 gap-6">
          <div>
            <label class="label">
              <span class="label-text text-base-content/70 font-medium">Rôle</span>
            </label>
            <div class="flex items-center gap-2">
              <span class="badge badge-primary badge-lg px-4 py-3 text-base">
                {{ authStore.user?.roleName || "—" }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
