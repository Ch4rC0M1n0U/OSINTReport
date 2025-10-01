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
    const redirect = (route.query.redirect as string | undefined) ?? { name: "dashboard" };
    router.push(redirect);
  } catch (err) {
    // erreur déjà gérée dans le store
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200" data-theme="osint">
    <div class="card w-full max-w-md shadow-xl bg-base-100">
      <div class="card-body">
        <h1 class="text-2xl font-semibold text-center">Connexion</h1>
        <p class="text-sm text-center text-base-content/70">
          Accédez à la plateforme de rapports OSINT.
        </p>
        <form class="mt-6 flex flex-col gap-4" @submit.prevent="handleSubmit">
          <label class="form-control">
            <div class="label">
              <span class="label-text">Email professionnel</span>
            </div>
            <input v-model="form.email" type="email" class="input input-bordered" required />
          </label>
          <label class="form-control">
            <div class="label">
              <span class="label-text">Mot de passe</span>
            </div>
            <input v-model="form.password" type="password" class="input input-bordered" required />
          </label>

          <div v-if="auth.error" class="alert alert-error bg-error/10 text-error-content">
            {{ auth.error }}
          </div>

          <button class="btn btn-primary" type="submit" :class="{ loading: auth.loading }">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
