<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUsersStore } from "@/stores/users";
import { HugeiconsIcon } from "@hugeicons/vue";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

const route = useRoute();
const router = useRouter();
const usersStore = useUsersStore();
const userId = route.params.id as string;
const submitting = ref(false);

const form = reactive({
  firstName: "",
  lastName: "",
  email: "",
  roleId: "",
});

onMounted(async () => {
  await usersStore.fetchRoles();
  
  if (userId) {
    const user = await usersStore.fetchUserById(userId);
    form.firstName = user.firstName;
    form.lastName = user.lastName;
    form.email = user.email;
    form.roleId = user.role.id;
  }
});

async function handleSubmit() {
  submitting.value = true;
  try {
    await usersStore.updateUser(userId, form);
    router.push({ name: "admin.users.detail", params: { id: userId } });
  } catch (err) {
    console.error("Failed to update user:", err);
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push({ name: "admin.users.detail", params: { id: userId } });
}
</script>

<template>
  <section class="space-y-6">
    <header class="flex items-center gap-4">
      <button class="btn btn-ghost btn-sm" @click="goBack">
        <HugeiconsIcon :icon="ArrowLeft01Icon" :size="20" />
      </button>
      <div>
        <h2 class="text-2xl font-semibold">Modifier l'utilisateur</h2>
        <p class="text-sm text-base-content/70">
          Mettez à jour les informations de l'utilisateur
        </p>
      </div>
    </header>

    <div v-if="usersStore.loading && !submitting" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="card bg-base-100 shadow max-w-2xl">
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
            <span class="label-text">Email professionnel *</span>
          </div>
          <input
            v-model="form.email"
            type="email"
            class="input input-bordered"
            required
            placeholder="jean.dupont@police.belgium.eu"
          />
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
            <span v-else>Enregistrer</span>
          </button>
        </div>
      </div>
    </form>
  </section>
</template>
