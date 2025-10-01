import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "../../src/shared/prisma";
import { PermissionCode } from "../../src/modules/auth/auth.constants";
import {
  authRequest,
  createUserWithPermissions,
  ensureBootstrap,
  truncateReportData,
  truncateUsers,
} from "../setup/test-helpers";

describe("ReportController", () => {
  let accessToken: string;

  beforeAll(async () => {
    await ensureBootstrap();
  });

  beforeEach(async () => {
    await truncateReportData();
    await truncateUsers();
    const account = await createUserWithPermissions([
      PermissionCode.REPORTS_READ,
      PermissionCode.REPORTS_WRITE,
    ]);
    accessToken = account.accessToken;
  });

  afterAll(async () => {
    await truncateReportData();
    await truncateUsers();
    await prisma.$disconnect();
  });

  it("crée un rapport et le retrouve dans la liste", async () => {
    const payload = {
      title: "Rapport OSINT Test",
      caseNumber: "CASE-123",
      reportNumber: "R-001",
      purpose: "Analyse d'exemple",
      objectives: ["Identifier contacts", "Cartographier comptes sociaux"],
      issuedAt: new Date().toISOString(),
    };

    const createRes = await authRequest(accessToken)
      .post("/api/reports")
      .send(payload)
      .expect(201);

    expect(createRes.body.report).toBeDefined();
    expect(createRes.body.report.title).toBe(payload.title);
    expect(createRes.body.report.caseNumber).toBe(payload.caseNumber);

    const listRes = await authRequest(accessToken)
      .get("/api/reports")
      .query({ limit: 10 })
      .expect(200);

    expect(listRes.body.items).toHaveLength(1);
    expect(listRes.body.total).toBe(1);
    expect(listRes.body.items[0].title).toBe(payload.title);
  });

  it("met à jour un rapport existant avec des champs optionnels", async () => {
    const createRes = await authRequest(accessToken)
      .post("/api/reports")
      .send({ title: "Rapport à mettre à jour" })
      .expect(201);

    const reportId = createRes.body.report.id as string;

    const updateRes = await authRequest(accessToken)
      .patch(`/api/reports/${reportId}`)
      .send({
        summary: "Synthèse actualisée",
        status: "PUBLISHED",
        relatedCases: ["CASE-X"],
        objectives: ["Préparer perquisition"],
      })
      .expect(200);

    expect(updateRes.body.report.summary).toBe("Synthèse actualisée");
    expect(updateRes.body.report.status).toBe("PUBLISHED");
    expect(updateRes.body.report.relatedCases).toEqual(["CASE-X"]);
    expect(updateRes.body.report.objectives).toEqual(["Préparer perquisition"]);
  });

  it("refuse la création sans permission d'écriture", async () => {
    const reader = await createUserWithPermissions([PermissionCode.REPORTS_READ], {
      roleName: "reader",
    });

    await authRequest(reader.accessToken)
      .post("/api/reports")
      .send({ title: "Doit échouer" })
      .expect(403);
  });

  it("gère le cycle de vie complet d'un module", async () => {
    const reportId = (
      await authRequest(accessToken).post("/api/reports").send({ title: "Rapport module" })
    ).body.report.id as string;

    const moduleRes = await authRequest(accessToken)
      .post(`/api/reports/${reportId}/modules`)
      .send({
        type: "research-detail",
        slug: "entite-principale",
        title: "Entité principale",
        position: 1,
        payload: { findings: [{ label: "Profil", description: "Profil trouvé" }] },
      })
      .expect(201);

    const moduleId = moduleRes.body.module.id as string;
    expect(moduleRes.body.module.slug).toBe("entite-principale");

    const moduleAttachmentRes = await authRequest(accessToken)
      .post(`/api/reports/${reportId}/attachments`)
      .send({
        moduleId,
        type: "document",
        storageKey: "s3://bucket/rapport-intro.pdf",
        fileName: "rapport-intro.pdf",
        mimeType: "application/pdf",
        fileSize: 2048,
      })
      .expect(201);

    expect(moduleAttachmentRes.body.attachment.storageKey).toBe("s3://bucket/rapport-intro.pdf");

    const vaultItemsAfterAttachment = await prisma.vaultItem.count();
    expect(vaultItemsAfterAttachment).toBe(1);

    const updated = await authRequest(accessToken)
      .patch(`/api/reports/${reportId}/modules/${moduleId}`)
      .send({ headline: "Résumé", slug: "entite-maj" })
      .expect(200);

    expect(updated.body.module.slug).toBe("entite-maj");
    expect(updated.body.module.headline).toBe("Résumé");

    await authRequest(accessToken)
      .delete(`/api/reports/${reportId}/modules/${moduleId}`)
      .expect(204);

    const modules = await prisma.reportModule.findMany({ where: { reportId } });
    expect(modules).toHaveLength(0);

    const vaultItemsAfterDelete = await prisma.vaultItem.count();
    expect(vaultItemsAfterDelete).toBe(0);
  });

  it("enregistre une pièce jointe liée au rapport", async () => {
    const report = (
      await authRequest(accessToken)
        .post("/api/reports")
        .send({ title: "Rapport avec PJ" })
    ).body.report;

    const attachmentRes = await authRequest(accessToken)
      .post(`/api/reports/${report.id}/attachments`)
      .send({
        type: "image",
        storageKey: "s3://bucket/capture.png",
        fileName: "capture.png",
        mimeType: "image/png",
        fileSize: 1024,
        caption: "Capture d'écran",
      })
      .expect(201);

    expect(attachmentRes.body.attachment).toMatchObject({
      fileName: "capture.png",
      mimeType: "image/png",
      type: "image",
    });
    expect(attachmentRes.body.attachment.storageKey).toBe("s3://bucket/capture.png");

    const attachments = await prisma.reportAttachment.findMany({ where: { reportId: report.id } });
    expect(attachments).toHaveLength(1);
    expect(attachments[0]?.storageKey).toMatch(/^vault:/);

    const vaultItems = await prisma.vaultItem.findMany();
    expect(vaultItems).toHaveLength(1);

    const detailRes = await authRequest(accessToken)
      .get(`/api/reports/${report.id}`)
      .expect(200);

    expect(detailRes.body.report.attachments[0].storageKey).toBe("s3://bucket/capture.png");
  });

  it("renvoie un résumé dashboard avec les indicateurs clés", async () => {
    const reports = await Promise.all(
      ["Rapport A", "Rapport B", "Rapport C"].map((title) =>
        authRequest(accessToken).post("/api/reports").send({ title }).expect(201)
      )
    );

    const reportIds = reports.map((res) => res.body.report.id as string);

    await authRequest(accessToken)
      .patch(`/api/reports/${reportIds[1]}`)
      .send({ status: "PUBLISHED" })
      .expect(200);

    await authRequest(accessToken)
      .patch(`/api/reports/${reportIds[2]}`)
      .send({ status: "ARCHIVED" })
      .expect(200);

    const dashboardRes = await authRequest(accessToken)
      .get("/api/reports/dashboard")
      .expect(200);

    expect(dashboardRes.body).toMatchObject({
      totals: {
        all: 3,
        draft: 1,
        published: 1,
        archived: 1,
      },
    });

    const distribution = dashboardRes.body.statusDistribution as Array<{ status: string; count: number }>;
    const byStatus = Object.fromEntries(distribution.map((item) => [item.status, item.count]));
    expect(byStatus.DRAFT).toBe(1);
    expect(byStatus.PUBLISHED).toBe(1);
    expect(byStatus.ARCHIVED).toBe(1);

    expect(dashboardRes.body.recentReports).toHaveLength(3);

    const timeline = dashboardRes.body.timeline as Array<{ date: string; count: number }>;
    expect(timeline.length).toBeGreaterThan(0);
    expect(timeline.some((entry) => entry.count >= 1)).toBe(true);
  });
});
