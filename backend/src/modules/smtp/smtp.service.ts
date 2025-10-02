import createError from "http-errors";
import { prisma } from "@shared/prisma";
import { EmailService } from "@modules/email/email.service";
import { SmtpConfigInput } from "./smtp.validation";

export class SmtpService {
  /**
   * Récupère la configuration SMTP active
   */
  static async getActiveConfig() {
    const config = await prisma.smtpConfig.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!config) {
      return null;
    }

    // Ne pas retourner le mot de passe
    const { password, ...safeConfig } = config;
    return safeConfig;
  }

  /**
   * Récupère toutes les configurations SMTP
   */
  static async getAllConfigs() {
    const configs = await prisma.smtpConfig.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Ne pas retourner les mots de passe
    return configs.map(({ password, ...config }) => config);
  }

  /**
   * Crée une nouvelle configuration SMTP
   */
  static async createConfig(input: SmtpConfigInput) {
    // Si cette configuration doit être active, désactiver les autres
    if (input.active) {
      await prisma.smtpConfig.updateMany({
        where: { active: true },
        data: { active: false },
      });
    }

    const config = await prisma.smtpConfig.create({
      data: input,
    });

    const { password, ...safeConfig } = config;
    return safeConfig;
  }

  /**
   * Met à jour une configuration SMTP
   */
  static async updateConfig(id: string, input: Partial<SmtpConfigInput>) {
    const existing = await prisma.smtpConfig.findUnique({ where: { id } });

    if (!existing) {
      throw createError(404, "Configuration SMTP introuvable");
    }

    // Si cette configuration doit être active, désactiver les autres
    if (input.active === true) {
      await prisma.smtpConfig.updateMany({
        where: { active: true, id: { not: id } },
        data: { active: false },
      });
    }

    const config = await prisma.smtpConfig.update({
      where: { id },
      data: input,
    });

    const { password, ...safeConfig } = config;
    return safeConfig;
  }

  /**
   * Supprime une configuration SMTP
   */
  static async deleteConfig(id: string) {
    const existing = await prisma.smtpConfig.findUnique({ where: { id } });

    if (!existing) {
      throw createError(404, "Configuration SMTP introuvable");
    }

    await prisma.smtpConfig.delete({ where: { id } });
  }

  /**
   * Teste une configuration SMTP
   */
  static async testConnection(config: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const isValid = await EmailService.testSmtpConnection(config);

      if (isValid) {
        return {
          success: true,
          message: "Connexion SMTP réussie",
        };
      } else {
        return {
          success: false,
          message: "Échec de la connexion SMTP",
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Active une configuration SMTP spécifique
   */
  static async activateConfig(id: string) {
    const existing = await prisma.smtpConfig.findUnique({ where: { id } });

    if (!existing) {
      throw createError(404, "Configuration SMTP introuvable");
    }

    // Désactiver toutes les autres configurations
    await prisma.smtpConfig.updateMany({
      where: { active: true },
      data: { active: false },
    });

    // Activer celle-ci
    const config = await prisma.smtpConfig.update({
      where: { id },
      data: { active: true },
    });

    const { password, ...safeConfig } = config;
    return safeConfig;
  }
}
