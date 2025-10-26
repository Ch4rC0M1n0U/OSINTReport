/**
 * Middleware de mode maintenance
 * Bloque l'accès au site pour les utilisateurs non-administrateurs
 * lorsque le mode maintenance est activé
 * 
 * IMPORTANT: Ce middleware doit être appliqué APRÈS l'authentification
 * pour que req.user soit disponible
 */

import { Request, Response, NextFunction } from "express";
import { SettingsService } from "@modules/settings/settings.service";
import { logger } from "@/config/logger";

/**
 * Middleware pour vérifier le mode maintenance
 * Les administrateurs peuvent toujours accéder au site
 * Ce middleware suppose que req.user est déjà défini (après authentification)
 */
export async function checkMaintenanceMode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Récupérer les paramètres système
    const settings = await SettingsService.getSettings();

    // Si le mode maintenance n'est pas activé, continuer
    if (!settings.maintenanceEnabled) {
      next();
      return;
    }

    // Vérifier si l'utilisateur est un administrateur
    // Si req.user n'existe pas, c'est que l'utilisateur n'est pas authentifié
    const isAdmin = req.user?.roleName === "admin";

    if (isAdmin) {
      // Les administrateurs peuvent accéder même en mode maintenance
      logger.debug(
        { userId: req.user?.id, path: req.path },
        "Admin accède au site en mode maintenance"
      );
      next();
      return;
    }

    // Pour les non-administrateurs (ou non authentifiés), bloquer l'accès
    logger.info(
      { 
        userId: req.user?.id, 
        path: req.path,
        maintenanceScheduledAt: settings.maintenanceScheduledAt 
      },
      "Accès bloqué - Mode maintenance activé"
    );

    res.status(503).json({
      message: settings.maintenanceMessage || 
        "Le site est actuellement en maintenance. Veuillez réessayer plus tard.",
      maintenanceScheduledAt: settings.maintenanceScheduledAt,
    });
  } catch (error) {
    logger.error({ error }, "Erreur dans le middleware de maintenance");
    // En cas d'erreur, laisser passer pour éviter de bloquer le site
    next();
  }
}
