import { Request, Response, NextFunction } from "express";
import { PDFService } from "./pdf.service";
import { logger } from "@/config/logger";
import { prisma } from "@/config/prisma";

export class PDFController {
  /**
   * Exporter un rapport en PDF
   * GET /api/reports/:reportId/export/pdf
   */
  static async exportPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;
      const { watermark = "true" } = req.query;

      logger.info({ reportId, userId: req.user?.id }, "📄 Demande d'export PDF");
      logger.debug({ reportId, watermark }, "🔍 Paramètres export PDF");

      // Vérifier que le rapport existe
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          title: true,
          caseNumber: true,
          reportNumber: true,
          ownerId: true,
        },
      });

      if (!report) {
        return res.status(404).json({
          status: 404,
          message: "Rapport introuvable",
        });
      }

      // Vérifier les permissions (optionnel : seulement le propriétaire ou admin)
      // Pour l'instant, on autorise tous les utilisateurs authentifiés avec REPORTS_READ

      // Générer le PDF
      logger.info({ reportId }, "🚀 Lancement génération PDF");
      const pdfBuffer = await PDFService.generatePDF({
        reportId,
        includeWatermark: watermark === "true",
        officerName: req.user
          ? `${req.user.firstName} ${req.user.lastName}`
          : "Anonyme",
        officerRank: req.user?.grade || "Agent",
      });
      logger.info({ reportId, size: pdfBuffer.length }, "✅ PDF généré avec succès");

      // Générer le nom de fichier
      const filename = PDFService.generateFilename({
        caseNumber: report.caseNumber ?? undefined,
        reportNumber: report.reportNumber ?? undefined,
      });

      // Envoyer le PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      logger.info(
        { reportId, filename, size: pdfBuffer.length },
        "✅ PDF exporté avec succès"
      );

      return res.send(pdfBuffer);
    } catch (error) {
      logger.error({ err: error, reportId: req.params.reportId }, "❌ Erreur export PDF");
      
      // Log détaillé de l'erreur
      if (error instanceof Error) {
        logger.error({ 
          message: error.message, 
          stack: error.stack,
          name: error.name 
        }, "❌ Détails erreur");
      }
      
      next(error);
    }
  }

  /**
   * Obtenir les informations d'export disponibles
   * GET /api/reports/:reportId/export
   */
  static async getExportInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId } = req.params;

      const report = await prisma.report.findUnique({
        where: { id: reportId },
        select: {
          id: true,
          title: true,
          caseNumber: true,
          reportNumber: true,
          classification: true,
          status: true,
          _count: {
            select: {
              modules: true,
              correlations: true,
            },
          },
        },
      });

      if (!report) {
        return res.status(404).json({
          status: 404,
          message: "Rapport introuvable",
        });
      }

      return res.json({
        available: true,
        formats: ["pdf"],
        filename: PDFService.generateFilename({
          caseNumber: report.caseNumber ?? undefined,
          reportNumber: report.reportNumber ?? undefined,
        }),
        metadata: {
          classification: report.classification,
          status: report.status,
          modulesCount: report._count.modules,
          correlationsCount: report._count.correlations,
        },
      });
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur récupération infos export");
      next(error);
    }
  }
}
