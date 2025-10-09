/**
 * Service d'intégration avec l'API Anthropic Claude
 * pour la génération de texte dans les rapports OSINT
 */

import Anthropic from '@anthropic-ai/sdk';
import { SettingsService } from '@/modules/settings/settings.service';
import { logger } from '@/config/logger';
import { ReportGenerationContext, GeneratedText } from './gemini.service';
import { DataSanitizerService } from './data-sanitizer.service';

export class ClaudeService {
  private static cachedClient: Anthropic | null = null;
  private static cachedApiKey: string | null = null;

  /**
   * Obtient une instance du client Claude
   */
  private static async getClient(): Promise<Anthropic> {
    const apiKey = await SettingsService.getDecryptedApiKey('claude');

    if (!apiKey) {
      throw new Error('Clé API Claude non configurée');
    }

    // Utiliser le cache si la clé n'a pas changé
    if (this.cachedClient && this.cachedApiKey === apiKey) {
      return this.cachedClient;
    }

    this.cachedClient = new Anthropic({
      apiKey: apiKey,
    });
    this.cachedApiKey = apiKey;

    return this.cachedClient;
  }

  /**
   * Obtient le modèle configuré
   */
  private static async getModelName(): Promise<string> {
    const settings = await SettingsService.getSettings();
    return settings.aiModel || 'claude-3-5-sonnet-20241022';
  }

  /**
   * Vérifie si l'IA est activée et configurée
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const isEnabled = await SettingsService.isAIEnabled();
      const settings = await SettingsService.getSettings();
      const hasKey = !!settings.claudeApiKey;
      const isClaudeProvider = settings.aiProvider === 'claude';

      return isEnabled && hasKey && isClaudeProvider;
    } catch (error) {
      logger.error({ err: error }, 'Erreur vérification disponibilité Claude');
      return false;
    }
  }

  /**
   * Génère un résumé de rapport OSINT
   */
  static async generateReportSummary(context: ReportGenerationContext): Promise<GeneratedText> {
    const client = await this.getClient();
    const model = await this.getModelName();

    // Anonymiser le contexte avant envoi à l'API
    const personalData = context.personalData || {};
    const { sanitized: sanitizedContext, map } = DataSanitizerService.sanitizeContext(context, personalData);

    const promptToSend = this.buildReportSummaryPrompt(sanitizedContext);

    // Vérifier la sanitization
    const validation = DataSanitizerService.validateSanitization(promptToSend, personalData);
    if (!validation.isClean) {
      logger.warn({ foundData: validation.foundData }, 'Données personnelles détectées dans le prompt');
    }

    try {
      const message = await client.messages.create({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: promptToSend,
          },
        ],
      });

      const textContent = message.content.find(block => block.type === 'text');
      const text = textContent && textContent.type === 'text' ? textContent.text : '';

      // Restaurer les données personnelles dans la réponse
      const desanitizedText = DataSanitizerService.desanitizeText(text, map);

      logger.info({ anonymizedFields: Object.keys(map).length }, 'Génération de résumé de rapport réussie (Claude)');

      return {
        content: desanitizedText,
        model: model,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error }, 'Erreur génération résumé de rapport (Claude)');
      throw new Error('Impossible de générer le résumé du rapport');
    }
  }

  /**
   * Génère du texte pour un module spécifique d'un rapport
   */
  static async generateModuleText(context: ReportGenerationContext): Promise<GeneratedText> {
    const client = await this.getClient();
    const model = await this.getModelName();

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
      const message = await client.messages.create({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: promptToSend,
          },
        ],
      });

      const textContent = message.content.find(block => block.type === 'text');
      const text = textContent && textContent.type === 'text' ? textContent.text : '';

      // Restaurer les données personnelles dans la réponse
      const desanitizedText = DataSanitizerService.desanitizeText(text, map);

      logger.info({ 
        moduleType: context.moduleType,
        anonymizedFields: Object.keys(map).length 
      }, 'Génération de texte de module réussie (Claude)');

      return {
        content: desanitizedText,
        model: model,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error, moduleType: context.moduleType }, 'Erreur génération texte de module (Claude)');
      throw new Error('Impossible de générer le texte du module');
    }
  }

  /**
   * Génère une analyse d'entité (personne, organisation, lieu, etc.)
   */
  static async generateEntityAnalysis(context: ReportGenerationContext): Promise<GeneratedText> {
    const client = await this.getClient();
    const model = await this.getModelName();

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
      const message = await client.messages.create({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: promptToSend,
          },
        ],
      });

      const textContent = message.content.find(block => block.type === 'text');
      const text = textContent && textContent.type === 'text' ? textContent.text : '';

      // Restaurer les données personnelles dans la réponse
      const desanitizedText = DataSanitizerService.desanitizeText(text, map);

      logger.info({ anonymizedFields: Object.keys(map).length }, 'Génération d\'analyse d\'entité réussie (Claude)');

      return {
        content: desanitizedText,
        model: model,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ err: error }, 'Erreur génération analyse d\'entité (Claude)');
      throw new Error('Impossible de générer l\'analyse de l\'entité');
    }
  }

  /**
   * Teste la connexion à l'API Claude
   */
  static async testConnection(): Promise<{ success: boolean; message: string; model?: string }> {
    try {
      const client = await this.getClient();
      const model = await this.getModelName();

      const message = await client.messages.create({
        model: model,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Réponds juste "OK" pour tester la connexion.',
          },
        ],
      });

      logger.info({ model: model }, 'Test de connexion Claude réussi');

      return {
        success: true,
        message: 'Connexion à Claude réussie',
        model: model,
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Test de connexion Claude échoué');

      return {
        success: false,
        message: error?.message || 'Connexion à Claude échouée',
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
