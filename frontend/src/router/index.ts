import { createRouter, createWebHistory } from "vue-router";

import DashboardPage from "@/pages/DashboardPage.vue";
import DashboardHomePage from "@/pages/dashboard/DashboardHomePage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import RegisterPage from "@/pages/RegisterPage.vue";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage.vue";
import ResetPasswordPage from "@/pages/ResetPasswordPage.vue";
import ProfilePage from "@/pages/ProfilePage.vue";
import ReportListPage from "@/pages/reports/ReportListPage.vue";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage.vue";
import AdminUsersPage from "@/pages/admin/AdminUsersPage.vue";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage.vue";
import AdminUserEditPage from "@/pages/admin/AdminUserEditPage.vue";
import AdminUserCreatePage from "@/pages/admin/AdminUserCreatePage.vue";
import SmtpSettingsPage from "@/pages/admin/SmtpSettingsPage.vue";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.initialized) {
    await auth.bootstrap();
  }

  if (to.meta.public) {
    if (auth.isAuthenticated) {
      return { name: "dashboard" };
    }
    return true;
  }

  if (!auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
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
