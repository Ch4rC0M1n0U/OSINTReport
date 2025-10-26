<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSystemSettings } from '@/composables/useSystemSettings';
import { HugeiconsIcon } from '@hugeicons/vue';
import { Settings05Icon, Time01Icon, Logout01Icon } from '@hugeicons/core-free-icons';

const router = useRouter();
const auth = useAuthStore();
const { settings, logoUrl, loadSettings } = useSystemSettings();

// Textes dynamiques basés sur les paramètres système
const serviceName = computed(() => settings.value?.serviceName || 'OSINT Report');
const maintenanceMessage = computed(() => 
  settings.value?.maintenanceMessage || 
  'Le site est actuellement en maintenance pour améliorations techniques. Veuillez réessayer ultérieurement.'
);
const scheduledAt = computed(() => {
  if (!settings.value?.maintenanceScheduledAt) return null;
  
  try {
    const date = new Date(settings.value.maintenanceScheduledAt);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return null;
  }
});

// Fonction de déconnexion
async function handleLogout() {
  await auth.logout();
  await router.push({ 
    name: 'login',
    query: { message: 'logout-success' }
  });
}

// Charger les paramètres au montage
onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300" data-theme="osint">
    <!-- Background Pattern -->
    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtOSA5LTE4IDE4LTE4djE4SDM2ek0xOCAwYzAgOSA5IDE4IDE4IDE4VjBoLTE4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

    <div class="relative z-10 w-full max-w-2xl mx-4">
      <!-- Card -->
      <div class="card bg-base-100 shadow-2xl">
        <div class="card-body p-12 text-center">
          <!-- Logo et nom du service -->
          <div class="flex flex-col items-center mb-8">
            <div v-if="logoUrl" class="mb-6">
              <img 
                :src="logoUrl" 
                :alt="`Logo ${serviceName}`" 
                class="h-24 w-auto object-contain"
              />
            </div>
            <h1 class="text-3xl font-bold text-base-content">
              {{ serviceName }}
            </h1>
          </div>

          <!-- Icône de maintenance -->
          <div class="flex justify-center mb-8">
            <div class="bg-warning/10 p-6 rounded-full">
              <HugeiconsIcon 
                :icon="Settings05Icon" 
                class="w-20 h-20 text-warning animate-spin-slow"
              />
            </div>
          </div>

          <!-- Titre -->
          <h2 class="text-2xl font-semibold text-base-content mb-4">
            Site en Maintenance
          </h2>

          <!-- Message de maintenance -->
          <div class="bg-warning/5 border border-warning/20 rounded-lg p-6 mb-6">
            <p class="text-base-content/80 text-lg leading-relaxed">
              {{ maintenanceMessage }}
            </p>
          </div>

          <!-- Date de fin prévue -->
          <div v-if="scheduledAt" class="flex items-center justify-center gap-3 text-base-content/60">
            <HugeiconsIcon :icon="Time01Icon" class="w-5 h-5" />
            <div class="text-left">
              <p class="text-sm font-medium">Retour prévu</p>
              <p class="text-base font-semibold text-base-content">
                {{ scheduledAt }}
              </p>
            </div>
          </div>

          <!-- Message de remerciement -->
          <div class="mt-8 pt-6 border-t border-base-300">
            <p class="text-sm text-base-content/60">
              Merci de votre patience et de votre compréhension.
            </p>
            
            <!-- Bouton de déconnexion si authentifié -->
            <div v-if="auth.isAuthenticated" class="mt-4">
              <button 
                @click="handleLogout" 
                class="btn btn-outline btn-sm gap-2"
              >
                <HugeiconsIcon :icon="Logout01Icon" class="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center mt-6 text-base-content/50 text-sm">
        <p>Pour toute urgence, contactez votre administrateur système.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
</style>
