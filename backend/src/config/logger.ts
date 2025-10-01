import pino from "pino";
import { env, isDev } from "@config/env";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      }
    : undefined,
  base: {
    env: env.NODE_ENV,
    service: "osintreport-backend",
  },
});
