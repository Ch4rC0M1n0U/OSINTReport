import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(createError(404, "Ressource introuvable"));
}
