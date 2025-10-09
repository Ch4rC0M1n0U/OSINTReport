/**
 * Contrôleur pour les fonctionnalités IA
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GeminiService } from './gemini.service';
import { ClaudeService } from './claude.service';
import { SettingsService } from '@/modules/settings/settings.service';
import { logger } from '@/config/logger';

// Type pour les services IA disponibles
type AIService = typeof GeminiService | typeof ClaudeService;

/**
 * Obtient le service IA approprié en fonction de la configuration
 */
async function getAIService(): Promise<AIService> {
  const settings = await SettingsService.getSettings();
  
  switch (settings.aiProvider) {
    case 'claude':
      return ClaudeService;
    case 'openai':
      // TODO: Implémenter OpenAIService
      throw new Error('OpenAI n\'est pas encore implémenté');
    case 'gemini':
    default:
      return GeminiService;
  }
}

// Schéma de validation pour la génération de résumé
const generateSummarySchema = z.object({
  reportTitle: z.string().optional(),
  reportType: z.string().optional(),
  classification: z.string().optional(),
  legalBasis: z.string().optional(),
  existingContent: z.string().optional(),
  additionalContext: z.string().optional(),
});

// Schéma de validation pour la génération de texte de module
const generateModuleTextSchema = z.object({
  reportTitle: z.string().optional(),
  moduleType: z.string().min(1, 'Le type de module est requis'),
  moduleName: z.string().optional(),
  entityData: z.record(z.string(), z.any()).optional(),
  existingContent: z.string().optional(),
  additionalContext: z.string().optional(),
});

// Schéma de validation pour l'analyse d'entité
const generateEntityAnalysisSchema = z.object({
  entityData: z.record(z.string(), z.any()).optional(),
  existingContent: z.string().optional(),
  additionalContext: z.string().optional(),
});

export class AIController {
  /**
   * POST /api/ai/generate/summary
   * Génère un résumé de rapport
   */
  static async generateSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const aiService = await getAIService();

      // Vérifier si l'IA est disponible
      const isAvailable = await aiService.isAvailable();
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Service IA non disponible. Vérifiez la configuration.',
        });
      }

      const validatedData = generateSummarySchema.parse(req.body);

      const result = await aiService.generateReportSummary(validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.issues,
        });
      }
      logger.error({ err: error }, 'Erreur génération résumé');
      next(error);
    }
  }

  /**
   * POST /api/ai/generate/module
   * Génère du texte pour un module de rapport
   */
  static async generateModuleText(req: Request, res: Response, next: NextFunction) {
    try {
      const aiService = await getAIService();

      // Vérifier si l'IA est disponible
      const isAvailable = await aiService.isAvailable();
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Service IA non disponible. Vérifiez la configuration.',
        });
      }

      const validatedData = generateModuleTextSchema.parse(req.body);

      const result = await aiService.generateModuleText(validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.issues,
        });
      }
      logger.error({ err: error }, 'Erreur génération texte module');
      next(error);
    }
  }

  /**
   * POST /api/ai/generate/entity-analysis
   * Génère une analyse d'entité
   */
  static async generateEntityAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const aiService = await getAIService();

      // Vérifier si l'IA est disponible
      const isAvailable = await aiService.isAvailable();
      if (!isAvailable) {
        return res.status(503).json({
          success: false,
          message: 'Service IA non disponible. Vérifiez la configuration.',
        });
      }

      const validatedData = generateEntityAnalysisSchema.parse(req.body);

      const result = await aiService.generateEntityAnalysis(validatedData);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: error.issues,
        });
      }
      logger.error({ err: error }, 'Erreur génération analyse entité');
      next(error);
    }
  }

  /**
   * GET /api/ai/status
   * Vérifie si l'IA est disponible
   */
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const aiService = await getAIService();
      const isAvailable = await aiService.isAvailable();
      const settings = await SettingsService.getSettings();

      res.status(200).json({
        success: true,
        data: {
          available: isAvailable,
          provider: settings.aiProvider,
          model: settings.aiModel,
        },
      });
    } catch (error) {
      logger.error({ err: error }, 'Erreur vérification statut IA');
      next(error);
    }
  }

  /**
   * POST /api/ai/test
   * Teste la connexion à l'API IA
   */
  static async testConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const aiService = await getAIService();
      const result = await aiService.testConnection();

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.message,
        model: result.model,
      });
    } catch (error) {
      logger.error({ err: error }, 'Erreur test connexion IA');
      next(error);
    }
  }
}
