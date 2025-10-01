import { app } from "./app";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { prisma } from "@shared/prisma";
import { bootstrapAuth } from "@modules/auth/bootstrap";

async function start() {
  try {
    await prisma.$connect();
  await bootstrapAuth();
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
