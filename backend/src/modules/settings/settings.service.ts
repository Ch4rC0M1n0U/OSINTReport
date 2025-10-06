/**
 * Service de gestion des paramètres système
 */

import { prisma } from "@/config/prisma";
import { logger } from "@/config/logger";

export interface SystemSettings {
  id: string;
  serviceName: string;
  serviceFullName?: string | null;
  serviceAddress?: string | null;
  serviceCity?: string | null;
  servicePostalCode?: string | null;
  serviceCountry?: string | null;
  phoneNumber?: string | null;
  faxNumber?: string | null;
  emailContact?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateSettingsData {
  serviceName?: string;
  serviceFullName?: string | null;
  serviceAddress?: string | null;
  serviceCity?: string | null;
  servicePostalCode?: string | null;
  serviceCountry?: string | null;
  phoneNumber?: string | null;
  faxNumber?: string | null;
  emailContact?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export class SettingsService {
  /**
   * Récupérer les paramètres système
   * (crée un enregistrement par défaut si n'existe pas)
   */
  static async getSettings(): Promise<SystemSettings> {
    // Tenter de récupérer le premier enregistrement
    let settings = await prisma.systemSettings.findFirst();

    // Si aucun paramètre n'existe, créer avec les valeurs par défaut
    if (!settings) {
      logger.info("Création des paramètres système par défaut");
      settings = await prisma.systemSettings.create({
        data: {
          serviceName: "OSINT",
          serviceCountry: "Belgique",
          primaryColor: "#003f87",
          secondaryColor: "#0066cc",
        },
      });
    }

    return settings;
  }

  /**
   * Mettre à jour les paramètres système
   */
  static async updateSettings(data: UpdateSettingsData): Promise<SystemSettings> {
    // Récupérer le settings existant (ou le créer)
    const existing = await this.getSettings();

    // Mettre à jour
    const updated = await prisma.systemSettings.update({
      where: { id: existing.id },
      data,
    });

    logger.info({ settingsId: updated.id }, "Paramètres système mis à jour");
    return updated;
  }

  /**
   * Mettre à jour l'URL du logo
   */
  static async updateLogo(logoUrl: string): Promise<SystemSettings> {
    const existing = await this.getSettings();

    const updated = await prisma.systemSettings.update({
      where: { id: existing.id },
      data: { logoUrl },
    });

    logger.info({ logoUrl }, "Logo mis à jour");
    return updated;
  }

  /**
   * Supprimer le logo
   */
  static async removeLogo(): Promise<SystemSettings> {
    const existing = await this.getSettings();

    const updated = await prisma.systemSettings.update({
      where: { id: existing.id },
      data: { logoUrl: null },
    });

    logger.info("Logo supprimé");
    return updated;
  }
}
