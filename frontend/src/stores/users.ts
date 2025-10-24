import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/services/http";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "PENDING";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  phone: string | null;
  grade: string | null;
  status: UserStatus;
  role: {
    id: string;
    name: string;
    description: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export const useUsersStore = defineStore("users", () => {
  const users = ref<User[]>([]);
  const currentUser = ref<UserDetail | null>(null);
  const roles = ref<Role[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchUsers() {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<{ users: User[] }>("/users");
      users.value = response.data.users;
    } catch (err) {
      error.value = "Erreur lors du chargement des utilisateurs";
      console.error("Failed to fetch users:", err);
    } finally {
      loading.value = false;
    }
  }

  async function updateUserStatus(userId: string, status: UserStatus) {
    loading.value = true;
    error.value = null;

    try {
      await api.patch(`/users/${userId}/status`, { status });
      
      // Update local state
      const userIndex = users.value.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        users.value[userIndex].status = status;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || "Erreur lors de la mise à jour du statut";
      console.error("Failed to update user status:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUserById(userId: string) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<{ user: UserDetail }>(`/users/${userId}`);
      currentUser.value = response.data.user;
      return response.data.user;
    } catch (err) {
      error.value = "Erreur lors du chargement de l'utilisateur";
      console.error("Failed to fetch user:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoles() {
    try {
      const response = await api.get<{ roles: Role[] }>("/users/roles");
      roles.value = response.data.roles;
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      throw err;
    }
  }

  async function updateUser(userId: string, data: { firstName: string; lastName: string; email: string; phone?: string; grade?: string; roleId: string }) {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.patch<{ user: UserDetail }>(`/users/${userId}`, data);
      
      // Update local state
      const userIndex = users.value.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        users.value[userIndex] = {
          ...users.value[userIndex],
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          role: response.data.user.role.name,
        };
      }
      
      return response.data.user;
    } catch (err) {
      error.value = "Erreur lors de la mise à jour de l'utilisateur";
      console.error("Failed to update user:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createUser(data: { firstName: string; lastName: string; email: string; password: string; roleId: string; matricule: string; phone?: string; grade?: string }) {
    loading.value = true;
    error.value = null;

    try {
      // Ensure roles are loaded
      if (roles.value.length === 0) {
        await fetchRoles();
      }

      // Find the role name from roleId
      const role = roles.value.find(r => r.id === data.roleId);
      if (!role) {
        error.value = "Rôle invalide sélectionné";
        throw new Error("Rôle invalide");
      }

      // Convert roleId to role name for the backend
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        matricule: data.matricule,
        phone: data.phone || null,
        grade: data.grade || null,
        role: role.name, // Send role name instead of roleId
      };

      console.log("Creating user with payload:", { ...payload, password: "***" });

      const response = await api.post<{ user: User }>("/auth/register", payload);
      
      // Add to local state
      await fetchUsers();
      
      return response.data.user;
    } catch (err: any) {
      if (err.response?.data?.message) {
        error.value = err.response.data.message;
      } else {
        error.value = "Erreur lors de la création de l'utilisateur";
      }
      console.error("Failed to create user:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    users,
    currentUser,
    roles,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    fetchRoles,
    updateUserStatus,
    updateUser,
    createUser,
  };
});
