import { createRouter, createWebHistory } from "vue-router";

import DashboardPage from "@/pages/DashboardPage.vue";
import DashboardHomePage from "@/pages/dashboard/DashboardHomePage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import RegisterPage from "@/pages/RegisterPage.vue";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage.vue";
import ResetPasswordPage from "@/pages/ResetPasswordPage.vue";
import MaintenancePage from "@/pages/MaintenancePage.vue";
import ProfilePage from "@/pages/ProfilePage.vue";
import ReportListPage from "@/pages/reports/ReportListPage.vue";
import ReportCreatePage from "@/pages/reports/ReportCreatePage.vue";
import ReportDetailPage from "@/pages/reports/ReportDetailPage.vue";
import SearchPage from "@/pages/SearchPage.vue";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage.vue";
import AdminUsersPage from "@/pages/admin/AdminUsersPage.vue";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage.vue";
import AdminUserEditPage from "@/pages/admin/AdminUserEditPage.vue";
import AdminUserCreatePage from "@/pages/admin/AdminUserCreatePage.vue";
import SmtpSettingsPage from "@/pages/admin/SmtpSettingsPage.vue";
import SystemSettingsPage from "@/pages/admin/SystemSettingsPage.vue";
import AISettingsPage from "@/pages/admin/AISettingsPage.vue";
import SearchManagementPage from "@/pages/admin/SearchManagementPage.vue";
import EntitiesPage from "@/pages/EntitiesPage.vue";
import { useAuthStore } from "@/stores/auth";
import { useSystemSettings } from "@/composables/useSystemSettings";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/maintenance",
      name: "maintenance",
      component: MaintenancePage,
      meta: { public: true },
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { public: true },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
      meta: { public: true },
    },
    {
      path: "/forgot-password",
      name: "forgot-password",
      component: ForgotPasswordPage,
      meta: { public: true },
    },
    {
      path: "/reset-password",
      name: "reset-password",
      component: ResetPasswordPage,
      meta: { public: true },
    },
    {
      path: "/",
      component: DashboardPage,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: DashboardHomePage,
        },
        {
          path: "reports",
          name: "reports.list",
          component: ReportListPage,
        },
        {
          path: "reports/new",
          name: "reports.create",
          component: ReportCreatePage,
          meta: {
            requiresAuth: true,
            permissions: ["reports:write"],
          },
        },
        {
          path: "reports/:id",
          name: "reports.detail",
          component: ReportDetailPage,
          meta: {
            requiresAuth: true,
            permissions: ["reports:read"],
          },
        },
        {
          path: "search",
          name: "search",
          component: SearchPage,
          meta: {
            requiresAuth: true,
            permissions: ["reports:read"],
          },
        },
        {
          path: "entities",
          name: "entities",
          component: EntitiesPage,
          meta: {
            requiresAuth: true,
            permissions: ["reports:read"],
          },
        },
        {
          path: "profile",
          name: "profile",
          component: ProfilePage,
        },
        {
          path: "admin/settings",
          name: "admin.settings",
          component: AdminSettingsPage,
          meta: {
            requiresAuth: true,
            permissions: ["system:admin"],
          },
        },
        {
          path: "admin/users",
          name: "admin.users",
          component: AdminUsersPage,
          meta: {
            requiresAuth: true,
            permissions: ["users:read"],
          },
        },
        {
          path: "admin/users/new",
          name: "admin.users.create",
          component: AdminUserCreatePage,
          meta: {
            requiresAuth: true,
            permissions: ["users:write"],
          },
        },
        {
          path: "admin/users/:id",
          name: "admin.users.detail",
          component: AdminUserDetailPage,
          meta: {
            requiresAuth: true,
            permissions: ["users:read"],
          },
        },
        {
          path: "admin/users/:id/edit",
          name: "admin.users.edit",
          component: AdminUserEditPage,
          meta: {
            requiresAuth: true,
            permissions: ["users:write"],
          },
        },
        {
          path: "admin/smtp",
          name: "admin.smtp",
          component: SmtpSettingsPage,
          meta: {
            requiresAuth: true,
            permissions: ["system:admin"],
          },
        },
        {
          path: "admin/system",
          name: "admin.system",
          component: SystemSettingsPage,
          meta: {
            requiresAuth: true,
            permissions: ["system:settings", "system:admin"], // Permet aux admins aussi
          },
        },
        {
          path: "admin/ai",
          name: "admin.ai",
          component: AISettingsPage,
          meta: {
            requiresAuth: true,
            permissions: ["system:settings", "system:admin"],
          },
        },
        {
          path: "admin/search",
          name: "admin.search",
          component: SearchManagementPage,
          meta: {
            requiresAuth: true,
            permissions: ["system:admin"],
          },
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const { loadSettings, isMaintenanceMode } = useSystemSettings();

  if (!auth.initialized) {
    await auth.bootstrap();
  }

  // Charger les paramètres système pour vérifier le mode maintenance
  await loadSettings();

  // Permettre l'accès à la page de maintenance
  if (to.name === 'maintenance') {
    return true;
  }

  // Permettre l'accès aux pages publiques (login, register, etc.)
  if (to.meta.public) {
    if (auth.isAuthenticated) {
      // Si déjà authentifié, vérifier le mode maintenance
      if (isMaintenanceMode.value && auth.user?.roleName !== 'admin') {
        // Non-admin en mode maintenance → page de maintenance
        return { name: 'maintenance' };
      }
      // Admin ou pas de maintenance → dashboard
      return { name: "dashboard" };
    }
    // Non authentifié → accès libre aux pages publiques
    return true;
  }

  // Vérifier l'authentification
  if (!auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Vérifier le mode maintenance SEULEMENT pour les utilisateurs authentifiés
  if (isMaintenanceMode.value) {
    const isAdmin = auth.user?.roleName === 'admin';
    
    // Si non-admin, rediriger vers la page de maintenance
    if (!isAdmin) {
      return { name: 'maintenance' };
    }
    // Les admins peuvent continuer
  }

  const requiredPermissions = to.matched
    .flatMap((record) => (record.meta?.permissions as string[] | undefined) ?? [])
    .filter((value): value is string => Boolean(value));

  if (requiredPermissions.length > 0) {
    const userPermissions = auth.user?.permissions ?? [];
    const hasAccess = requiredPermissions.every((permission) => userPermissions.includes(permission));

    if (!hasAccess) {
      return { name: "dashboard" };
    }
  }

  return true;
});

export default router;
