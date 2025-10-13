<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/layout/AppShell.vue";

const auth = useAuthStore();

const canAccessAdmin = computed(() => {
  const permissions = auth.user?.permissions;
  return permissions ? permissions.includes("system:admin") : false;
});

const canManageSystemSettings = computed(() => {
  const permissions = auth.user?.permissions;
  return permissions ? permissions.includes("system:settings") : false;
});

const canManageUsers = computed(() => {
  const permissions = auth.user?.permissions;
  if (!permissions) return false;
  return permissions.includes("users:read") || permissions.includes("users:write");
});

const userInitials = computed(() => {
  if (!auth.user) return "";
  return `${auth.user.firstName.charAt(0)}${auth.user.lastName.charAt(0)}`.toUpperCase();
});

const mainNavigation = computed(() => {
  return [
    {
      label: "Tableau de bord",
      to: { name: "dashboard" },
      icon: "dashboard",
      badge: undefined,
    },
    {
      label: "Rapports",
      to: { name: "reports.list" },
      icon: "assignment",
      badge: undefined, // Vous pouvez ajouter un compteur ici plus tard
    },
    {
      label: "Entités",
      to: { name: "entities" },
      icon: "group_work",
      badge: undefined,
    },
    {
      label: "Recherche",
      to: { name: "search" },
      icon: "search",
      badge: undefined,
    },
  ];
});

const adminNavigation = computed(() => {
  if (!canAccessAdmin.value && !canManageUsers.value && !canManageSystemSettings.value) {
    return null;
  }

  const adminChildren = [
    {
      label: "Réglages",
      to: { name: "admin.settings" },
      icon: "tune",
      visible: canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Gestion des utilisateurs",
      to: { name: "admin.users" },
      icon: "group",
      visible: canManageUsers.value,
      badge: undefined,
    },
    {
      label: "Configuration SMTP",
      to: { name: "admin.smtp" },
      icon: "mail",
      visible: canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Paramètres système",
      to: { name: "admin.system" },
      icon: "settings",
      visible: canManageSystemSettings.value || canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Configuration IA",
      to: { name: "admin.ai" },
      icon: "psychology",
      visible: canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Gestion de la recherche",
      to: { name: "admin.search" },
      icon: "manage_search",
      visible: canAccessAdmin.value,
      badge: undefined,
    },
  ]
    .filter((child) => child.visible)
    .map(({ visible, ...rest }) => ({ ...rest, badge: rest.badge }));

  if (adminChildren.length === 0) {
    return null;
  }

  return {
    label: "Administration",
    icon: "shield_person",
    children: adminChildren,
  };
});

async function handleLogout() {
  await auth.logout();
}
</script>

<template>
  <div v-if="!auth.user" class="min-h-screen flex items-center justify-center">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
  <AppShell v-else>
    <template #sidebar>
      <!-- Navigation principale -->
      <div class="space-y-1 mb-8">
        <RouterLink
          v-for="item in mainNavigation"
          :key="item.label"
          :to="item.to"
          class="group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
          active-class="bg-white/25 text-white shadow-lg backdrop-blur-sm"
          inactive-class="text-white/80 hover:bg-white/15 hover:text-white hover:shadow-md"
        >
          <div class="flex items-center gap-3">
            <span class="material-symbols-rounded text-xl">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </div>
          <span v-if="item.badge" class="badge badge-sm bg-white/25 text-white border-0 font-semibold shadow-sm">
            {{ item.badge }}
          </span>
        </RouterLink>
      </div>

      <!-- Section Administration (déroulant) -->
      <div v-if="adminNavigation" class="mt-8">
        <details class="group">
          <summary class="flex items-center justify-between px-4 py-3 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all duration-200 list-none">
            <div class="flex items-center gap-3">
              <span class="material-symbols-rounded text-xl">{{ adminNavigation.icon }}</span>
              <span class="uppercase tracking-wider text-xs">{{ adminNavigation.label }}</span>
            </div>
            <span class="material-symbols-rounded text-lg transition-transform duration-200 group-open:rotate-180">
              expand_more
            </span>
          </summary>
          <div class="mt-2 space-y-1">
            <RouterLink
              v-for="child in adminNavigation.children"
              :key="child.label"
              :to="child.to"
              class="group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ml-2"
              active-class="bg-white/25 text-white shadow-lg backdrop-blur-sm"
              inactive-class="text-white/80 hover:bg-white/15 hover:text-white hover:shadow-md"
            >
              <div class="flex items-center gap-3">
                <span class="material-symbols-rounded text-xl">{{ child.icon }}</span>
                <span>{{ child.label }}</span>
              </div>
              <span v-if="child.badge" class="badge badge-sm bg-white/25 text-white border-0 font-semibold shadow-sm">
                {{ child.badge }}
              </span>
            </RouterLink>
          </div>
        </details>
      </div>
    </template>

    <template #user>
      <div class="flex items-center gap-3">
        <div
          v-if="auth.user.avatarUrl"
          class="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-lg"
        >
          <img 
            :src="auth.user.avatarUrl" 
            :alt="`${auth.user.firstName} ${auth.user.lastName}`"
            class="w-full h-full object-cover"
            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
          />
        </div>
        <div
          v-else
          class="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold ring-2 ring-white/10 shadow-lg backdrop-blur-sm"
        >
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white truncate drop-shadow-sm">
            {{ auth.user.firstName }} {{ auth.user.lastName }}
          </p>
          <p class="text-xs text-white/70 truncate">{{ auth.user.roleName }}</p>
        </div>
        <div class="dropdown dropdown-top dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle hover:bg-white/15">
            <span class="material-symbols-rounded text-white text-lg">more_vert</span>
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-2xl bg-white rounded-xl w-52 border border-gray-100 mb-2">
            <li>
              <RouterLink :to="{ name: 'profile' }" class="flex items-center gap-3 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-2">
                <span class="material-symbols-rounded text-lg">person</span>
                <span>Mon profil</span>
              </RouterLink>
            </li>
            <li>
              <button @click="handleLogout" class="flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-lg px-4 py-2">
                <span class="material-symbols-rounded text-lg">logout</span>
                <span>Déconnexion</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <RouterView />
  </AppShell>
</template>
