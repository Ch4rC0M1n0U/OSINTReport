<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

const router = useRouter();
const usersStore = useUsersStore();
const submitting = ref(false);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  matricule: "",
  phone: "",
  grade: "",
  password: "",
  roleId: "",
});

onMounted(async () => {
  await usersStore.fetchRoles();
});

async function handleSubmit() {
  submitting.value = true;
  try {
    await usersStore.createUser(form);
    router.push({ name: "admin.users" });
  } catch (err) {
    console.error("Failed to create user:", err);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push({ name: "admin.users" });
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center gap-4">
      <button class="btn btn-ghost btn-sm" @click="goBack">
        <HugeiconsIcon :icon="ArrowLeft01Icon" :size="20" />
      </button>
      <div>
        <h2 class="text-2xl font-semibold">Nouvel utilisateur</h2>
        <p class="text-sm text-base-content/70">
          Créez un nouveau compte utilisateur pour la plateforme
        </p>
      </div>
    </header>

    <form @submit.prevent="handleSubmit" class="card bg-base-100 shadow max-w-2xl">
      <div class="card-body space-y-4">
        <h3 class="card-title text-lg">Informations de l'utilisateur</h3>

        <div v-if="usersStore.error" class="alert alert-error">
          <span>{{ usersStore.error }}</span>
        </div>

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
          />
          <div class="label">
            <span class="label-text-alt">
              L'email servira d'identifiant de connexion
            </span>
          </div>
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control">
            <div class="label">
              <span class="label-text">Téléphone</span>
            </div>
            <input
              v-model="form.phone"
              type="tel"
              class="input input-bordered"
              placeholder="+32 2 123 45 67"
            />
          </label>

          <label class="form-control">
            <div class="label">
              <span class="label-text">Grade</span>
            </div>
            <select v-model="form.grade" class="select select-bordered">
              <option value="">Sélectionnez un grade</option>
              <option value="Inspecteur">Inspecteur</option>
              <option value="Premier Inspecteur">Premier Inspecteur</option>
              <option value="Inspecteur principal">Inspecteur principal</option>
              <option value="Premier Inspecteur Principal">Premier Inspecteur Principal</option>
              <option value="Commissaire">Commissaire</option>
              <option value="Premier Commissaire">Premier Commissaire</option>
            </select>
            <div class="label">
              <span class="label-text-alt">Utilisé pour la signature des rapports</span>
            </div>
          </label>
        </div>

        <label class="form-control">
          <div class="label">
            <span class="label-text">Mot de passe temporaire *</span>
          </div>
          <input
            v-model="form.password"
            type="password"
            class="input input-bordered"
            required
            minlength="12"
            placeholder="••••••••"
          />
          <div class="label">
            <span class="label-text-alt">
              Minimum 12 caractères avec majuscule, minuscule, chiffre et caractère spécial
            </span>
          </div>
        </label>

        <label class="form-control">
          <div class="label">
            <span class="label-text">Rôle *</span>
          </div>
          <select v-model="form.roleId" class="select select-bordered" required>
            <option value="" disabled>Sélectionnez un rôle</option>
            <option v-for="role in usersStore.roles" :key="role.id" :value="role.id">
              {{ role.name }} - {{ role.description }}
            </option>
          </select>
        </label>

        <div class="card-actions justify-end pt-4">
          <button type="button" class="btn btn-ghost" @click="goBack" :disabled="submitting">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            <span v-if="submitting" class="loading loading-spinner loading-sm"></span>
            <span v-else>Créer l'utilisateur</span>
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
