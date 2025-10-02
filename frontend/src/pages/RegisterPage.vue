<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/services/http";

const router = useRouter();
const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const form = reactive({
  firstName: "",
  lastName: "",
  matricule: "",
  email: "",
  password: "",
  confirmPassword: "",
});

async function handleSubmit() {
  error.value = null;

  // Validate passwords match
  if (form.password !== form.confirmPassword) {
    error.value = "Les mots de passe ne correspondent pas";
    return;
  }

  // Validate email domain
  if (!form.email.toLowerCase().endsWith("@police.belgium.eu")) {
    error.value = "L'email doit appartenir au domaine @police.belgium.eu";
    return;
  }

  submitting.value = true;

  try {
    // Pour le moment, affichons un message car l'inscription publique nécessite approbation admin
    // await api.post("/auth/register-public", { ... });
    
    error.value = "L'inscription publique n'est pas encore activée. Veuillez contacter un administrateur pour créer votre compte.";
    
    // Uncomment when public registration is enabled:
    // await api.post("/auth/register", {
    //   firstName: form.firstName,
    //   lastName: form.lastName,
    //   matricule: form.matricule,
    //   email: form.email,
    //   password: form.password,
    //   role: "reader",
    // });
    // success.value = true;
    // setTimeout(() => {
    //   router.push({ name: "login" });
    // }, 3000);
  } catch (err: any) {
    error.value =
      err.response?.data?.message || "Erreur lors de l'inscription. Veuillez réessayer.";
  } finally {
    submitting.value = false;
  }
}

function goToLogin() {
  router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 px-4">
    <div class="card w-full max-w-lg bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-3xl font-bold text-center justify-center mb-2">
          Nouvelle inscription
        </h2>
        <p class="text-center text-base-content/70 mb-6">
          Créez votre compte pour accéder à la plateforme OSINT
        </p>

        <!-- Success Message -->
        <div v-if="success" class="alert alert-success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <div class="font-bold">Inscription réussie !</div>
            <div class="text-sm">Redirection vers la page de connexion...</div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error && !success" class="alert alert-error">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ error }}</span>
        </div>

        <form v-if="!success" @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Personal Information -->
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-control">
              <div class="label">
                <span class="label-text">Prénom *</span>
              </div>
              <input
                v-model="form.firstName"
                type="text"
                class="input input-bordered"
                required
                placeholder="Jean"
                :disabled="submitting"
              />
            </label>

            <label class="form-control">
              <div class="label">
                <span class="label-text">Nom *</span>
              </div>
              <input
                v-model="form.lastName"
                type="text"
                class="input input-bordered"
                required
                placeholder="Dupont"
                :disabled="submitting"
              />
            </label>
          </div>

          <label class="form-control">
            <div class="label">
              <span class="label-text">Matricule *</span>
            </div>
            <input
              v-model="form.matricule"
              type="text"
              class="input input-bordered"
              required
              pattern="[A-Z0-9\-]+"
              placeholder="POL-12345"
              :disabled="submitting"
            />
            <div class="label">
              <span class="label-text-alt">
                Format: lettres majuscules, chiffres et tirets uniquement
              </span>
            </div>
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text">Email professionnel *</span>
            </div>
            <input
              v-model="form.email"
              type="email"
              class="input input-bordered"
              required
              placeholder="jean.dupont@police.belgium.eu"
              :disabled="submitting"
            />
            <div class="label">
              <span class="label-text-alt">
                Doit se terminer par @police.belgium.eu
              </span>
            </div>
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text">Mot de passe *</span>
            </div>
            <input
              v-model="form.password"
              type="password"
              class="input input-bordered"
              required
              minlength="12"
              placeholder="••••••••••••"
              :disabled="submitting"
            />
            <div class="label">
              <span class="label-text-alt">
                Minimum 12 caractères avec majuscule, minuscule, chiffre et caractère spécial
              </span>
            </div>
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text">Confirmer le mot de passe *</span>
            </div>
            <input
              v-model="form.confirmPassword"
              type="password"
              class="input input-bordered"
              required
              minlength="12"
              placeholder="••••••••••••"
              :disabled="submitting"
            />
          </label>

          <div class="card-actions flex-col gap-2 pt-4">
            <button type="submit" class="btn btn-primary w-full" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
              <span v-else>S'inscrire</span>
            </button>

            <button
              type="button"
              class="btn btn-ghost w-full"
              @click="goToLogin"
              :disabled="submitting"
            >
              Déjà inscrit ? Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
