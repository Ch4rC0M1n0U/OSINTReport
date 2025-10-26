<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import { 
  Add01Icon,
  Search01Icon,
  UserMultiple02Icon,
  FilterIcon,
  EyeIcon,
  PencilEdit01Icon,
  UserRemove01Icon,
  UserAdd01Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons";

const usersStore = useUsersStore();
const search = ref("");
const statusFilter = ref("active");

// Fetch users on component mount
onMounted(() => {
  usersStore.fetchUsers();
});

const filteredUsers = computed(() => {
  const needle = search.value.trim().toLowerCase();
  return usersStore.users.filter((user) => {
    const matchSearch =
      needle.length === 0 ||
      [user.firstName, user.lastName, user.email, user.id, user.matricule].some((field) =>
        field.toLowerCase().includes(needle)
      );

    const matchStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "inactive" && user.status !== "ACTIVE") ||
      (statusFilter.value === "active" && user.status === "ACTIVE");

    return matchSearch && matchStatus;
  });
});

function formatDate(value: string | null) {
  if (!value) return "Jamais";
  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function handleSuspendUser(userId: string) {
  if (!confirm("Êtes-vous sûr de vouloir suspendre cet utilisateur ?")) {
    return;
  }
  
  try {
    await usersStore.updateUserStatus(userId, "SUSPENDED");
  } catch (err: any) {
    alert(err.response?.data?.message || "Erreur lors de la suspension de l'utilisateur");
  }
}

async function handleActivateUser(userId: string) {
  try {
    await usersStore.updateUserStatus(userId, "ACTIVE");
  } catch (err) {
    alert("Erreur lors de l'activation de l'utilisateur");
  }
}
</script>

<template>
  <section class="space-y-6">
    <!-- En-tête de la page -->
    <header class="bg-base-200 border-l-4 border-primary p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex items-center gap-4">
          <div class="p-2 rounded-lg bg-primary/10">
            <HugeiconsIcon :icon="UserMultiple02Icon" :size="32" class="text-primary" />
          </div>
          <div>
            <h1 class="text-3xl font-bold">Gestion des utilisateurs</h1>
            <p class="text-base-content/70 mt-1">
              Visualisez les comptes actifs, suspendez des accès et invitez de nouveaux agents
            </p>
          </div>
        </div>
        <RouterLink :to="{ name: 'admin.users.create' }" class="btn btn-primary gap-2">
          <HugeiconsIcon :icon="Add01Icon" :size="20" />
          Nouvel utilisateur
        </RouterLink>
      </div>
    </header>

    <!-- Barre de recherche et filtres -->
    <div class="bg-base-200 border-l-4 border-info p-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <HugeiconsIcon :icon="Search01Icon" :size="20" class="text-base-content/40" />
          </div>
          <input
            v-model="search"
            class="input input-bordered w-full pl-12"
            type="search"
            placeholder="Rechercher par nom, email ou matricule..."
          />
        </div>
        <div class="flex items-center gap-2">
          <HugeiconsIcon :icon="FilterIcon" :size="20" class="text-base-content/60" />
          <select v-model="statusFilter" class="select select-bordered min-w-[180px]">
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs & suspendus</option>
            <option value="all">Tous</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="usersStore.error" class="bg-base-200 border-l-4 border-error p-5">
      <div class="flex items-center gap-3">
        <HugeiconsIcon :icon="AlertCircleIcon" :size="24" class="text-error" />
        <span class="font-medium">{{ usersStore.error }}</span>
      </div>
    </div>

    <!-- Tableau des utilisateurs -->
    <div class="bg-base-200 border-l-4 border-accent">
      <div class="p-6 border-b border-base-300">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            {{ filteredUsers.length }} utilisateur{{ filteredUsers.length > 1 ? 's' : '' }}
          </h2>
        </div>
      </div>

      <div class="p-0">
        <div v-if="usersStore.loading" class="flex justify-center py-16">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead class="bg-base-300">
              <tr>
                <th class="font-semibold">Matricule</th>
                <th class="font-semibold">Nom</th>
                <th class="font-semibold">Rôle</th>
                <th class="font-semibold">Statut</th>
                <th class="font-semibold">Dernière connexion</th>
                <th class="text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <HugeiconsIcon :icon="UserMultiple02Icon" :size="48" class="text-base-content/20" />
                    <p class="text-base-content/60">Aucun utilisateur ne correspond aux critères</p>
                  </div>
                </td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user.id" class="hover:bg-base-300/50">
                <td class="font-mono text-sm font-medium">{{ user.matricule }}</td>
                <td>
                  <div class="font-medium">
                    {{ user.firstName }} {{ user.lastName }}
                  </div>
                  <div class="text-sm text-base-content/60">{{ user.email }}</div>
                </td>
                <td>
                  <span class="badge badge-ghost uppercase">{{ user.role }}</span>
                </td>
                <td>
                  <span
                    class="badge gap-1"
                    :class="{
                      'badge-success': user.status === 'ACTIVE',
                      'badge-warning': user.status === 'PENDING',
                      'badge-error': user.status !== 'ACTIVE' && user.status !== 'PENDING',
                    }"
                  >
                    {{ user.status }}
                  </span>
                </td>
                <td class="text-sm">{{ formatDate(user.lastLoginAt) }}</td>
                <td class="text-right">
                  <div class="flex gap-2 justify-end">
                    <RouterLink 
                      :to="{ name: 'admin.users.detail', params: { id: user.id } }"
                      class="btn btn-ghost btn-sm gap-1"
                      title="Voir les détails"
                    >
                      <HugeiconsIcon :icon="EyeIcon" :size="16" />
                      Détails
                    </RouterLink>
                    <RouterLink 
                      :to="{ name: 'admin.users.edit', params: { id: user.id } }"
                      class="btn btn-outline btn-sm gap-1"
                      title="Modifier l'utilisateur"
                    >
                      <HugeiconsIcon :icon="PencilEdit01Icon" :size="16" />
                      Modifier
                    </RouterLink>
                    <button 
                      v-if="user.status === 'ACTIVE'"
                      class="btn btn-warning btn-sm gap-1"
                      @click="handleSuspendUser(user.id)"
                      :disabled="user.role === 'admin'"
                      :title="user.role === 'admin' ? 'Impossible de suspendre un admin' : 'Suspendre l\'utilisateur'"
                    >
                      <HugeiconsIcon :icon="UserRemove01Icon" :size="16" />
                      Suspendre
                    </button>
                    <button 
                      v-else
                      class="btn btn-success btn-sm gap-1"
                      @click="handleActivateUser(user.id)"
                      title="Activer l'utilisateur"
                    >
                      <HugeiconsIcon :icon="UserAdd01Icon" :size="16" />
                      Activer
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
