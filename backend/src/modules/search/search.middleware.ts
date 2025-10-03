/**
 * Auto-indexation Meilisearch pour les rapports
 * 
 * Ce module fournit des hooks pour indexer automatiquement
 * les rapports dans Meilisearch après les opérations CRUD.
 * 
 * Note: Les middlewares Prisma ($use) ne sont plus supportés dans Prisma 5+.
 * Cette implémentation utilise des méthodes wrapper à appeler explicitement
 * dans les services ou une extension Prisma client.
 */

import { SearchService } from "./search.service";
import { logger } from "@/config/logger";

/**
 * Hook à appeler après la création d'un rapport
 */
export async function afterReportCreate(reportId: string): Promise<void> {
  try {
    await SearchService.indexReport(reportId);
    logger.info({ reportId }, "Rapport indexé après création");
  } catch (error) {
    logger.error({ err: error, reportId }, "Erreur lors de l'indexation après création");
  }
}

/**
 * Hook à appeler après la mise à jour d'un rapport
 */
export async function afterReportUpdate(reportId: string): Promise<void> {
  try {
    await SearchService.indexReport(reportId);
    logger.info({ reportId }, "Rapport réindexé après mise à jour");
  } catch (error) {
    logger.error({ err: error, reportId }, "Erreur lors de la réindexation après mise à jour");
  }
}

/**
 * Hook à appeler après la suppression d'un rapport
 */
export async function afterReportDelete(reportId: string): Promise<void> {
  try {
    await SearchService.deleteReport(reportId);
    logger.info({ reportId }, "Rapport supprimé de l'index");
  } catch (error) {
    logger.error({ err: error, reportId }, "Erreur lors de la suppression de l'index");
  }
}

/**
 * Hook à appeler après une modification de module (create/update/delete)
 * Réindexe le rapport parent
 */
export async function afterModuleChange(reportId: string): Promise<void> {
  try {
    await SearchService.indexReport(reportId);
    logger.info({ reportId }, "Rapport réindexé après modification de module");
  } catch (error) {
    logger.error(
      { err: error, reportId },
      "Erreur lors de la réindexation après modification de module"
    );
  }
}

/**
 * Documentation d'intégration
 * 
 * Pour activer l'auto-indexation, ajouter les hooks dans report.service.ts :
 * 
 * import { afterReportCreate, afterReportUpdate, afterReportDelete, afterModuleChange } from '../search/search.middleware';
 * 
 * // Après createReport
 * const report = await prisma.report.create(...);
 * await afterReportCreate(report.id);
 * 
 * // Après updateReport
 * await prisma.report.update(...);
 * await afterReportUpdate(reportId);
 * 
 * // Après deleteReport
 * await prisma.report.delete(...);
 * await afterReportDelete(reportId);
 * 
 * // Après createModule/updateModule/deleteModule
 * await afterModuleChange(reportId);
 */
