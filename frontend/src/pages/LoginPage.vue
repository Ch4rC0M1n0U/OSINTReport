<script setup lang="ts">
import { reactive, computed, ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useSystemSettings } from "@/composables/useSystemSettings";
import { twoFactorApi } from "@/services/api/twoFactor";
import TwoFactorModal from "@/components/TwoFactorModal.vue";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  SearchVisualIcon,
  SecurityCheckIcon,
  DashboardSpeed01Icon,
  LockIcon,
  Mail01Icon,
  AlertCircleIcon,
  Login01Icon,
  UserAdd01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { settings, logoUrl } = useSystemSettings();

const form = reactive({
  identifier: "",
  password: "",
});

// État 2FA
const show2FAModal = ref(false);
const tempToken = ref("");

// Message de succès après déconnexion
const showLogoutSuccess = ref(false);

// Textes dynamiques basés sur les paramètres système
const serviceName = computed(() => settings.value?.serviceName || "OSINT");
const serviceFullName = computed(() => settings.value?.serviceFullName || "Plateforme de gestion et d'analyse OSINT");
const serviceAddress = computed(() => {
  const parts = [];
  if (settings.value?.serviceAddress) parts.push(settings.value.serviceAddress);
  if (settings.value?.servicePostalCode || settings.value?.serviceCity) {
    const cityPart = [settings.value?.servicePostalCode, settings.value?.serviceCity].filter(Boolean).join(' ');
    parts.push(cityPart);
  }
  if (settings.value?.serviceCountry) parts.push(settings.value.serviceCountry);
  return parts.length > 0 ? parts.join(', ') : null;
});

async function handleSubmit() {
  try {
    const result = await auth.login(form);
    
    // Si la 2FA est requise
    if (result?.requires2FA && result?.tempToken) {
      tempToken.value = result.tempToken;
      show2FAModal.value = true;
      return;
    }
    
    // Laisser le router guard gérer la redirection (maintenance ou dashboard)
    const redirect = (route.query.redirect as string) ?? "/";
    await router.push(redirect);
  } catch (err) {
    // erreur déjà gérée dans le store
  }
}

async function handle2FAVerification(code: string) {
  try {
    const result = await twoFactorApi.verify2FA(tempToken.value, code);
    
    if (result && result.user) {
      // Mettre à jour l'utilisateur dans le store
      auth.updateUser(result.user);
      auth.initialized = true;
      
      // Rediriger
      const redirect = (route.query.redirect as string) ?? "/";
      await router.push(redirect);
      
      show2FAModal.value = false;
    }
  } catch (err: any) {
    auth.error = err.response?.data?.message || "Code de vérification invalide";
  }
}

function cancel2FA() {
  show2FAModal.value = false;
  tempToken.value = "";
}

// Vérifier si on arrive après une déconnexion
onMounted(() => {
  if (route.query.message === 'logout-success') {
    showLogoutSuccess.value = true;
    
    // Masquer le message après 5 secondes
    setTimeout(() => {
      showLogoutSuccess.value = false;
    }, 5000);
  }
});
</script>

<template>
  <div class="min-h-screen flex" data-theme="osint">
    <!-- Left Side - Image & Description -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-primary-focus overflow-hidden">
      <!-- Background Image -->
      <div 
        class="absolute inset-0 bg-cover bg-center opacity-20"
        style="background-image: url('/images/backgrounds/login-bg.jpg')"
      ></div>
      
      <!-- Overlay Pattern -->
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOSA5LTE4IDE4LTE4djE4SDM2ek0xOCAwYzAgOSA5IDE4IDE4IDE4VjBoLTE4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      
      <!-- Content -->
      <div class="relative z-10 flex flex-col justify-center px-16 text-primary-content">
        <!-- Logo et nom du service -->
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-6">
            <!-- Logo du service si disponible -->
            <div v-if="logoUrl" class="flex-shrink-0">
              <img 
                :src="logoUrl" 
                :alt="`Logo ${serviceName}`" 
                class="h-16 w-auto object-contain drop-shadow-lg"
              />
            </div>
            <!-- Icône par défaut si pas de logo -->
            <HugeiconsIcon v-else :icon="SearchVisualIcon" :size="48" class="drop-shadow-lg" />
            
            <!-- Nom du service -->
            <div>
              <h1 class="text-4xl font-bold drop-shadow-md">{{ serviceName }}</h1>
              <p v-if="serviceFullName && serviceFullName !== serviceName" class="text-sm text-primary-content/80 mt-1">
                {{ serviceFullName }}
              </p>
            </div>
          </div>
          <div class="w-20 h-1 bg-primary-content/50 rounded-full"></div>
        </div>
        
        <h2 class="text-3xl font-semibold mb-6 leading-tight">
          Plateforme de gestion<br />et d'analyse OSINT
        </h2>
        
        <div class="space-y-4 text-lg text-primary-content/90">
          <div class="flex items-start gap-3">
            <HugeiconsIcon :icon="SecurityCheckIcon" :size="24" class="mt-1" />
            <p>Créez et gérez vos rapports d'investigation en toute sécurité</p>
          </div>
          <div class="flex items-start gap-3">
            <HugeiconsIcon :icon="DashboardSpeed01Icon" :size="24" class="mt-1" />
            <p>Collaborez efficacement avec votre équipe d'analystes</p>
          </div>
          <div class="flex items-start gap-3">
            <HugeiconsIcon :icon="LockIcon" :size="24" class="mt-1" />
            <p>Données chiffrées et conformité aux normes de sécurité</p>
          </div>
        </div>

        <div class="mt-12 p-6 bg-primary-content/10 backdrop-blur-sm rounded-2xl border border-primary-content/20">
          <p class="text-sm text-primary-content/80 italic">
            "Solution professionnelle pour les forces de l'ordre et les services de renseignement"
          </p>
        </div>
      </div>
    </div>

    <!-- Right Side - Login Form -->
    <div class="w-full lg:w-1/2 flex items-center justify-center bg-base-100 p-8">
      <div class="w-full max-w-md">
        <!-- Mobile Logo -->
        <div class="lg:hidden mb-8">
          <div class="flex items-center justify-center gap-3 mb-2">
            <!-- Logo du service si disponible -->
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              :alt="`Logo ${serviceName}`" 
              class="h-12 w-auto object-contain"
            />
            <!-- Icône par défaut si pas de logo -->
            <HugeiconsIcon v-else :icon="SearchVisualIcon" :size="40" class="text-primary" />
            
            <div class="text-center">
              <h1 class="text-2xl font-bold text-primary">{{ serviceName }}</h1>
            </div>
          </div>
          <p v-if="serviceFullName && serviceFullName !== serviceName" class="text-center text-sm text-base-content/70">
            {{ serviceFullName }}
          </p>
        </div>

        <!-- Form Card -->
        <div class="space-y-6">
          <div class="text-center lg:text-left">
            <h2 class="text-3xl font-bold text-base-content mb-2">Bienvenue</h2>
            <p class="text-base-content/70">
              Connectez-vous pour accéder à vos rapports
            </p>
          </div>

          <!-- Message de succès après déconnexion -->
          <div v-if="showLogoutSuccess" class="alert alert-success">
            <HugeiconsIcon :icon="CheckmarkCircle02Icon" :size="20" />
            <span>Vous avez été déconnecté avec succès.</span>
          </div>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Email ou Matricule</span>
              </div>
              <div class="relative">
                <div class="absolute left-3 top-3.5 text-base-content/40">
                  <HugeiconsIcon :icon="Mail01Icon" :size="20" />
                </div>
                <input 
                  v-model="form.identifier" 
                  type="text" 
                  class="input input-bordered w-full pl-11" 
                  placeholder="nom.prenom@police.belgium.eu ou ABC123"
                  required 
                />
              </div>
              <div class="label">
                <span class="label-text-alt text-base-content/60">Utilisez votre email professionnel ou votre matricule</span>
              </div>
            </label>

            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Mot de passe</span>
              </div>
              <div class="relative">
                <div class="absolute left-3 top-3.5 text-base-content/40">
                  <HugeiconsIcon :icon="LockIcon" :size="20" />
                </div>
                <input 
                  v-model="form.password" 
                  type="password" 
                  class="input input-bordered w-full pl-11" 
                  placeholder="••••••••"
                  required 
                />
              </div>
            </label>

            <div class="flex items-center justify-between">
              <label class="label cursor-pointer gap-2">
                <input type="checkbox" class="checkbox checkbox-sm" />
                <span class="label-text">Se souvenir de moi</span>
              </label>
              <RouterLink to="/forgot-password" class="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </RouterLink>
            </div>

            <div v-if="auth.error" class="alert alert-error">
              <HugeiconsIcon :icon="AlertCircleIcon" :size="20" />
              <span>{{ auth.error }}</span>
            </div>

            <button 
              class="btn btn-primary w-full text-base" 
              type="submit" 
              :disabled="auth.loading"
            >
              <span v-if="auth.loading" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="Login01Icon" :size="20" />
              Se connecter
            </button>
          </form>

          <div class="divider text-sm text-base-content/50">Nouveau sur la plateforme ?</div>

          <RouterLink to="/register" class="btn btn-outline w-full text-base">
            <HugeiconsIcon :icon="UserAdd01Icon" :size="20" />
            Créer un compte
          </RouterLink>

          <!-- Pied de page -->
          <div class="mt-8 pt-6 border-t border-base-content/10">
            <div class="text-center text-xs text-base-content/50">
              <p>En vous connectant, vous acceptez nos</p>
              <p class="mb-3">
                <a href="#" class="link link-hover">Conditions d'utilisation</a> 
                et 
                <a href="#" class="link link-hover">Politique de confidentialité</a>
              </p>
              
              <!-- Adresse du service en petit -->
              <p v-if="serviceAddress" class="text-xs text-base-content/40 mt-4">
                {{ serviceName }} · {{ serviceAddress }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal 2FA -->
    <TwoFactorModal
      :show="show2FAModal"
      :tempToken="tempToken"
      @verify="handle2FAVerification"
      @cancel="cancel2FA"
    />
  </div>
</template>
