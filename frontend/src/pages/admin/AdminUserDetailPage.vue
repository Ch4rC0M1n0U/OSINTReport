<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft01Icon, Edit02Icon } from "@hugeicons/core-free-icons";

const route = useRoute();
const router = useRouter();
const usersStore = useUsersStore();
const userId = route.params.id as string;

onMounted(async () => {
  if (userId) {
    await usersStore.fetchUserById(userId);
  }
});

function formatDate(value: string | null) {
  if (!value) return "N/A";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function goBack() {
  router.push({ name: "admin.users" });
}

function editUser() {
  router.push({ name: "admin.users.edit", params: { id: userId } });
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button class="btn btn-ghost btn-sm" @click="goBack">
          <HugeiconsIcon :icon="ArrowLeft01Icon" :size="20" />
        </button>
        <div>
          <h2 class="text-2xl font-semibold">Détails de l'utilisateur</h2>
          <p class="text-sm text-base-content/70">
            Informations détaillées du compte utilisateur
          </p>
        </div>
      </div>
      <button class="btn btn-primary" @click="editUser">
        <HugeiconsIcon :icon="Edit02Icon" :size="20" />
        Modifier
      </button>
    </header>

    <div v-if="usersStore.loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else-if="usersStore.currentUser" class="grid gap-6 lg:grid-cols-2">
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-lg">Informations personnelles</h3>
          <div class="space-y-4">
            <div>
              <label class="text-sm text-base-content/70">Matricule</label>
              <p class="font-medium">{{ usersStore.currentUser.matricule }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Prénom</label>
              <p class="font-medium">{{ usersStore.currentUser.firstName }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Nom</label>
              <p class="font-medium">{{ usersStore.currentUser.lastName }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Email</label>
              <p class="font-medium">{{ usersStore.currentUser.email }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h3 class="card-title text-lg">Rôle et permissions</h3>
          <div class="space-y-4">
            <div>
              <label class="text-sm text-base-content/70">Rôle</label>
              <p class="font-medium capitalize">{{ usersStore.currentUser.role.name }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Description</label>
              <p class="text-sm">{{ usersStore.currentUser.role.description }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Statut</label>
              <p>
                <span
                  class="badge"
                  :class="{
                    'badge-success': usersStore.currentUser.status === 'ACTIVE',
                    'badge-warning': usersStore.currentUser.status === 'PENDING',
                    'badge-error': usersStore.currentUser.status === 'SUSPENDED',
                  }"
                >
                  {{ usersStore.currentUser.status }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow lg:col-span-2">
        <div class="card-body">
          <h3 class="card-title text-lg">Informations système</h3>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="text-sm text-base-content/70">ID</label>
              <p class="font-mono text-sm">{{ usersStore.currentUser.id }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Créé le</label>
              <p class="text-sm">{{ formatDate(usersStore.currentUser.createdAt) }}</p>
            </div>
            <div>
              <label class="text-sm text-base-content/70">Modifié le</label>
              <p class="text-sm">{{ formatDate(usersStore.currentUser.updatedAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
