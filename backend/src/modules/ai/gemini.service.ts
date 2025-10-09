/**
 * Service d'intégration avec l'API Google Gemini
 * pour la génération de texte dans les rapports OSINT
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SettingsService } from '@/modules/settings/settings.service';
import { logger } from '@/config/logger';
import { DataSanitizerService, PersonalData } from './data-sanitizer.service';

export interface ReportGenerationContext {
  reportTitle?: string;
  reportType?: string;
  classification?: string;
  legalBasis?: string;
  existingContent?: string;
  moduleType?: string;
  moduleName?: string;
  entityData?: Record<string, any>;
  additionalContext?: string;
  // Données personnelles à anonymiser avant envoi à l'API
  personalData?: PersonalData;
}

export interface GeneratedText {
  content: string;
  model: string;
  tokensUsed?: number;
  generatedAt: Date;
}

export class GeminiService {
  private static cachedClient: GoogleGenerativeAI | null = null;
  private static cachedApiKey: string | null = null;

  /**
   * Obtient une instance du client Gemini
   */
  private static async getClient(): Promise<GoogleGenerativeAI> {
    const apiKey = await SettingsService.getDecryptedApiKey('gemini');

    if (!apiKey) {
      throw new Error('Clé API Gemini non configurée');
    }

    // Utiliser le cache si la clé n'a pas changé
    if (this.cachedClient && this.cachedApiKey === apiKey) {
      return this.cachedClient;
    }

    this.cachedClient = new GoogleGenerativeAI(apiKey);
    this.cachedApiKey = apiKey;

    return this.cachedClient;
  }

  /**
   * Obtient le modèle configuré
   */
  private static async getModel(): Promise<GenerativeModel> {
    const client = await this.getClient();
    const settings = await SettingsService.getSettings();
    
    const modelName = settings.aiModel || 'gemini-1.5-flash';
    
    return client.getGenerativeModel({ model: modelName });
  }

  /**
   * Vérifie si l'IA est activée et configurée
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const isEnabled = await SettingsService.isAIEnabled();
      const settings = await SettingsService.getSettings();
      const hasKey = !!settings.geminiApiKey;
      const isGeminiProvider = settings.aiProvider === 'gemini';

      return isEnabled && hasKey && isGeminiProvider;
    } catch (error) {
      logger.error({ err: error }, 'Erreur vérification disponibilité Gemini');
      return false;
    }
  }

  /**
   * Génère un résumé de rapport OSINT
   */
  static async generateReportSummary(context: ReportGenerationContext): Promise<GeneratedText> {
    const model = await this.getModel();

    // Anonymiser le contexte avant envoi à l'API
    const personalData = context.personalData || {};
    const { sanitized: sanitizedContext, map } = DataSanitizerService.sanitizeContext(context, personalData);

    // Vérifier la sanitization
    const promptToSend = this.buildReportSummaryPrompt(sanitizedContext);
    const validation = DataSanitizerService.validateSanitization(promptToSend, personalData);
    
    if (!validation.isClean) {
      logger.warn({ foundData: validation.foundData }, 'Données personnelles détectées dans le prompt');
    }

    try {
      const result = await model.generateContent(promptToSend);
      const response = result.response;
      const text = response.text();

      // Restaurer les données personnelles dans la réponse
      const desanitizedText = DataSanitizerService.desanitizeText(text, map);

      logger.info({ anonymizedFields: Object.keys(map).length }, 'Génération de résumé de rapport réussie');

      return {
        content: desanitizedText,
        model: model.model,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error }, 'Erreur génération résumé de rapport');
      throw new Error('Impossible de générer le résumé du rapport');
    }
  }

  /**
   * Génère du texte pour un module spécifique d'un rapport
   */
  static async generateModuleText(context: ReportGenerationContext): Promise<GeneratedText> {
    const model = await this.getModel();

    // Anonymiser le contexte avant envoi à l'API
    const personalData = context.personalData || {};
    const { sanitized: sanitizedContext, map } = DataSanitizerService.sanitizeContext(context, personalData);

    const promptToSend = this.buildModuleTextPrompt(sanitizedContext);

    // Vérifier la sanitization
    const validation = DataSanitizerService.validateSanitization(promptToSend, personalData);
    if (!validation.isClean) {
      logger.warn({ foundData: validation.foundData }, 'Données personnelles détectées dans le prompt');
    }

    try {
      const result = await model.generateContent(promptToSend);
      const response = result.response;
      const text = response.text();

      // Restaurer les données personnelles dans la réponse
      const desanitizedText = DataSanitizerService.desanitizeText(text, map);

      logger.info({ 
        moduleType: context.moduleType,
        anonymizedFields: Object.keys(map).length 
      }, 'Génération de texte de module réussie');

      return {
        content: desanitizedText,
        model: model.model,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error, moduleType: context.moduleType }, 'Erreur génération texte de module');
      throw new Error('Impossible de générer le texte du module');
    }
  }

  /**
   * Génère une analyse d'entité (personne, organisation, lieu, etc.)
   */
  static async generateEntityAnalysis(context: ReportGenerationContext): Promise<GeneratedText> {
    const model = await this.getModel();

    // Anonymiser le contexte avant envoi à l'API
    const personalData = context.personalData || {};
    const { sanitized: sanitizedContext, map } = DataSanitizerService.sanitizeContext(context, personalData);

    const promptToSend = this.buildEntityAnalysisPrompt(sanitizedContext);

    // Vérifier la sanitization
    const validation = DataSanitizerService.validateSanitization(promptToSend, personalData);
    if (!validation.isClean) {
      logger.warn({ foundData: validation.foundData }, 'Données personnelles détectées dans le prompt');
    }

    try {
      const result = await model.generateContent(promptToSend);
      const response = result.response;
      const text = response.text();

      // Restaurer les données personnelles dans la réponse
      const desanitizedText = DataSanitizerService.desanitizeText(text, map);

      logger.info({ anonymizedFields: Object.keys(map).length }, 'Génération d\'analyse d\'entité réussie');

      return {
        content: desanitizedText,
        model: model.model,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error }, 'Erreur génération analyse d\'entité');
      throw new Error('Impossible de générer l\'analyse de l\'entité');
    }
  }

  /**
   * Teste la connexion à l'API Gemini
   */
  static async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const model = await this.getModel();
      
      const result = await model.generateContent('Réponds juste "OK" pour tester la connexion.');
      const response = result.response;
      const text = response.text();

      logger.info({ model: model.model }, 'Test de connexion Gemini réussi');

      return {
        success: true,
        message: 'Connexion à Gemini réussie',
        model: model.model,
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Test de connexion Gemini échoué');

      return {
        success: false,
        message: error?.message || 'Connexion à Gemini échouée',
      };
    }
  }

  /**
   * Construit le prompt pour générer un résumé de rapport
   */
  private static buildReportSummaryPrompt(context: ReportGenerationContext): string {
    return `Tu es un assistant spécialisé dans la rédaction de rapports d'enquête OSINT (Open Source Intelligence) pour les forces de l'ordre.

Contexte du rapport :
- Titre : ${context.reportTitle || 'Non spécifié'}
- Type : ${context.reportType || 'Non spécifié'}
- Classification : ${context.classification || 'Non spécifiée'}
- Base légale : ${context.legalBasis || 'Non spécifiée'}

${context.existingContent ? `Contenu existant :\n${context.existingContent}\n` : ''}
${context.additionalContext ? `Contexte additionnel :\n${context.additionalContext}\n` : ''}

Génère un résumé professionnel et concis de ce rapport d'enquête OSINT. 
Le résumé doit :
- Être rédigé en français professionnel
- Faire entre 150 et 250 mots
- Résumer les points clés de l'enquête
- Mentionner les principales découvertes
- Être objectif et factuel
- Respecter le ton formel d'un rapport officiel

Ne génère que le texte du résumé, sans introduction ni conclusion additionnelle.`;
  }

  /**
   * Construit le prompt pour générer du texte pour un module
   */
  private static buildModuleTextPrompt(context: ReportGenerationContext): string {
    return `Tu es un assistant spécialisé dans la rédaction de rapports d'enquête OSINT pour les forces de l'ordre.

Contexte du rapport :
- Titre du rapport : ${context.reportTitle || 'Non spécifié'}
- Type de module : ${context.moduleType || 'Non spécifié'}
- Nom du module : ${context.moduleName || 'Non spécifié'}

${context.entityData ? `Données de l'entité :\n${JSON.stringify(context.entityData, null, 2)}\n` : ''}
${context.existingContent ? `Contenu existant :\n${context.existingContent}\n` : ''}
${context.additionalContext ? `Contexte additionnel :\n${context.additionalContext}\n` : ''}

Génère un texte professionnel pour ce module du rapport.
Le texte doit :
- Être rédigé en français professionnel
- Faire entre 100 et 200 mots
- Être factuel et objectif
- Présenter les informations de manière claire et structurée
- Respecter le ton formel d'un rapport d'enquête

Ne génère que le texte demandé, sans introduction ni conclusion additionnelle.`;
  }

  /**
   * Construit le prompt pour générer une analyse d'entité
   */
  private static buildEntityAnalysisPrompt(context: ReportGenerationContext): string {
    return `Tu es un analyste OSINT spécialisé dans l'analyse d'entités pour les forces de l'ordre.

${context.entityData ? `Données de l'entité :\n${JSON.stringify(context.entityData, null, 2)}\n` : ''}
${context.existingContent ? `Informations existantes :\n${context.existingContent}\n` : ''}
${context.additionalContext ? `Contexte additionnel :\n${context.additionalContext}\n` : ''}

Génère une analyse professionnelle de cette entité.
L'analyse doit :
- Être rédigée en français professionnel
- Faire entre 150 et 250 mots
- Synthétiser les informations clés
- Identifier les points importants ou inhabituels
- Être factuelle et objective
- Respecter le ton d'un rapport d'enquête officiel

Ne génère que l'analyse, sans introduction ni conclusion additionnelle.`;
  }

  /**
   * Nettoie le cache du client (utile pour les tests ou changements de clé)
   */
  static clearCache(): void {
    this.cachedClient = null;
    this.cachedApiKey = null;
  }
}
