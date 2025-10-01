import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { api } from "@/services/http";

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  permissions: string[];
}

export const useAuthStore = defineStore("auth", () => {
  const initialized = ref(false);
  const user = ref<UserInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  function clearSession() {
    user.value = null;
    initialized.value = true;
    loading.value = false;
  }

  async function bootstrap() {
    if (initialized.value) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<UserInfo>("/auth/me");
      user.value = response.data;
    } catch (err) {
      user.value = null;
    } finally {
      initialized.value = true;
      loading.value = false;
    }
  }

  async function login(credentials: { email: string; password: string }) {
    loading.value = true;
    error.value = null;

    try {
      await api.post("/auth/login", credentials, { withCredentials: true });
      await bootstrap();
    } catch (err: unknown) {
      error.value = "Identifiants invalides";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Erreur lors de la déconnexion", err);
    } finally {
      clearSession();
    }
  }

  return {
    initialized,
    user,
    loading,
    error,
    isAuthenticated,
    clearSession,
    bootstrap,
    login,
    logout,
  };
});
