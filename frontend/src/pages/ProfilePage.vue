<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/services/http";

const authStore = useAuthStore();
const saving = ref(false);
const message = ref<{ type: "success" | "error"; text: string } | null>(null);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  avatarUrl: "",
});

onMounted(() => {
  if (authStore.user) {
    form.firstName = authStore.user.firstName;
    form.lastName = authStore.user.lastName;
    form.email = authStore.user.email;
    form.avatarUrl = authStore.user.avatarUrl || "";
  }
});

async function handleSubmit() {
  saving.value = true;
  message.value = null;

  try {
    const response = await api.patch("/users/me/profile", {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      avatarUrl: form.avatarUrl || null,
    });

    // Update user data from response
    if (response.data.user) {
      authStore.updateUser(response.data.user);
      form.avatarUrl = response.data.user.avatarUrl || "";
    }

    message.value = {
      type: "success",
      text: "Votre profil a été mis à jour avec succès !",
    };
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
    // Upload via FormData
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/users/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Update user data from response
    if (response.data.user) {
      authStore.updateUser(response.data.user);
      form.avatarUrl = response.data.user.avatarUrl || "";
    }

    message.value = {
      type: "success",
      text: "Photo de profil mise à jour avec succès !",
    };
  } catch (err: any) {
    message.value = {
      type: "error",
      text: err.response?.data?.message || "Erreur lors de l'upload de l'image",
    };
  } finally {
    saving.value = false;
    // Reset input
    target.value = "";
  }
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Mon profil</h2>
      <p class="text-sm text-base-content/70">
        Gérez vos informations personnelles et votre photo de profil
      </p>
    </header>

    <form @submit.prevent="handleSubmit" class="card bg-base-100 shadow max-w-3xl">
      <div class="card-body space-y-6">
        <!-- Avatar Section -->
        <div class="flex items-center gap-6">
          <div class="avatar">
            <div
              v-if="form.avatarUrl"
              class="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
            >
              <img 
                :src="form.avatarUrl" 
                :alt="`${form.firstName} ${form.lastName}`"
                @error="form.avatarUrl = ''"
              />
            </div>
            <div
              v-else
              class="w-24 h-24 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold ring ring-primary ring-offset-base-100 ring-offset-2"
            >
              {{ getInitials(form.firstName, form.lastName) }}
            </div>
          </div>
          <div class="flex-1 space-y-3">
            <div>
              <label class="btn btn-primary btn-sm">
                <span class="material-symbols-rounded text-sm">upload</span>
                <span>Choisir une image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>
              <div class="label">
                <span class="label-text-alt">
                  PNG ou JPEG, max 5MB. L'image sera automatiquement redimensionnée à 512x512px et sauvegardée immédiatement
                </span>
              </div>
            </div>
            <div class="divider my-1">OU</div>
            <label class="form-control">
              <div class="label">
                <span class="label-text">URL de la photo de profil</span>
              </div>
              <input
                v-model="form.avatarUrl"
                type="url"
                class="input input-bordered input-sm"
                placeholder="https://example.com/avatar.jpg"
              />
              <div class="label">
                <span class="label-text-alt text-warning">
                  ⚠️ Attention : enregistrer avec une URL remplacera l'image uploadée
                </span>
              </div>
            </label>
          </div>
        </div>

        <div class="divider"></div>

        <!-- Alert Messages -->
        <div v-if="message" :class="`alert alert-${message.type}`">
          <span>{{ message.text }}</span>
        </div>

        <!-- Personal Information -->
        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control">
            <div class="label">
              <span class="label-text">Prénom *</span>
            </div>
            <input
              v-model="form.firstName"
              type="text"
              class="input input-bordered"
              required
              placeholder="Jean"
            />
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text">Nom *</span>
            </div>
            <input
              v-model="form.lastName"
              type="text"
              class="input input-bordered"
              required
              placeholder="Dupont"
            />
          </label>
        </div>

        <label class="form-control">
          <div class="label">
            <span class="label-text">Email professionnel *</span>
          </div>
          <input
            v-model="form.email"
            type="email"
            class="input input-bordered"
            required
            placeholder="jean.dupont@police.belgium.eu"
          />
        </label>

        <!-- Read-only Information -->
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <div class="label">
              <span class="label-text text-base-content/70">Matricule</span>
            </div>
            <div class="text-lg font-mono">{{ authStore.user?.matricule || "—" }}</div>
          </div>

          <div>
            <div class="label">
              <span class="label-text text-base-content/70">Rôle</span>
            </div>
            <div class="badge badge-primary badge-lg">{{ authStore.user?.roleName || "—" }}</div>
          </div>
        </div>

        <div class="card-actions justify-end pt-4">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            <span v-if="saving" class="loading loading-spinner loading-sm"></span>
            <span v-else>Enregistrer les modifications</span>
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
