import { transport } from "pino";

export function createPrettyTransport() {
  return transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
      ignore: "pid,hostname",
    },
  });
}