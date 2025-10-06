/**
 * Contrôleur pour la gestion des paramètres système
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { SettingsService } from "./settings.service";
import { logger } from "@/config/logger";

// Schéma de validation pour la mise à jour des paramètres
const updateSettingsSchema = z.object({
  serviceName: z.string().min(1).max(100).optional(),
  serviceFullName: z.string().min(1).max(200).nullable().optional(),
  serviceAddress: z.string().min(1).max(500).nullable().optional(),
  serviceCity: z.string().min(1).max(100).nullable().optional(),
  servicePostalCode: z.string().min(1).max(20).nullable().optional(),
  serviceCountry: z.string().min(1).max(100).nullable().optional(),
  phoneNumber: z.string().min(1).max(50).nullable().optional(),
  faxNumber: z.string().min(1).max(50).nullable().optional(),
  emailContact: z.string().email().nullable().optional(),
  websiteUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

export class SettingsController {
  /**
   * GET /api/settings
   * Récupérer les paramètres système
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json(settings);
    } catch (error) {
      logger.error({ err: error }, "Erreur récupération paramètres");
      next(error);
    }
  }

  /**
   * PUT /api/settings
   * Mettre à jour les paramètres système
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      // Valider les données
      const data = updateSettingsSchema.parse(req.body);

      // Mettre à jour
      const updated = await SettingsService.updateSettings(data);

      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Données invalides",
          errors: error.issues,
        });
      }
      logger.error({ err: error }, "Erreur mise à jour paramètres");
      next(error);
    }
  }

  /**
   * POST /api/settings/logo
   * Upload du logo
   */
  static async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier uploadé" });
      }

      // L'URL sera relative au serveur backend
      const logoUrl = `/uploads/logos/${req.file.filename}`;

      const updated = await SettingsService.updateLogo(logoUrl);

      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Erreur upload logo");
      next(error);
    }
  }

  /**
   * DELETE /api/settings/logo
   * Supprimer le logo
   */
  static async removeLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await SettingsService.removeLogo();
      res.json(updated);
    } catch (error) {
      logger.error({ err: error }, "Erreur suppression logo");
      next(error);
    }
  }
}
