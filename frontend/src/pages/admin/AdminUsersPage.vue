<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Add01Icon } from "@hugeicons/core-free-icons";

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
    <header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h2 class="text-2xl font-semibold">Gestion des utilisateurs</h2>
        <p class="text-sm text-base-content/70">
          Visualisez les comptes actifs, suspendez des accès et invitez de nouveaux agents.
        </p>
      </div>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="join">
          <input
            v-model="search"
            class="input input-bordered join-item"
            type="search"
            placeholder="Recherche (nom, email, matricule)"
          />
          <select v-model="statusFilter" class="select select-bordered join-item">
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs & suspendus</option>
            <option value="all">Tous</option>
          </select>
        </div>
        <RouterLink :to="{ name: 'admin.users.create' }" class="btn btn-primary">
          <HugeiconsIcon :icon="Add01Icon" :size="20" />
          Nouvel utilisateur
        </RouterLink>
      </div>
    </header>

    <div v-if="usersStore.error" class="alert alert-error">
      <span>{{ usersStore.error }}</span>
    </div>

    <div class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div v-if="usersStore.loading" class="flex justify-center py-12">
          <span class="loading loading-spinner loading-lg"></span>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Dernière connexion</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="6" class="py-8 text-center text-base-content/60">
                  Aucun utilisateur ne correspond aux critères.
                </td>
              </tr>
              <tr v-for="user in filteredUsers" :key="user.id" class="hover">
                <td class="font-mono text-sm">{{ user.matricule }}</td>
                <td>
                  <div class="font-medium">
                    {{ user.firstName }} {{ user.lastName }}
                  </div>
                  <div class="text-sm text-base-content/60">{{ user.email }}</div>
                </td>
                <td class="uppercase">{{ user.role }}</td>
                <td>
                  <span
                    class="badge"
                    :class="{
                      'badge-success': user.status === 'ACTIVE',
                      'badge-warning': user.status === 'PENDING',
                      'badge-error': user.status !== 'ACTIVE' && user.status !== 'PENDING',
                    }"
                  >
                    {{ user.status }}
                  </span>
                </td>
                <td>{{ formatDate(user.lastLoginAt) }}</td>
                <td class="text-right">
                  <div class="join">
                    <RouterLink 
                      :to="{ name: 'admin.users.detail', params: { id: user.id } }"
                      class="btn btn-ghost btn-xs join-item"
                    >
                      Détails
                    </RouterLink>
                    <RouterLink 
                      :to="{ name: 'admin.users.edit', params: { id: user.id } }"
                      class="btn btn-outline btn-xs join-item"
                    >
                      Modifier
                    </RouterLink>
                    <button 
                      v-if="user.status === 'ACTIVE'"
                      class="btn btn-warning btn-xs join-item"
                      @click="handleSuspendUser(user.id)"
                      :disabled="user.role === 'admin'"
                      :title="user.role === 'admin' ? 'Impossible de suspendre un admin' : ''"
                    >
                      Suspendre
                    </button>
                    <button 
                      v-else
                      class="btn btn-success btn-xs join-item"
                      @click="handleActivateUser(user.id)"
                    >
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
