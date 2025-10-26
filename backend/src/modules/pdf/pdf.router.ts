import { Router } from "express";
import { PDFController } from "./pdf.controller";
import { requireAuth, requirePermissions } from "@/middleware/authenticate";
import { PermissionCode } from "@/modules/auth/auth.constants";
import { checkMaintenanceMode } from "@middleware/maintenance";

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(requireAuth);
router.use(checkMaintenanceMode);

/**
 * @route GET /reports/:reportId/export
 * @desc Obtenir les informations d'export disponibles
 * @access Private (REPORTS_READ)
 */
router.get(
  "/:reportId/export",
  requirePermissions(PermissionCode.REPORTS_READ),
  PDFController.getExportInfo
);

/**
 * @route GET /reports/:reportId/export/pdf
 * @desc Exporter un rapport en PDF
 * @access Private (REPORTS_READ)
 * @query {string} watermark - Inclure le watermark (true/false)
 */
router.get(
  "/:reportId/export/pdf",
  requirePermissions(PermissionCode.REPORTS_READ),
  PDFController.exportPDF
);

export default router;
