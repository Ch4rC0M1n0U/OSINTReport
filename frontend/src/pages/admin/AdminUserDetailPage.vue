<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  ArrowLeft01Icon,
  Edit02Icon,
  User02Icon,
  Mail01Icon,
  Call02Icon,
  IdIcon,
  ShieldUserIcon,
  CalendarIcon,
  InformationCircleIcon,
  CheckmarkBadge01Icon,
  AlertCircleIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

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
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <button class="btn btn-ghost btn-circle" @click="goBack">
            <HugeiconsIcon :icon="ArrowLeft01Icon" :size="20" />
          </button>
          <div class="p-2 rounded-lg bg-primary/10">
            <HugeiconsIcon :icon="User02Icon" :size="32" class="text-primary" />
          </div>
          <div>
            <h1 class="text-3xl font-bold">Détails de l'utilisateur</h1>
            <p class="text-base-content/70 mt-1">
              Informations détaillées du compte utilisateur
            </p>
          </div>
        </div>
        <button class="btn btn-primary gap-2" @click="editUser">
          <HugeiconsIcon :icon="Edit02Icon" :size="20" />
          Modifier
        </button>
      </div>
    </header>

    <!-- Chargement -->
    <div v-if="usersStore.loading" class="bg-base-200 border-l-4 border-info p-12">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-info"></span>
        <p class="text-base-content/70">Chargement des données...</p>
      </div>
    </div>

    <!-- Contenu -->
    <div v-else-if="usersStore.currentUser" class="grid gap-6 lg:grid-cols-2">
      <!-- Informations personnelles -->
      <div class="bg-base-200 border-l-4 border-accent">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="User02Icon" :size="24" class="text-accent" />
            <h2 class="text-xl font-semibold">Informations personnelles</h2>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="IdIcon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Matricule</label>
              <p class="font-medium">{{ usersStore.currentUser.matricule }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="User02Icon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Nom complet</label>
              <p class="font-medium">{{ usersStore.currentUser.firstName }} {{ usersStore.currentUser.lastName }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="Mail01Icon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Email</label>
              <p class="font-medium break-all">{{ usersStore.currentUser.email }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="Call02Icon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Téléphone</label>
              <p class="font-medium">{{ usersStore.currentUser.phone || "Non renseigné" }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="ShieldUserIcon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Grade</label>
              <p class="font-medium">{{ usersStore.currentUser.grade || "Non renseigné" }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rôle et permissions -->
      <div class="bg-base-200 border-l-4 border-info">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="ShieldUserIcon" :size="24" class="text-info" />
            <h2 class="text-xl font-semibold">Rôle et permissions</h2>
          </div>
        </div>
        <div class="p-6 space-y-5">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="ShieldUserIcon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Rôle</label>
              <p class="font-medium capitalize">{{ usersStore.currentUser.role.name }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon :icon="InformationCircleIcon" :size="18" class="text-base-content/60" />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Description</label>
              <p class="text-sm">{{ usersStore.currentUser.role.description }}</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-base-300/50">
              <HugeiconsIcon 
                :icon="usersStore.currentUser.status === 'ACTIVE' ? CheckmarkBadge01Icon : usersStore.currentUser.status === 'PENDING' ? AlertCircleIcon : Cancel01Icon" 
                :size="18" 
                :class="{
                  'text-success': usersStore.currentUser.status === 'ACTIVE',
                  'text-warning': usersStore.currentUser.status === 'PENDING',
                  'text-error': usersStore.currentUser.status === 'SUSPENDED',
                }"
              />
            </div>
            <div class="flex-1">
              <label class="text-sm text-base-content/70 block mb-1">Statut</label>
              <span
                class="badge badge-lg"
                :class="{
                  'badge-success': usersStore.currentUser.status === 'ACTIVE',
                  'badge-warning': usersStore.currentUser.status === 'PENDING',
                  'badge-error': usersStore.currentUser.status === 'SUSPENDED',
                }"
              >
                {{ usersStore.currentUser.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Informations système -->
      <div class="bg-base-200 border-l-4 border-warning lg:col-span-2">
        <div class="p-6 border-b border-base-300">
          <div class="flex items-center gap-3">
            <HugeiconsIcon :icon="CalendarIcon" :size="24" class="text-warning" />
            <h2 class="text-xl font-semibold">Informations système</h2>
          </div>
        </div>
        <div class="p-6">
          <div class="grid gap-6 md:grid-cols-3">
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg bg-base-300/50">
                <HugeiconsIcon :icon="IdIcon" :size="18" class="text-base-content/60" />
              </div>
              <div class="flex-1">
                <label class="text-sm text-base-content/70 block mb-1">ID</label>
                <p class="font-mono text-sm break-all">{{ usersStore.currentUser.id }}</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg bg-base-300/50">
                <HugeiconsIcon :icon="CalendarIcon" :size="18" class="text-base-content/60" />
              </div>
              <div class="flex-1">
                <label class="text-sm text-base-content/70 block mb-1">Créé le</label>
                <p class="text-sm">{{ formatDate(usersStore.currentUser.createdAt) }}</p>
              </div>
            </div>
            
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg bg-base-300/50">
                <HugeiconsIcon :icon="CalendarIcon" :size="18" class="text-base-content/60" />
              </div>
              <div class="flex-1">
                <label class="text-sm text-base-content/70 block mb-1">Modifié le</label>
                <p class="text-sm">{{ formatDate(usersStore.currentUser.updatedAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
