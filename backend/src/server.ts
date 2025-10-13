import { app } from "./app";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { prisma } from "@shared/prisma";
import { bootstrapAuth } from "@modules/auth/bootstrap";
import { SearchService } from "@modules/search/search.service";
import { startScreenshotUrlCron } from "@modules/cron/screenshot-url.cron";

async function start() {
  try {
    await prisma.$connect();
    await bootstrapAuth();
    
    // Initialiser Meilisearch
    try {
      await SearchService.initializeIndexes();
    } catch (error) {
      logger.warn({ err: error }, "⚠️  Impossible d'initialiser Meilisearch - la recherche sera indisponible");
    }
    
    // Démarrer le CRON de régénération des URLs de screenshots
    try {
      startScreenshotUrlCron();
      logger.info("✅ CRON de régénération des URLs de screenshots démarré");
    } catch (error) {
      logger.warn({ err: error }, "⚠️  Impossible de démarrer le CRON de régénération des URLs");
    }
    
    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "Backend démarré");
    });

    const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info({ signal }, "Arrêt en cours");
        server.close(async () => {
          await prisma.$disconnect();
          logger.info("Serveur arrêté proprement");
          process.exit(0);
        });
      });
    });
  } catch (error) {
    logger.error({ error }, "Échec du démarrage du serveur");
    process.exit(1);
  }
}

void start();
