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
    },
    {
      label: "Rapports",
      to: { name: "reports.list" },
      icon: "assignment",
    },
    {
      label: "Recherche",
      to: { name: "search" },
      icon: "search",
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
    },
    {
      label: "Gestion des utilisateurs",
      to: { name: "admin.users" },
      icon: "group",
      visible: canManageUsers.value,
    },
    {
      label: "Configuration SMTP",
      to: { name: "admin.smtp" },
      icon: "mail",
      visible: canAccessAdmin.value,
    },
    {
      label: "Paramètres système",
      to: { name: "admin.system" },
      icon: "settings",
      visible: canManageSystemSettings.value || canAccessAdmin.value,
    },
  ]
    .filter((child) => child.visible)
    .map(({ visible, ...rest }) => rest);

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
    <template #header>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm font-medium">{{ auth.user.firstName }} {{ auth.user.lastName }}</p>
          <p class="text-xs text-base-content/70">{{ auth.user.roleName }}</p>
        </div>
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="avatar cursor-pointer">
            <div
              v-if="auth.user.avatarUrl"
              class="w-10 h-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
            >
              <img 
                :src="auth.user.avatarUrl" 
                :alt="`${auth.user.firstName} ${auth.user.lastName}`"
                @error="(e) => (e.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <div
              v-else
              class="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold ring ring-primary ring-offset-base-100 ring-offset-2"
            >
              {{ userInitials }}
            </div>
          </div>
          <ul
            tabindex="0"
            class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-3"
          >
            <li>
              <RouterLink :to="{ name: 'profile' }" class="flex items-center gap-3">
                <span class="material-symbols-rounded">person</span>
                <span>Mon profil</span>
              </RouterLink>
            </li>
            <li>
              <button @click="handleLogout" class="flex items-center gap-3 text-error">
                <span class="material-symbols-rounded">logout</span>
                <span>Déconnexion</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #sidebar>
      <div class="flex flex-col h-full">
        <!-- Menu principal -->
        <ul class="menu gap-1">
          <li v-for="item in mainNavigation" :key="item.label">
            <RouterLink :to="item.to" class="flex items-center gap-3">
              <span class="material-symbols-rounded">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </RouterLink>
          </li>
        </ul>

        <!-- Séparateur et menu Administration en bas -->
        <div v-if="adminNavigation" class="mt-auto pt-4">
          <div class="divider my-2"></div>
          <ul class="menu gap-1">
            <li>
              <details class="group">
                <summary class="flex items-center gap-3 cursor-pointer [&::-webkit-details-marker]:hidden">
                  <span class="material-symbols-rounded">{{ adminNavigation.icon }}</span>
                  <span class="flex-1">{{ adminNavigation.label }}</span>
                </summary>
                <ul class="menu menu-compact ml-8 mt-2 gap-1">
                  <li v-for="child in adminNavigation.children" :key="child.label">
                    <RouterLink :to="child.to" class="flex items-center gap-3">
                      <span class="material-symbols-rounded text-sm">{{ child.icon }}</span>
                      <span>{{ child.label }}</span>
                    </RouterLink>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <RouterView />
  </AppShell>
</template>
