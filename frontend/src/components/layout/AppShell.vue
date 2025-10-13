<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useSystemSettings } from "@/composables/useSystemSettings";

const systemSettings = useSystemSettings();

onMounted(() => {
  systemSettings.loadSettings();
});

// Convertir la couleur hex en RGB pour utiliser avec opacity
const secondaryColorRgb = computed(() => {
  const hex = systemSettings.secondaryColor.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
});

// Générer les classes de style dynamiquement
const sidebarStyle = computed(() => ({
  background: `linear-gradient(to bottom, rgba(${secondaryColorRgb.value}, 0.85), rgba(${secondaryColorRgb.value}, 0.95))`,
  backdropFilter: 'blur(10px)',
}));
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex" data-theme="osint">
    <!-- Sidebar fixe à gauche avec couleur secondaire -->
    <aside 
      class="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 shadow-2xl border-r border-white/10"
      :style="sidebarStyle"
    >
      <!-- Logo + Titre -->
      <div class="flex items-center gap-4 h-20 px-6 border-b border-white/10">
        <div v-if="systemSettings.logoUrl.value" class="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm p-2 shadow-lg ring-1 ring-white/20">
          <img 
            :src="systemSettings.logoUrl.value" 
            :alt="systemSettings.appTitle.value" 
            class="w-full h-full object-contain"
          />
        </div>
        <div v-else class="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm shadow-lg ring-1 ring-white/20">
          <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-bold text-white drop-shadow-sm truncate">
            {{ systemSettings.appTitle.value }}
          </h1>
          <p v-if="systemSettings.serviceFullName.value" class="text-xs text-white/70 truncate">
            {{ systemSettings.serviceFullName.value }}
          </p>
        </div>
      </div>

      <!-- Menu principal -->
      <nav class="flex-1 px-4 py-6 overflow-y-auto">
        <slot name="sidebar" />
      </nav>

      <!-- User section en bas -->
      <div class="flex-shrink-0 border-t border-white/10 p-4">
        <slot name="user" />
      </div>
    </aside>

    <!-- Mobile sidebar (drawer) -->
    <div class="lg:hidden">
      <div class="drawer">
        <input id="app-drawer" type="checkbox" class="drawer-toggle" />
        <div class="drawer-side z-50">
          <label for="app-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
          <aside 
            class="w-72 min-h-full shadow-2xl"
            :style="sidebarStyle"
          >
            <!-- Logo + Titre mobile -->
            <div class="flex items-center gap-4 h-20 px-6 border-b border-white/10">
              <div v-if="systemSettings.logoUrl.value" class="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm p-2 shadow-lg ring-1 ring-white/20">
                <img 
                  :src="systemSettings.logoUrl.value" 
                  :alt="systemSettings.appTitle.value" 
                  class="w-full h-full object-contain"
                />
              </div>
              <div v-else class="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm shadow-lg ring-1 ring-white/20">
                <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h1 class="text-lg font-bold text-white drop-shadow-sm truncate">
                  {{ systemSettings.appTitle.value }}
                </h1>
                <p v-if="systemSettings.serviceFullName.value" class="text-xs text-white/70 truncate">
                  {{ systemSettings.serviceFullName.value }}
                </p>
              </div>
            </div>

            <!-- Menu mobile -->
            <nav class="px-4 py-6">
              <slot name="sidebar" />
            </nav>

            <!-- User mobile -->
            <div class="border-t border-white/10 p-4 mt-auto">
              <slot name="user" />
            </div>
          </aside>
        </div>
      </div>
    </div>

    <!-- Main content area -->
    <div class="lg:pl-72 flex flex-col flex-1 min-h-screen">
      <!-- Top bar mobile uniquement (sans menu profil) -->
      <div class="lg:hidden sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <!-- Burger menu mobile -->
        <label for="app-drawer" class="px-4 text-gray-500 focus:outline-none flex items-center cursor-pointer hover:text-gray-700 transition-colors">
          <span class="sr-only">Open sidebar</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
        
        <!-- Titre mobile -->
        <div class="flex-1 px-4 flex items-center">
          <h1 class="text-lg font-semibold text-gray-900">
            {{ systemSettings.appTitle.value }}
          </h1>
        </div>
      </div>

      <!-- Page content -->
      <main class="flex-1">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>
