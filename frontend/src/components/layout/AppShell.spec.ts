import { render } from "@testing-library/vue";

import AppShell from "./AppShell.vue";

describe("AppShell", () => {
  it("affiche les slots fournis", () => {
    const { getByText } = render(AppShell, {
      slots: {
        header: "Agent OSINT",
        sidebar: "Navigation",
        default: "Contenu principal",
      },
    });

    expect(getByText("Agent OSINT")).toBeInTheDocument();
    expect(getByText("Navigation")).toBeInTheDocument();
    expect(getByText("Contenu principal")).toBeInTheDocument();
  });
});
