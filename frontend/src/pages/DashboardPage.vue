<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppShell from "@/components/layout/AppShell.vue";

const auth = useAuthStore();

const navigation = [
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
];

async function handleLogout() {
  await auth.logout();
}
</script>

<template>
  <AppShell>
    <template #header>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm font-medium">{{ auth.user?.firstName }} {{ auth.user?.lastName }}</p>
          <p class="text-xs text-base-content/70">{{ auth.user?.roleName ?? "" }}</p>
        </div>
        <button class="btn btn-sm btn-outline" @click="handleLogout">Déconnexion</button>
      </div>
    </template>

    <template #sidebar>
      <ul class="menu gap-1">
        <li v-for="item in navigation" :key="item.label">
          <RouterLink :to="item.to" class="flex items-center gap-3">
            <span class="material-symbols-rounded">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </li>
      </ul>
    </template>

    <RouterView />
  </AppShell>
</template>
