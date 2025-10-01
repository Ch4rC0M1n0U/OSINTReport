import { PrismaClient } from "@prisma/client";
import { logger } from "@config/logger";

export const prisma = new PrismaClient({
  log: [
    { level: "query", emit: "event" },
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

type PrismaLogEvent = {
  timestamp: Date;
  target: string;
  message: string;
};

type PrismaQueryEvent = {
  timestamp: Date;
  query: string;
  params: string;
  duration: number;
  target: string;
};

prisma.$on("warn", (event: PrismaLogEvent) => {
  logger.warn({ target: event.target, message: event.message }, "Prisma warning");
});

prisma.$on("error", (event: PrismaLogEvent) => {
  logger.error({ target: event.target, message: event.message }, "Prisma error");
});

if (process.env.NODE_ENV === "development") {
  prisma.$on("query", (event: PrismaQueryEvent) => {
    logger.debug(
      {
        query: event.query,
        params: event.params,
        duration: event.duration,
      },
      "Prisma query"
    );
  });
}
