import { app } from "./app";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { prisma } from "@shared/prisma";
import { bootstrapAuth } from "@modules/auth/bootstrap";
import { SearchService } from "@modules/search/search.service";

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
