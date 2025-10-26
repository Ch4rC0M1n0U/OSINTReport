<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  ArrowLeft01Icon,
  User02Icon,
  Mail01Icon,
  Call02Icon,
  IdIcon,
  ShieldUserIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  UserEdit01Icon,
} from "@hugeicons/core-free-icons";

const route = useRoute();
const router = useRouter();
const usersStore = useUsersStore();
const userId = route.params.id as string;
const submitting = ref(false);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  grade: "",
  roleId: "",
  matricule: "",
});

onMounted(async () => {
  await usersStore.fetchRoles();
  
  if (userId) {
    const user = await usersStore.fetchUserById(userId);
    form.firstName = user.firstName;
    form.lastName = user.lastName;
    form.email = user.email;
    form.phone = user.phone || "";
    form.grade = user.grade || "";
    form.roleId = user.role.id;
    form.matricule = user.matricule || "";
  }
});

async function handleSubmit() {
  submitting.value = true;
  try {
    await usersStore.updateUser(userId, form);
    router.push({ name: "admin.users.detail", params: { id: userId } });
  } catch (err) {
    console.error("Failed to update user:", err);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push({ name: "admin.users.detail", params: { id: userId } });
}
</script>

<template>
  <section class="space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center gap-4">
        <button class="btn btn-ghost btn-circle" @click="goBack">
          <HugeiconsIcon :icon="ArrowLeft01Icon" :size="20" />
        </button>
        <div class="p-2 rounded-lg bg-primary/10">
          <HugeiconsIcon :icon="UserEdit01Icon" :size="32" class="text-primary" />
        </div>
        <div>
          <h1 class="text-3xl font-bold">Modifier l'utilisateur</h1>
          <p class="text-base-content/70 mt-1">
            Mettez à jour les informations de l'utilisateur
          </p>
        </div>
      </div>
    </header>

    <!-- Chargement -->
    <div v-if="usersStore.loading && !submitting" class="bg-base-200 border-l-4 border-info p-12">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-info"></span>
        <p class="text-base-content/70">Chargement des données...</p>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-else-if="usersStore.error" class="bg-base-200 border-l-4 border-error p-5">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-error" />
        <span class="font-medium">{{ usersStore.error }}</span>
      </div>
    </div>

    <!-- Formulaire -->
    <form v-else @submit.prevent="handleSubmit" class="bg-base-200 border-l-4 border-accent">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center gap-3">
          <HugeiconsIcon :icon="User02Icon" :size="24" class="text-accent" />
          <h2 class="text-xl font-semibold">Informations de l'utilisateur</h2>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Nom et prénom -->
        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Prénom *</span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HugeiconsIcon :icon="User02Icon" :size="18" class="text-base-content/40" />
              </div>
              <input
                v-model="form.firstName"
                type="text"
                class="input input-bordered w-full pl-10"
                required
                placeholder="Jean"
              />
            </div>
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Nom *</span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HugeiconsIcon :icon="User02Icon" :size="18" class="text-base-content/40" />
              </div>
              <input
                v-model="form.lastName"
                type="text"
                class="input input-bordered w-full pl-10"
                required
                placeholder="Dupont"
              />
            </div>
          </label>
        </div>

        <!-- Matricule (lecture seule) -->
        <label class="form-control">
          <div class="label">
            <span class="label-text font-medium">Matricule</span>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon :icon="IdIcon" :size="18" class="text-base-content/40" />
            </div>
            <input
              :value="form.matricule"
              type="text"
              class="input input-bordered w-full pl-10 bg-base-300/50"
              disabled
            />
          </div>
          <div class="label">
            <span class="label-text-alt text-base-content/60">
              Le matricule ne peut pas être modifié
            </span>
          </div>
        </label>

        <!-- Email -->
        <label class="form-control">
          <div class="label">
            <span class="label-text font-medium">Email professionnel *</span>
          </div>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HugeiconsIcon :icon="Mail01Icon" :size="18" class="text-base-content/40" />
            </div>
            <input
              v-model="form.email"
              type="email"
              class="input input-bordered w-full pl-10"
              required
              placeholder="jean.dupont@police.belgium.eu"
            />
          </div>
        </label>

        <!-- Téléphone et Grade -->
        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Téléphone</span>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <HugeiconsIcon :icon="Call02Icon" :size="18" class="text-base-content/40" />
              </div>
              <input
                v-model="form.phone"
                type="tel"
                class="input input-bordered w-full pl-10"
                placeholder="+32 2 123 45 67"
              />
            </div>
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text font-medium">Grade</span>
            </div>
            <select v-model="form.grade" class="select select-bordered">
              <option value="">Sélectionnez un grade</option>
              <option value="Inspecteur">Inspecteur</option>
              <option value="Premier Inspecteur">Premier Inspecteur</option>
              <option value="Inspecteur principal">Inspecteur principal</option>
              <option value="Premier Inspecteur Principal">Premier Inspecteur Principal</option>
              <option value="Commissaire">Commissaire</option>
              <option value="Premier Commissaire">Premier Commissaire</option>
            </select>
            <div class="label">
              <span class="label-text-alt text-base-content/60">Utilisé pour la signature des rapports</span>
            </div>
          </label>
        </div>

        <!-- Rôle -->
        <label class="form-control">
          <div class="label">
            <span class="label-text font-medium flex items-center gap-2">
              <HugeiconsIcon :icon="ShieldUserIcon" :size="18" />
              Rôle *
            </span>
          </div>
          <select v-model="form.roleId" class="select select-bordered" required>
            <option value="" disabled>Sélectionnez un rôle</option>
            <option v-for="role in usersStore.roles" :key="role.id" :value="role.id">
              {{ role.name }} - {{ role.description }}
            </option>
          </select>
        </label>

        <!-- Actions -->
        <div class="flex gap-3 justify-end pt-6 border-t border-base-300">
          <button type="button" class="btn btn-ghost gap-2" @click="goBack" :disabled="submitting">
            <HugeiconsIcon :icon="Cancel01Icon" :size="18" />
            Annuler
          </button>
          <button type="submit" class="btn btn-primary gap-2" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="18" />
            {{ submitting ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
