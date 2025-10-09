/**
 * Service de gestion des paramètres système
 */

import { prisma } from "@/config/prisma";
import { logger } from "@/config/logger";
import { ApiKeyEncryption } from "./api-key-encryption";

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
  // Paramètres IA (les clés sont masquées pour la sécurité)
  aiProvider?: string | null;
  aiModel?: string | null;
  aiEnabled?: boolean;
  geminiApiKey?: string | null; // Version chiffrée en base
  openaiApiKey?: string | null; // Version chiffrée en base
  claudeApiKey?: string | null; // Version chiffrée en base
  geminiApiKeyMasked?: string; // Version masquée pour affichage
  openaiApiKeyMasked?: string; // Version masquée pour affichage
  claudeApiKeyMasked?: string; // Version masquée pour affichage
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

export interface AISettings {
  geminiApiKey?: string | null;
  openaiApiKey?: string | null;
  claudeApiKey?: string | null;
  aiProvider?: string;
  aiModel?: string;
  aiEnabled?: boolean;
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
          aiProvider: "gemini",
          aiModel: "gemini-pro",
          aiEnabled: false,
        },
      });
    }

    // Masquer les clés API pour la sécurité
    const settingsWithMaskedKeys: SystemSettings = {
      ...settings,
      geminiApiKeyMasked: settings.geminiApiKey 
        ? ApiKeyEncryption.mask(settings.geminiApiKey) 
        : undefined,
      openaiApiKeyMasked: settings.openaiApiKey 
        ? ApiKeyEncryption.mask(settings.openaiApiKey) 
        : undefined,
    };

    // Ne jamais renvoyer les clés en clair
    const { geminiApiKey, openaiApiKey, ...settingsWithoutKeys } = settings;

    return {
      ...settingsWithoutKeys,
      geminiApiKeyMasked: settingsWithMaskedKeys.geminiApiKeyMasked,
      openaiApiKeyMasked: settingsWithMaskedKeys.openaiApiKeyMasked,
    };
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

  /**
   * Mettre à jour les paramètres IA
   */
  static async updateAISettings(data: AISettings): Promise<SystemSettings> {
    const existing = await this.getSettingsRaw(); // Utilise la version sans masquage

    const updateData: any = {};

    // Chiffrer et mettre à jour Gemini API Key si fournie
    if (data.geminiApiKey !== undefined) {
      if (data.geminiApiKey === null || data.geminiApiKey === '') {
        updateData.geminiApiKey = null;
        logger.info('Gemini API Key supprimée');
      } else {
        // Valider le format
        if (!ApiKeyEncryption.validateGeminiKey(data.geminiApiKey)) {
          throw new Error('Format de clé Gemini invalide (doit commencer par AIza)');
        }
        updateData.geminiApiKey = ApiKeyEncryption.encrypt(data.geminiApiKey);
        logger.info('Gemini API Key mise à jour (chiffrée)');
      }
    }

    // Chiffrer et mettre à jour OpenAI API Key si fournie
    if (data.openaiApiKey !== undefined) {
      if (data.openaiApiKey === null || data.openaiApiKey === '') {
        updateData.openaiApiKey = null;
        logger.info('OpenAI API Key supprimée');
      } else {
        // Valider le format
        if (!ApiKeyEncryption.validateOpenAIKey(data.openaiApiKey)) {
          throw new Error('Format de clé OpenAI invalide (doit commencer par sk-)');
        }
        updateData.openaiApiKey = ApiKeyEncryption.encrypt(data.openaiApiKey);
        logger.info('OpenAI API Key mise à jour (chiffrée)');
      }
    }

    // Chiffrer et mettre à jour Claude API Key si fournie
    if (data.claudeApiKey !== undefined) {
      if (data.claudeApiKey === null || data.claudeApiKey === '') {
        updateData.claudeApiKey = null;
        logger.info('Claude API Key supprimée');
      } else {
        // Valider le format
        if (!ApiKeyEncryption.validateClaudeKey(data.claudeApiKey)) {
          throw new Error('Format de clé Claude invalide (doit commencer par sk-ant-)');
        }
        updateData.claudeApiKey = ApiKeyEncryption.encrypt(data.claudeApiKey);
        logger.info('Claude API Key mise à jour (chiffrée)');
      }
    }

    // Autres paramètres
    if (data.aiProvider !== undefined) {
      updateData.aiProvider = data.aiProvider;
    }
    if (data.aiModel !== undefined) {
      updateData.aiModel = data.aiModel;
    }
    if (data.aiEnabled !== undefined) {
      updateData.aiEnabled = data.aiEnabled;
    }

    const updated = await prisma.systemSettings.update({
      where: { id: existing.id },
      data: updateData,
    });

    logger.info({ aiProvider: updated.aiProvider, aiEnabled: updated.aiEnabled }, 
      'Paramètres IA mis à jour');

    return this.getSettings(); // Retourne avec les clés masquées
  }

  /**
   * Récupérer la clé API déchiffrée (usage interne uniquement)
   */
  static async getDecryptedApiKey(provider: 'gemini' | 'openai' | 'claude'): Promise<string | null> {
    const settings = await this.getSettingsRaw();

    let encryptedKey: string | null = null;
    
    if (provider === 'gemini') {
      encryptedKey = settings.geminiApiKey;
    } else if (provider === 'openai') {
      encryptedKey = settings.openaiApiKey;
    } else if (provider === 'claude') {
      encryptedKey = settings.claudeApiKey;
    }

    if (!encryptedKey) {
      return null;
    }

    try {
      return ApiKeyEncryption.decrypt(encryptedKey);
    } catch (error) {
      logger.error({ error, provider }, 'Erreur lors du déchiffrement de la clé API');
      throw new Error('Impossible de déchiffrer la clé API');
    }
  }

  /**
   * Vérifier si l'IA est configurée et activée
   */
  static async isAIEnabled(): Promise<boolean> {
    const settings = await this.getSettingsRaw();
    
    if (!settings.aiEnabled) {
      return false;
    }

    // Vérifier qu'au moins une clé API est configurée
    const hasGemini = !!(settings.geminiApiKey && settings.aiProvider === 'gemini');
    const hasOpenAI = !!(settings.openaiApiKey && settings.aiProvider === 'openai');
    const hasClaude = !!(settings.claudeApiKey && settings.aiProvider === 'claude');

    return hasGemini || hasOpenAI || hasClaude;
  }

  /**
   * Récupérer les paramètres bruts (sans masquage) - USAGE INTERNE UNIQUEMENT
   */
  private static async getSettingsRaw() {
    let settings = await prisma.systemSettings.findFirst();

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          serviceName: "OSINT",
          serviceCountry: "Belgique",
          primaryColor: "#003f87",
          secondaryColor: "#0066cc",
          aiProvider: "gemini",
          aiModel: "gemini-pro",
          aiEnabled: false,
        },
      });
    }

    return settings;
  }
}
