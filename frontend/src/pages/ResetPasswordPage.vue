<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { api } from "@/services/http";
import { HugeiconsIcon } from "@hugeicons/vue";
import {
  SearchVisualIcon,
  LockIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  ViewIcon,
  ViewOffIcon,
  CheckmarkCircle02Icon,
  CircleIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";

const router = useRouter();
const route = useRoute();

const form = reactive({
  newPassword: "",
  confirmPassword: "",
});

const loading = ref(false);
const error = ref("");
const success = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const token = computed(() => route.query.token as string);

onMounted(() => {
  if (!token.value) {
    error.value = "Token de réinitialisation manquant";
  }
});

const passwordsMatch = computed(() => {
  return form.newPassword === form.confirmPassword;
});

const passwordStrength = computed(() => {
  const pwd = form.newPassword;
  let strength = 0;
  
  if (pwd.length >= 12) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) strength++;
  
  return strength;
});

const passwordStrengthLabel = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1:
      return "Très faible";
    case 2:
      return "Faible";
    case 3:
      return "Moyen";
    case 4:
      return "Fort";
    case 5:
      return "Très fort";
    default:
      return "";
  }
});

const passwordStrengthColor = computed(() => {
  switch (passwordStrength.value) {
    case 0:
    case 1:
      return "error";
    case 2:
      return "warning";
    case 3:
      return "info";
    case 4:
    case 5:
      return "success";
    default:
      return "";
  }
});

// Validation criteria
const hasMinLength = computed(() => form.newPassword.length >= 12);
const hasUpperCase = computed(() => /[A-Z]/.test(form.newPassword));
const hasLowerCase = computed(() => /[a-z]/.test(form.newPassword));
const hasNumber = computed(() => /[0-9]/.test(form.newPassword));
const hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(form.newPassword));

async function handleSubmit() {
  if (!passwordsMatch.value) {
    error.value = "Les mots de passe ne correspondent pas";
    return;
  }

  if (passwordStrength.value < 5) {
    error.value = "Le mot de passe ne respecte pas tous les critères de sécurité";
    return;
  }

  try {
    loading.value = true;
    error.value = "";

    await api.post("/auth/reset-password", {
      token: token.value,
      newPassword: form.newPassword,
    });

    success.value = true;

    // Redirection après 3 secondes
    setTimeout(() => {
      router.push("/login");
    }, 3000);
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
            Nouveau mot de passe
          </h2>
          <p class="text-center text-base-content/70 mb-6">
            Créez un nouveau mot de passe sécurisé pour votre compte.
          </p>

          <!-- Success Message -->
          <div v-if="success" class="alert alert-success mb-4">
            <HugeiconsIcon :icon="CheckmarkCircle01Icon" :size="20" />
            <div>
              <div class="font-bold">Mot de passe réinitialisé !</div>
              <div class="text-sm">
                Vous allez être redirigé vers la page de connexion...
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-error mb-4">
            <HugeiconsIcon :icon="AlertCircleIcon" :size="20" />
            <span>{{ error }}</span>
          </div>

          <!-- Form -->
          <form v-if="!success && token" class="space-y-4" @submit.prevent="handleSubmit">
            <!-- New Password -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Nouveau mot de passe</span>
              </div>
              <div class="relative">
                <div class="absolute left-3 top-3.5 text-base-content/40">
                  <HugeiconsIcon :icon="LockIcon" :size="20" />
                </div>
                <input 
                  v-model="form.newPassword" 
                  :type="showPassword ? 'text' : 'password'"
                  class="input input-bordered w-full pl-11 pr-11" 
                  placeholder="••••••••"
                  required 
                  :disabled="loading"
                  minlength="12"
                />
                <button
                  type="button"
                  class="absolute right-3 top-3.5 text-base-content/40 hover:text-base-content"
                  @click="showPassword = !showPassword"
                >
                  <HugeiconsIcon :icon="showPassword ? ViewOffIcon : ViewIcon" :size="20" />
                </button>
              </div>

              <!-- Password Strength -->
              <div v-if="form.newPassword" class="mt-2">
                <div class="flex justify-between text-xs mb-1">
                  <span>Force du mot de passe</span>
                  <span :class="`text-${passwordStrengthColor}`">{{ passwordStrengthLabel }}</span>
                </div>
                <progress 
                  class="progress w-full" 
                  :class="`progress-${passwordStrengthColor}`"
                  :value="passwordStrength" 
                  max="5"
                ></progress>
              </div>
            </label>

            <!-- Confirm Password -->
            <label class="form-control">
              <div class="label">
                <span class="label-text font-medium">Confirmer le mot de passe</span>
              </div>
              <div class="relative">
                <div class="absolute left-3 top-3.5 text-base-content/40">
                  <HugeiconsIcon :icon="LockIcon" :size="20" />
                </div>
                <input 
                  v-model="form.confirmPassword" 
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="input input-bordered w-full pl-11 pr-11" 
                  :class="{ 'input-error': form.confirmPassword && !passwordsMatch }"
                  placeholder="••••••••"
                  required 
                  :disabled="loading"
                />
                <button
                  type="button"
                  class="absolute right-3 top-3.5 text-base-content/40 hover:text-base-content"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <HugeiconsIcon :icon="showConfirmPassword ? ViewOffIcon : ViewIcon" :size="20" />
                </button>
              </div>
              <div v-if="form.confirmPassword && !passwordsMatch" class="label">
                <span class="label-text-alt text-error">Les mots de passe ne correspondent pas</span>
              </div>
            </label>

            <!-- Password Requirements -->
            <div class="bg-base-300 p-4 rounded-lg">
              <p class="text-sm font-medium mb-2">Le mot de passe doit contenir :</p>
              <ul class="text-xs space-y-1">
                <li :class="hasMinLength ? 'text-success' : 'text-base-content/60'">
                  <HugeiconsIcon :icon="hasMinLength ? CheckmarkCircle02Icon : CircleIcon" :size="14" class="inline align-middle" />
                  Au moins 12 caractères
                </li>
                <li :class="hasUpperCase ? 'text-success' : 'text-base-content/60'">
                  <HugeiconsIcon :icon="hasUpperCase ? CheckmarkCircle02Icon : CircleIcon" :size="14" class="inline align-middle" />
                  Une majuscule
                </li>
                <li :class="hasLowerCase ? 'text-success' : 'text-base-content/60'">
                  <HugeiconsIcon :icon="hasLowerCase ? CheckmarkCircle02Icon : CircleIcon" :size="14" class="inline align-middle" />
                  Une minuscule
                </li>
                <li :class="hasNumber ? 'text-success' : 'text-base-content/60'">
                  <HugeiconsIcon :icon="hasNumber ? CheckmarkCircle02Icon : CircleIcon" :size="14" class="inline align-middle" />
                  Un chiffre
                </li>
                <li :class="hasSpecialChar ? 'text-success' : 'text-base-content/60'">
                  <HugeiconsIcon :icon="hasSpecialChar ? CheckmarkCircle02Icon : CircleIcon" :size="14" class="inline align-middle" />
                  Un caractère spécial
                </li>
              </ul>
            </div>

            <button 
              class="btn btn-primary w-full" 
              type="submit" 
              :disabled="loading || !passwordsMatch || passwordStrength < 5"
            >
              <span v-if="loading" class="loading loading-spinner loading-sm"></span>
              <HugeiconsIcon v-else :icon="CheckmarkCircle01Icon" :size="20" />
              Réinitialiser le mot de passe
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
    </div>
  </div>
</template>
