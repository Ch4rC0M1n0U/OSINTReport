import { Router } from "express";

import { requireAuth, requirePermissions } from "@middleware/authenticate";
import { PermissionCode } from "@modules/auth/auth.constants";
import { ReportController } from "@modules/reports/report.controller";

const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get(
  "/",
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.list(req, res, next)
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

export { reportRouter };
