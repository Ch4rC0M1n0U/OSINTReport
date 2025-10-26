import { defineStore } from "pinia";
import { computed, ref } from "vue";

import { api } from "@/services/http";

interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  matricule: string;
  phone: string | null;
  grade: string | null;
  avatarUrl: string | null;
  signatureUrl: string | null;
  timezone: string | null;
  dateFormat: string | null;
  firstDayOfWeek: string | null;
  roleName: string;
  permissions: string[];
}

export const useAuthStore = defineStore("auth", () => {
  const initialized = ref(false);
  const user = ref<UserInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  function hasPermission(permission: string): boolean {
    if (!user.value) return false;
    return user.value.permissions.includes(permission);
  }

  function clearSession() {
    user.value = null;
    initialized.value = true;
    loading.value = false;
  }

  async function bootstrap(force = false) {
    if (initialized.value && !force) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<{ user: UserInfo }>("/auth/me");
      user.value = response.data.user;
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
      
      // Fetch user data after successful login
      try {
        const response = await api.get<{ user: UserInfo }>("/auth/me");
        user.value = response.data.user;
        initialized.value = true;
      } catch (fetchErr) {
        // If fetching user data fails after login, clear session
        user.value = null;
        initialized.value = true;
        throw new Error("Erreur lors de la récupération des données utilisateur");
      }
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

  function updateUser(updatedUser: UserInfo) {
    user.value = updatedUser;
  }

  return {
    initialized,
    user,
    loading,
    error,
    isAuthenticated,
    hasPermission,
    clearSession,
    bootstrap,
    login,
    logout,
    updateUser,
  };
});
