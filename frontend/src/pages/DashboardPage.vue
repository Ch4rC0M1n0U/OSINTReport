<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/layout/AppShell.vue";

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
  Add01Icon,
  ViewIcon,
  FileScriptIcon,
} from "@hugeicons/core-free-icons";

const auth = useAuthStore();
const router = useRouter();
const logoutSuccess = ref(false);

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
      children: null,
    },
    {
      label: "Rapports",
      to: { name: "reports.list" },
      icon: FileAttachmentIcon,
      badge: undefined,
      children: [
        {
          label: "Nouveau rapport",
          to: { name: "reports.create" },
          icon: Add01Icon,
        },
        {
          label: "Liste des rapports",
          to: { name: "reports.list" },
          icon: ViewIcon,
        },
        {
          label: "Entités",
          to: { name: "entities" },
          icon: UserGroupIcon,
        },
      ],
    },
    {
      label: "Recherche",
      to: { name: "search" },
      icon: Search01Icon,
      badge: undefined,
      children: null,
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
    {
      label: "Logs d'audit",
      to: { name: "admin.audit-logs" },
      icon: FileScriptIcon,
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
  logoutSuccess.value = true;
  
  // Redirection vers la page de login avec un message de succès
  await router.push({ 
    name: 'login',
    query: { message: 'logout-success' }
  });
}
</script>

<template>
  <div v-if="!auth.user" class="min-h-screen flex items-center justify-center">
    <span class="loading loading-spinner loading-lg"></span>
  </div>
  <AppShell v-else>
    <template #sidebar>
      <!-- Navigation principale -->
      <div class="space-y-1">
        <div v-for="item in mainNavigation" :key="item.label">
          <!-- Élément sans sous-menu -->
          <RouterLink
            v-if="!item.children"
            :to="item.to"
            class="group flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200"
            active-class="bg-white/95 text-gray-900 shadow-sm"
            inactive-class="text-white/85 hover:bg-white/10 hover:text-white"
          >
            <div class="p-1.5 rounded-lg transition-colors duration-200"
                 :class="$route.name === item.to.name ? 'bg-primary/10 text-primary' : 'bg-white/10 group-hover:bg-white/15'"
            >
              <HugeiconsIcon :icon="item.icon" :size="20" class="flex-shrink-0" />
            </div>
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="item.badge" 
                  class="badge badge-sm border-0 font-semibold"
                  :class="$route.name === item.to.name ? 'bg-primary/20 text-primary' : 'bg-white/20 text-white'"
            >
              {{ item.badge }}
            </span>
          </RouterLink>

          <!-- Élément avec sous-menu -->
          <details v-else class="group/submenu">
            <summary class="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg cursor-pointer transition-all duration-200 list-none"
                     :class="$route.path.startsWith('/reports') ? 'bg-white/95 text-gray-900 shadow-sm' : 'text-white/85 hover:bg-white/10 hover:text-white'"
            >
              <div class="p-1.5 rounded-lg transition-colors duration-200"
                   :class="$route.path.startsWith('/reports') ? 'bg-primary/10 text-primary' : 'bg-white/10 group-hover/submenu:bg-white/15'"
              >
                <HugeiconsIcon :icon="item.icon" :size="20" class="flex-shrink-0" />
              </div>
              <span class="flex-1">{{ item.label }}</span>
              <HugeiconsIcon :icon="ArrowDown01Icon" :size="14" class="transition-transform duration-200 group-open/submenu:rotate-180 flex-shrink-0" />
            </summary>
            
            <div class="mt-1 mb-2 ml-3 space-y-0.5 pl-3 border-l-2 border-white/10">
              <RouterLink
                v-for="child in item.children"
                :key="child.label"
                :to="child.to"
                class="group/child flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
                active-class="bg-white/90 text-gray-900"
                inactive-class="text-white/75 hover:bg-white/10 hover:text-white"
              >
                <div class="p-1 rounded transition-colors duration-200"
                     :class="$route.name === child.to.name ? 'bg-primary/10 text-primary' : 'bg-transparent group-hover/child:bg-white/10'"
                >
                  <HugeiconsIcon :icon="child.icon" :size="16" class="flex-shrink-0" />
                </div>
                <span class="flex-1 text-xs">{{ child.label }}</span>
              </RouterLink>
            </div>
          </details>
        </div>
      </div>

      <!-- Section Administration -->
      <div v-if="adminNavigation" class="mt-8">
        <div class="px-3 mb-3">
          <div class="flex items-center gap-2 text-white/50">
            <div class="h-px flex-1 bg-white/10"></div>
            <span class="text-xs font-bold uppercase tracking-wider">Admin</span>
            <div class="h-px flex-1 bg-white/10"></div>
          </div>
        </div>
        
        <details class="group/admin">
          <summary class="flex items-center gap-3 px-3 py-3 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-all duration-200 list-none">
            <div class="p-1.5 rounded-lg bg-white/10 group-hover/admin:bg-white/15 transition-colors duration-200">
              <HugeiconsIcon :icon="adminNavigation.icon" :size="18" class="flex-shrink-0" />
            </div>
            <span class="flex-1">{{ adminNavigation.label }}</span>
            <HugeiconsIcon :icon="ArrowDown01Icon" :size="14" class="transition-transform duration-200 group-open/admin:rotate-180 flex-shrink-0" />
          </summary>
          
          <div class="mt-1 mb-2 ml-3 space-y-0.5 pl-3 border-l-2 border-white/10">
            <RouterLink
              v-for="child in adminNavigation.children"
              :key="child.label"
              :to="child.to"
              class="group/child flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              active-class="bg-white/90 text-gray-900"
              inactive-class="text-white/70 hover:bg-white/10 hover:text-white"
            >
              <div class="p-1 rounded transition-colors duration-200"
                   :class="$route.name === child.to.name ? 'bg-primary/10 text-primary' : 'bg-transparent group-hover/child:bg-white/10'"
              >
                <HugeiconsIcon :icon="child.icon" :size="16" class="flex-shrink-0" />
              </div>
              <span class="flex-1 text-xs">{{ child.label }}</span>
              <span v-if="child.badge" class="badge badge-xs bg-white/20 text-white border-0 font-semibold">
                {{ child.badge }}
              </span>
            </RouterLink>
          </div>
        </details>
      </div>
    </template>

    <template #user>
      <div class="group p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10">
        <div class="flex items-center gap-3">
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <div
              v-if="auth.user.avatarUrl"
              class="w-11 h-11 rounded-xl overflow-hidden ring-2 ring-white/20 group-hover:ring-white/30 transition-all"
            >
              <img 
                :src="auth.user.avatarUrl" 
                :alt="`${auth.user.firstName} ${auth.user.lastName}`"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-11 h-11 rounded-xl bg-gradient-to-br from-white/20 to-white/10 text-white flex items-center justify-center font-bold ring-2 ring-white/20 group-hover:ring-white/30 transition-all text-sm"
            >
              {{ userInitials }}
            </div>
            <!-- Indicateur en ligne (optionnel) -->
            <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full ring-2 ring-[rgb(var(--secondary-rgb))]"></div>
          </div>
          
          <!-- Infos utilisateur -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white truncate leading-tight">
              {{ auth.user.firstName }} {{ auth.user.lastName }}
            </p>
            <p class="text-xs text-white/70 truncate font-medium mt-0.5">
              {{ auth.user.roleName }}
            </p>
          </div>
          
          <!-- Menu déroulant -->
          <div class="dropdown dropdown-top dropdown-end flex-shrink-0">
            <div tabindex="0" role="button" class="btn btn-ghost btn-xs btn-circle hover:bg-white/20 text-white/80 hover:text-white transition-colors">
              <HugeiconsIcon :icon="MoreVerticalIcon" :size="16" />
            </div>
            <ul tabindex="0" class="dropdown-content z-[1] menu p-1.5 shadow-2xl bg-white rounded-xl w-56 mb-2 border border-gray-100">
              <li>
                <RouterLink 
                  :to="{ name: 'profile' }" 
                  class="flex items-center gap-3 text-gray-700 hover:bg-gray-50 rounded-lg px-3.5 py-3 font-medium group"
                >
                  <div class="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <HugeiconsIcon :icon="User02Icon" :size="18" />
                  </div>
                  <span>Mon profil</span>
                </RouterLink>
              </li>
              <div class="divider my-1"></div>
              <li>
                <button 
                  @click="handleLogout" 
                  class="flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-lg px-3.5 py-3 font-medium group"
                >
                  <div class="p-1.5 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
                    <HugeiconsIcon :icon="Logout01Icon" :size="18" />
                  </div>
                  <span>Déconnexion</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <RouterView />
  </AppShell>
</template>
