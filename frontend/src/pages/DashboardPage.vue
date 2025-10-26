<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/layout/AppShell.vue";
import ProtectedSignature from "@/components/ProtectedSignature.vue";

// Import HugeIcons
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  DashboardSpeed01Icon,
  FileAttachmentIcon,
  UserGroupIcon,
  Search01Icon,
  Settings02Icon,
  UserMultiple02Icon,
  Mail01Icon,
  SettingsError02Icon,
  ArtificialIntelligence01Icon,
  SearchingIcon,
  ShieldUserIcon,
  User02Icon,
  Logout01Icon,
  MoreVerticalIcon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";

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
      icon: DashboardSpeed01Icon,
      badge: undefined,
    },
    {
      label: "Rapports",
      to: { name: "reports.list" },
      icon: FileAttachmentIcon,
      badge: undefined, // Vous pouvez ajouter un compteur ici plus tard
    },
    {
      label: "Entités",
      to: { name: "entities" },
      icon: UserGroupIcon,
      badge: undefined,
    },
    {
      label: "Recherche",
      to: { name: "search" },
      icon: Search01Icon,
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
      icon: Settings02Icon,
      visible: canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Gestion des utilisateurs",
      to: { name: "admin.users" },
      icon: UserMultiple02Icon,
      visible: canManageUsers.value,
      badge: undefined,
    },
    {
      label: "Configuration SMTP",
      to: { name: "admin.smtp" },
      icon: Mail01Icon,
      visible: canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Paramètres système",
      to: { name: "admin.system" },
      icon: SettingsError02Icon,
      visible: canManageSystemSettings.value || canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Configuration IA",
      to: { name: "admin.ai" },
      icon: ArtificialIntelligence01Icon,
      visible: canAccessAdmin.value,
      badge: undefined,
    },
    {
      label: "Gestion de la recherche",
      to: { name: "admin.search" },
      icon: SearchingIcon,
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
    icon: ShieldUserIcon,
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
      <div class="space-y-2 mb-8">
        <RouterLink
          v-for="item in mainNavigation"
          :key="item.label"
          :to="item.to"
          class="group flex items-center justify-between px-4 py-3.5 text-base font-bold rounded-xl transition-all duration-200 backdrop-blur-md"
          active-class="bg-white/40 text-white shadow-2xl ring-2 ring-white/40"
          inactive-class="bg-white/10 text-white/95 hover:bg-white/25 hover:text-white hover:shadow-xl hover:ring-2 hover:ring-white/20"
        >
          <div class="flex items-center gap-3.5">
            <HugeiconsIcon :icon="item.icon" :size="22" class="flex-shrink-0 drop-shadow-md" />
            <span class="tracking-wide drop-shadow-md">{{ item.label }}</span>
          </div>
          <span v-if="item.badge" class="badge badge-sm bg-white/40 text-white border-0 font-bold shadow-lg ring-1 ring-white/30">
            {{ item.badge }}
          </span>
        </RouterLink>
      </div>

      <!-- Section Administration (déroulant) -->
      <div v-if="adminNavigation" class="mt-8 pt-8 border-t border-white/30">
        <details class="group">
          <summary class="flex items-center justify-between px-4 py-3 text-sm font-bold text-white hover:text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-all duration-200 list-none mb-2 backdrop-blur-md shadow-lg">
            <div class="flex items-center gap-3">
              <HugeiconsIcon :icon="adminNavigation.icon" :size="20" class="flex-shrink-0 drop-shadow-md" />
              <span class="uppercase tracking-widest text-xs drop-shadow-md">{{ adminNavigation.label }}</span>
            </div>
            <HugeiconsIcon :icon="ArrowDown01Icon" :size="18" class="transition-transform duration-200 group-open:rotate-180 flex-shrink-0 drop-shadow-md" />
          </summary>
          <div class="mt-2 space-y-1.5 ml-1">
            <RouterLink
              v-for="child in adminNavigation.children"
              :key="child.label"
              :to="child.to"
              class="group flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 backdrop-blur-md"
              active-class="bg-white/35 text-white shadow-xl ring-2 ring-white/30"
              inactive-class="bg-white/10 text-white/95 hover:bg-white/20 hover:text-white hover:shadow-lg"
            >
              <div class="flex items-center gap-3">
                <HugeiconsIcon :icon="child.icon" :size="20" class="flex-shrink-0 drop-shadow" />
                <span class="drop-shadow">{{ child.label }}</span>
              </div>
              <span v-if="child.badge" class="badge badge-sm bg-white/35 text-white border-0 font-bold shadow-md ring-1 ring-white/20">
                {{ child.badge }}
              </span>
            </RouterLink>
          </div>
        </details>
      </div>
    </template>

    <template #user>
      <div class="flex items-center gap-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 backdrop-blur-md shadow-lg ring-1 ring-white/20">
        <div
          v-if="auth.user.avatarUrl"
          class="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white/40 shadow-xl flex-shrink-0"
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
          class="w-12 h-12 rounded-xl bg-white/35 text-white flex items-center justify-center font-bold ring-2 ring-white/30 shadow-xl backdrop-blur-sm text-base flex-shrink-0 drop-shadow-lg"
        >
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold text-white truncate drop-shadow-lg">
            {{ auth.user.firstName }} {{ auth.user.lastName }}
          </p>
          <p class="text-xs text-white/90 truncate font-semibold drop-shadow">{{ auth.user.roleName }}</p>
        </div>
        <div class="dropdown dropdown-top dropdown-end flex-shrink-0">
          <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle hover:bg-white/25 bg-white/15 border border-white/30 hover:border-white/40 shadow-md">
            <HugeiconsIcon :icon="MoreVerticalIcon" :size="18" class="text-white drop-shadow" />
          </div>
          <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-2xl bg-white rounded-xl w-52 border border-gray-100 mb-2">
            <li>
              <RouterLink :to="{ name: 'profile' }" class="flex items-center gap-3 text-gray-700 hover:bg-gray-50 rounded-lg px-4 py-3 font-medium">
                <HugeiconsIcon :icon="User02Icon" :size="20" />
                <span>Mon profil</span>
              </RouterLink>
            </li>
            <!-- Signature display with protection -->
            <li v-if="auth.user.signatureUrl" class="px-2 py-2">
              <div class="text-xs text-gray-500 font-semibold mb-1 px-2">Ma signature</div>
              <ProtectedSignature 
                :src="auth.user.signatureUrl"
                max-height="64px"
              />
            </li>
            <li>
              <button @click="handleLogout" class="flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-lg px-4 py-3 font-medium">
                <HugeiconsIcon :icon="Logout01Icon" :size="20" />
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
