import { createRouter, createWebHistory } from "vue-router";

import DashboardPage from "@/pages/DashboardPage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import ReportListPage from "@/pages/reports/ReportListPage.vue";
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
      path: "/",
      component: DashboardPage,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "dashboard",
          component: ReportListPage,
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

  return true;
});

export default router;
