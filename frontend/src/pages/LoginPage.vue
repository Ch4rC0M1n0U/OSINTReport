<script setup lang="ts">
import { reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const form = reactive({
  email: "",
  password: "",
});

async function handleSubmit() {
  try {
    await auth.login(form);
    const redirect = (route.query.redirect as string) ?? "/";
    await router.push(redirect);
  } catch (err) {
    // erreur déjà gérée dans le store
  }
}
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
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-6">
            <span class="material-symbols-rounded text-5xl">search_insights</span>
            <h1 class="text-4xl font-bold">OSINT Report</h1>
          </div>
          <div class="w-20 h-1 bg-primary-content/50 rounded-full"></div>
        </div>
        
        <h2 class="text-3xl font-semibold mb-6 leading-tight">
          Plateforme de gestion<br />et d'analyse OSINT
        </h2>
        
        <div class="space-y-4 text-lg text-primary-content/90">
          <div class="flex items-start gap-3">
            <span class="material-symbols-rounded mt-1">verified</span>
            <p>Créez et gérez vos rapports d'investigation en toute sécurité</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-symbols-rounded mt-1">team_dashboard</span>
            <p>Collaborez efficacement avec votre équipe d'analystes</p>
          </div>
          <div class="flex items-start gap-3">
            <span class="material-symbols-rounded mt-1">lock</span>
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
        <div class="lg:hidden flex items-center justify-center gap-2 mb-8">
          <span class="material-symbols-rounded text-4xl text-primary">search_insights</span>
          <h1 class="text-2xl font-bold text-primary">OSINT Report</h1>
        </div>

        <!-- Form Card -->
        <div class="space-y-6">
          <div class="text-center lg:text-left">
            <h2 class="text-3xl font-bold text-base-content mb-2">Bienvenue</h2>
            <p class="text-base-content/70">
              Connectez-vous pour accéder à vos rapports
            </p>
          </div>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Email professionnel</span>
              </div>
              <div class="relative">
                <span class="absolute left-3 top-3.5 material-symbols-rounded text-base-content/40">
                  mail
                </span>
                <input 
                  v-model="form.email" 
                  type="email" 
                  class="input input-bordered w-full pl-11" 
                  placeholder="nom.prenom@police.belgium.eu"
                  required 
                />
              </div>
            </label>

            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Mot de passe</span>
              </div>
              <div class="relative">
                <span class="absolute left-3 top-3.5 material-symbols-rounded text-base-content/40">
                  lock
                </span>
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
              <a href="#" class="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </a>
            </div>

            <div v-if="auth.error" class="alert alert-error">
              <span class="material-symbols-rounded">error</span>
              <span>{{ auth.error }}</span>
            </div>

            <button 
              class="btn btn-primary w-full text-base" 
              type="submit" 
              :disabled="auth.loading"
            >
              <span v-if="auth.loading" class="loading loading-spinner loading-sm"></span>
              <span v-else class="material-symbols-rounded">login</span>
              Se connecter
            </button>
          </form>

          <div class="divider text-sm text-base-content/50">Nouveau sur la plateforme ?</div>

          <RouterLink to="/register" class="btn btn-outline w-full text-base">
            <span class="material-symbols-rounded">person_add</span>
            Créer un compte
          </RouterLink>

          <div class="text-center text-xs text-base-content/50 mt-8">
            <p>En vous connectant, vous acceptez nos</p>
            <p>
              <a href="#" class="link link-hover">Conditions d'utilisation</a> 
              et 
              <a href="#" class="link link-hover">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
