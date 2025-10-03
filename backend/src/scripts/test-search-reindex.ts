/**
 * Script pour tester la réindexation Meilisearch
 */
import { SearchService } from "@/modules/search/search.service";
import { logger } from "@/config/logger";
import { prisma } from "@/config/prisma";

async function main() {
  try {
    logger.info("🔄 Démarrage de la réindexation...");

    // Initialiser les indexes
    await SearchService.initializeIndexes();
    logger.info("✅ Index initialisé");

    // Compter les rapports
    const reportCount = await prisma.report.count();
    logger.info(`📊 Nombre de rapports dans la base: ${reportCount}`);

    // Réindexer
    const indexed = await SearchService.reindexAll();
    logger.info(`✅ ${indexed} rapports indexés avec succès`);

    // Vérifier les stats
    const stats = await SearchService.getStats();
    logger.info("📊 Statistiques de l'index:", stats);

    // Test de recherche
    if (reportCount > 0) {
      const results = await SearchService.search("", { limit: 5 });
      logger.info(`🔍 Test recherche vide: ${results.hits.length} résultats`);
    }

    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "❌ Erreur lors de la réindexation");
    process.exit(1);
  }
}

void main();
