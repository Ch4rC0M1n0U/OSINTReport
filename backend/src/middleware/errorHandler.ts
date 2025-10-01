import { NextFunction, Request, Response } from "express";
import createError, { isHttpError } from "http-errors";
import { logger } from "@config/logger";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (res.headersSent) {
    return;
  }

  let httpError: createError.HttpError;

  if (isHttpError(err)) {
    httpError = err;
  } else if (err instanceof Error) {
    httpError = createError(500, err.message, { cause: err });
  } else if (typeof err === "string") {
    httpError = createError(500, err);
  } else {
    httpError = createError(500, "Une erreur interne est survenue");
  }

  const status = httpError.status ?? 500;
  const message = status >= 500 ? "Une erreur interne est survenue" : httpError.message;

  logger.error({ err: httpError, status }, "Unhandled error");

  res.status(status).json({
    status,
    message,
  });
}
