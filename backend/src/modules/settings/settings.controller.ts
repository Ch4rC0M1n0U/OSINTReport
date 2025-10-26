/**
 * Contrôleur pour la gestion des paramètres système
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { SettingsService } from "./settings.service";
import { ApiKeyEncryption } from "./api-key-encryption";
import { TeamsNotificationService } from "@modules/notifications/teams.service";
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
  // Paramètres d'administration
  maintenanceEnabled: z.boolean().optional(),
  maintenanceMessage: z.string().max(500).or(z.literal('')).nullable().optional(),
  maintenanceScheduledAt: z.string().datetime().or(z.literal('')).nullable().optional(),
  lockUserCreation: z.boolean().optional(),
  // Notifications
  criticalAlertsEnabled: z.boolean().optional(),
  teamsWebhookUrl: z.string().url().or(z.literal('')).nullable().optional(),
  teamsNotificationsEnabled: z.boolean().optional(),
});

// Schéma de validation pour les paramètres IA
const updateAISettingsSchema = z.object({
  geminiApiKey: z.string().min(10).nullable().optional(),
  openaiApiKey: z.string().min(10).nullable().optional(),
  claudeApiKey: z.string().min(10).nullable().optional(),
  aiProvider: z.enum(['gemini', 'openai', 'claude']).optional(),
  aiModel: z.string().min(1).optional(),
  aiEnabled: z.boolean().optional(),
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
   * GET /api/settings/maintenance-status
   * Récupérer le statut du mode maintenance (public)
   */
  static async getMaintenanceStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getSettings();
      res.json({
        maintenanceEnabled: settings.maintenanceEnabled || false,
        maintenanceMessage: settings.maintenanceMessage,
        maintenanceScheduledAt: settings.maintenanceScheduledAt,
        lockUserCreation: settings.lockUserCreation || false,
      });
    } catch (error) {
      logger.error({ err: error }, "Erreur récupération statut maintenance");
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
      const validatedData = updateSettingsSchema.parse(req.body);

      // Nettoyer les chaînes vides et convertir les dates
      const data: any = { ...validatedData };
      
      // Convertir maintenanceScheduledAt en Date si présent et non vide
      if (validatedData.maintenanceScheduledAt && validatedData.maintenanceScheduledAt !== '') {
        data.maintenanceScheduledAt = new Date(validatedData.maintenanceScheduledAt);
      } else {
        data.maintenanceScheduledAt = null;
      }

      // Convertir les chaînes vides en null pour les champs optionnels
      if (validatedData.maintenanceMessage === '') {
        data.maintenanceMessage = null;
      }
      if (validatedData.teamsWebhookUrl === '') {
        data.teamsWebhookUrl = null;
      }

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

  /**
   * PUT /api/settings/ai
   * Met à jour les paramètres IA
   */
  static async updateAISettings(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = updateAISettingsSchema.parse(req.body);
      const settings = await SettingsService.updateAISettings(validatedData);
      
      res.status(200).json({
        success: true,
        data: {
          aiEnabled: settings.aiEnabled,
          aiProvider: settings.aiProvider,
          aiModel: settings.aiModel,
          hasGeminiKey: !!settings.geminiApiKey,
          hasOpenAIKey: !!settings.openaiApiKey,
          hasClaudeKey: !!settings.claudeApiKey,
        }
      });
    } catch (error) {
      logger.error({ err: error }, "Erreur mise à jour paramètres IA");
      next(error);
    }
  }

  /**
   * GET /api/settings/ai/status
   * Récupère le statut de l'IA
   */
  static async getAIStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const isEnabled = await SettingsService.isAIEnabled();
      const settings = await SettingsService.getSettings();
      
      res.status(200).json({
        success: true,
        data: {
          aiEnabled: isEnabled,
          aiProvider: settings.aiProvider,
          aiModel: settings.aiModel,
          hasGeminiKey: !!settings.geminiApiKey,
          hasOpenAIKey: !!settings.openaiApiKey,
          hasClaudeKey: !!settings.claudeApiKey,
        }
      });
    } catch (error) {
      logger.error({ err: error }, "Erreur récupération statut IA");
      next(error);
    }
  }

  /**
   * POST /api/settings/ai/test
   * Teste la connexion à l'API IA
   */
  static async testAIConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const { provider } = req.body;
      
      if (!provider || !['gemini', 'openai', 'claude'].includes(provider)) {
        return res.status(400).json({
          success: false,
          message: 'Provider invalide. Utilisez "gemini", "openai" ou "claude".'
        });
      }

      const apiKey = await SettingsService.getDecryptedApiKey(provider);
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: `Clé API ${provider} non configurée`
        });
      }

      // Test de validation de la clé (pas de vrai appel API pour le moment)
      let isValid = false;

      if (provider === 'gemini') {
        isValid = ApiKeyEncryption.validateGeminiKey(apiKey);
      } else if (provider === 'openai') {
        isValid = ApiKeyEncryption.validateOpenAIKey(apiKey);
      } else if (provider === 'claude') {
        isValid = ApiKeyEncryption.validateClaudeKey(apiKey);
      }

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Format de clé API invalide'
        });
      }

      res.status(200).json({
        success: true,
        message: `Clé API ${provider} valide`
      });
    } catch (error) {
      logger.error({ err: error }, "Erreur test connexion IA");
      next(error);
    }
  }

  /**
   * POST /api/settings/teams/test
   * Teste le webhook Microsoft Teams
   */
  static async testTeamsWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const { webhookUrl } = req.body;

      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          message: "URL du webhook Teams requise",
        });
      }

      // Valider que c'est une URL
      try {
        new URL(webhookUrl);
      } catch {
        return res.status(400).json({
          success: false,
          message: "URL invalide",
        });
      }

      // Tester le webhook
      const success = await TeamsNotificationService.testWebhook(webhookUrl);

      if (success) {
        res.status(200).json({
          success: true,
          message: "Notification de test envoyée avec succès à Microsoft Teams",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Échec de l'envoi de la notification de test",
        });
      }
    } catch (error) {
      logger.error({ err: error }, "Erreur test webhook Teams");
      next(error);
    }
  }
}
