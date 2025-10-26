import { Router } from "express";

import { requireAuth, requirePermissions } from "@middleware/authenticate";
import { PermissionCode } from "@modules/auth/auth.constants";
import { ReportController } from "@modules/reports/report.controller";
import { checkMaintenanceMode } from "@middleware/maintenance";

const reportRouter = Router();

// 1. D'abord authentifier l'utilisateur
reportRouter.use(requireAuth);

// 2. Ensuite vérifier le mode maintenance (req.user est maintenant disponible)
reportRouter.use(checkMaintenanceMode);

reportRouter.get(
  "/",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.list(req, res, next)
);

reportRouter.get(
  "/dashboard",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.dashboard(req, res, next)
);

reportRouter.post(
  "/",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.create(req, res, next)
);

reportRouter.get(
  "/:reportId",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.detail(req, res, next)
);

reportRouter.patch(
  "/:reportId",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.update(req, res, next)
);

reportRouter.delete(
  "/:reportId",
  requirePermissions(PermissionCode.ADMIN),
  (req, res, next) => ReportController.delete(req, res, next)
);

reportRouter.get(
  "/:reportId/modules",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.listModules(req, res, next)
);

reportRouter.post(
  "/:reportId/modules",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.createModule(req, res, next)
);

reportRouter.patch(
  "/:reportId/modules/:moduleId",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.updateModule(req, res, next)
);

reportRouter.delete(
  "/:reportId/modules/:moduleId",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.deleteModule(req, res, next)
);

reportRouter.post(
  "/:reportId/attachments",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.registerAttachment(req, res, next)
);

reportRouter.post(
  "/:reportId/modules/reorder",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.reorderModules(req, res, next)
);

reportRouter.patch(
  "/:reportId/status",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.updateStatus(req, res, next)
);

reportRouter.post(
  "/:reportId/duplicate",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.duplicate(req, res, next)
);

reportRouter.get(
  "/:reportId/stats",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.getStats(req, res, next)
);

// Routes pour les enregistrements de recherche (research records)
reportRouter.post(
  "/modules/:moduleId/research-records",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.createResearchRecord(req, res, next)
);

reportRouter.get(
  "/modules/:moduleId/research-records",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.listResearchRecords(req, res, next)
);

reportRouter.get(
  "/research-records/:recordId",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.getResearchRecord(req, res, next)
);

reportRouter.patch(
  "/research-records/:recordId",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.updateResearchRecord(req, res, next)
);

reportRouter.delete(
  "/research-records/:recordId",
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.deleteResearchRecord(req, res, next)
);

reportRouter.get(
  "/research-types",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.listResearchTypes(req, res, next)
);

export { reportRouter };
