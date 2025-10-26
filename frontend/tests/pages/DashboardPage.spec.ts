import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";

import DashboardPage from "@/pages/DashboardPage.vue";
import { useAuthStore } from "@/stores/auth";

const RouterLinkStub = {
  props: ["to"],
  template: "<a><slot /></a>",
};

const RouterViewStub = {
  template: "<div data-testid=\"router-view\"></div>",
};

function bootstrapAuthStore(pinia = createPinia()) {
  setActivePinia(pinia);
  const auth = useAuthStore();
  auth.initialized = true;
  return { auth, pinia };
}

describe("DashboardPage navigation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("affiche le menu administration lorsque les permissions sont présentes", () => {
    const { auth, pinia } = bootstrapAuthStore();

    auth.user = {
      id: "user-admin",
      email: "admin@osint.local",
      firstName: "Admin",
      lastName: "User",
      matricule: "ADMIN-001",
      phone: null,
      grade: null,
      avatarUrl: null,
      signatureUrl: null,
      roleName: "Administrateur",
      permissions: ["system:admin", "users:read"],
    };

    render(DashboardPage, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: RouterViewStub,
        },
      },
    });

    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.getByText("Réglages")).toBeInTheDocument();
    expect(screen.getByText("Gestion des utilisateurs")).toBeInTheDocument();
  });

  it("cache les entrées administration pour un lecteur sans droits", () => {
    const { auth, pinia } = bootstrapAuthStore();

    auth.user = {
      id: "user-reader",
      email: "reader@osint.local",
      firstName: "Reader",
      lastName: "User",
      matricule: "READER-001",
      phone: null,
      grade: null,
      avatarUrl: null,
      signatureUrl: null,
      roleName: "Lecteur",
      permissions: ["reports:read"],
    };

    render(DashboardPage, {
      global: {
        plugins: [pinia],
        stubs: {
          RouterLink: RouterLinkStub,
          RouterView: RouterViewStub,
        },
      },
    });

    expect(screen.queryByText("Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Réglages")).not.toBeInTheDocument();
    expect(screen.queryByText("Gestion des utilisateurs")).not.toBeInTheDocument();
  });
});
