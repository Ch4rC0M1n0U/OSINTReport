<script setup lang="ts">
import { onMounted } from "vue";
import { useSystemSettings } from "@/composables/useSystemSettings";

const systemSettings = useSystemSettings();

onMounted(() => {
  systemSettings.loadSettings();
});
</script>

<template>
  <div class="min-h-screen bg-base-200" data-theme="osint">
    <div class="drawer lg:drawer-open">
      <input id="app-drawer" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col">
        <!-- Header pleine largeur avec logo et titre -->
        <header class="bg-base-100 border-b">
          <!-- Top bar avec logo et titre -->
          <div class="navbar">
            <!-- Mobile menu toggle -->
            <div class="flex-none lg:hidden">
              <label for="app-drawer" aria-label="ouvrir le menu" class="btn btn-square btn-ghost">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
            </div>

            <!-- Logo à gauche -->
            <div class="flex-none">
              <div v-if="systemSettings.logoUrl.value" class="px-4">
                <img 
                  :src="systemSettings.logoUrl.value" 
                  :alt="systemSettings.appTitle.value" 
                  class="h-12 object-contain"
                />
              </div>
            </div>

            <!-- Titre de l'application -->
            <div class="flex-1">
              <div class="flex flex-col">
                <h1 class="text-xl font-bold text-primary">
                  {{ systemSettings.appTitle.value }}
                </h1>
                <p v-if="systemSettings.serviceFullName.value" class="text-xs text-base-content/70">
                  {{ systemSettings.serviceFullName.value }}
                </p>
              </div>
            </div>

            <!-- User menu à droite -->
            <div class="flex-none">
              <slot name="header" />
            </div>
          </div>
        </header>

        <!-- Main content -->
        <main class="flex-1 overflow-auto p-4">
          <slot />
        </main>
      </div>

      <!-- Sidebar -->
      <div class="drawer-side">
        <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
        <aside class="bg-base-100 w-72 min-h-full border-r">
          <div class="p-4">
            <slot name="sidebar" />
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
