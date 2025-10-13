<script setup lang="ts">
import { reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { api } from "@/services/http";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  SearchVisualIcon,
  LockIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Mail01Icon,
  SentIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";

const form = reactive({
  email: "",
});

const loading = ref(false);
const error = ref("");
const success = ref(false);

async function handleSubmit() {
  try {
    loading.value = true;
    error.value = "";
    success.value = false;

    await api.post("/auth/forgot-password", form);

    success.value = true;
    form.email = "";
  } catch (err: any) {
    error.value = err.response?.data?.message || "Une erreur est survenue";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-100 p-8" data-theme="osint">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <HugeiconsIcon :icon="SearchVisualIcon" :size="40" class="text-primary" />
        <h1 class="text-2xl font-bold text-primary">OSINT Report</h1>
      </div>

      <!-- Card -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <!-- Icon -->
          <div class="flex justify-center mb-4">
            <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <HugeiconsIcon :icon="LockIcon" :size="40" class="text-primary" />
            </div>
          </div>

          <!-- Title -->
          <h2 class="card-title text-2xl text-center justify-center mb-2">
            Mot de passe oublié ?
          </h2>
          <p class="text-center text-base-content/70 mb-6">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <!-- Success Message -->
          <div v-if="success" class="alert alert-success mb-4">
            <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="20" />
            <div>
              <div class="font-bold">Email envoyé !</div>
              <div class="text-sm">
                Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-error mb-4">
            <HugeiconsIcon :icon="AlertCircleIcon" :size="20" />
            <span>{{ error }}</span>
          </div>

          <!-- Form -->
          <form v-if="!success" class="space-y-4" @submit.prevent="handleSubmit">
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Email professionnel</span>
              </div>
              <div class="relative">
                <div class="absolute left-3 top-3.5 text-base-content/40">
                  <HugeiconsIcon :icon="Mail01Icon" :size="20" />
                </div>
                <input 
                  v-model="form.email" 
                  type="email" 
                  class="input input-bordered w-full pl-11" 
                  placeholder="nom.prenom@police.belgium.eu"
                  required 
                  :disabled="loading"
                />
              </div>
            </label>

            <button 
              class="btn btn-primary w-full" 
              type="submit" 
              :disabled="loading"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="SentIcon" :size="20" />
              Envoyer le lien de réinitialisation
            </button>
          </form>

          <!-- Back to Login -->
          <div class="divider text-sm">OU</div>
          
          <RouterLink to="/login" class="btn btn-ghost btn-block">
            <HugeiconsIcon :icon="ArrowLeft01Icon" :size="20" />
            Retour à la connexion
          </RouterLink>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-xs text-base-content/50 mt-8">
        <p>Besoin d'aide ? Contactez votre administrateur système</p>
      </div>
    </div>
  </div>
</template>
