import { describe, beforeEach, it, expect, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useDashboardStore } from "@/stores/dashboard";
import { api } from "@/services/http";

vi.mock("@/services/http", () => ({
  api: {
    get: vi.fn(),
  },
}));

describe("useDashboardStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  it("charge le résumé et l'expose dans le state", async () => {
    const store = useDashboardStore();
    const payload = {
      generatedAt: new Date().toISOString(),
      totals: { all: 3, draft: 1, published: 1, archived: 1 },
      statusDistribution: [
        { status: "DRAFT", label: "Brouillons", count: 1, percentage: 33.3 },
        { status: "PUBLISHED", label: "Publiés", count: 1, percentage: 33.3 },
        { status: "ARCHIVED", label: "Archivés", count: 1, percentage: 33.3 },
      ],
      recentReports: [],
      timeline: [],
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    await store.fetchSummary();

    expect(api.get).toHaveBeenCalledWith("/reports/dashboard");
    expect(store.summary).toEqual(payload);
    expect(store.error).toBeNull();
  });

  it("capture l'erreur et la surface dans le store", async () => {
    const store = useDashboardStore();
    const failure = new Error("network");

    vi.mocked(api.get).mockRejectedValueOnce(failure);

    await expect(store.fetchSummary()).rejects.toThrowError(failure);
    expect(store.error).toBe("Impossible de charger le tableau de bord");
  });
});
