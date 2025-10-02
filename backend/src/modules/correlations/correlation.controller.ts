import { RequestHandler } from 'express';
import { correlationService } from './correlation.service';
import {
  correlationCheckSchema,
  createCorrelationSchema,
  verifyCorrelationSchema,
  getCorrelationsQuerySchema,
} from './correlation.validation';
import { CorrelationType } from './correlation.types';

/**
 * Contrôleur pour la gestion des corrélations entre rapports
 */

/**
 * Vérifie s'il existe des corrélations pour une valeur donnée
 */
export const checkCorrelation: RequestHandler = async (req, res, next) => {
  try {
    const validation = correlationCheckSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Données de vérification invalides',
        errors: validation.error.errors,
      });
      return;
    }

    const { reportId, value, type } = validation.data;

    const matches = await correlationService.checkCorrelation(
      reportId,
      value,
      type as CorrelationType
    );

    res.json({
      success: true,
      data: {
        found: matches.length > 0,
        matches,
        totalMatches: matches.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Détecte automatiquement toutes les corrélations pour un rapport
 */
export const detectReportCorrelations: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: 'ID de rapport requis',
      });
      return;
    }

    await correlationService.detectCorrelations(reportId);

    res.json({
      success: true,
      message: 'Détection des corrélations lancée avec succès',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les corrélations d'un rapport
 */
export const getReportCorrelations: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      res.status(400).json({
        success: false,
        message: 'ID de rapport requis',
      });
      return;
    }

    const queryValidation = getCorrelationsQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({
        success: false,
        message: 'Paramètres de requête invalides',
        errors: queryValidation.error.issues,
      });
      return;
    }

    const { type, minConfidence, verified } = queryValidation.data;

    const correlations = await correlationService.getReportCorrelations(
      reportId,
      {
        type: type as CorrelationType | undefined,
        minConfidence,
        verified,
      }
    );

    res.json({
      success: true,
      data: correlations,
      meta: {
        total: correlations.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crée une corrélation manuelle
 */
export const createCorrelation: RequestHandler = async (req, res, next) => {
  try {
    const validation = createCorrelationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Données de corrélation invalides',
        errors: validation.error.issues,
      });
      return;
    }

    await correlationService.createCorrelation(validation.data);

    res.status(201).json({
      success: true,
      message: 'Corrélation créée avec succès',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie une corrélation (validation par un enquêteur)
 */
export const verifyCorrelation: RequestHandler = async (req, res, next) => {
  try {
    const { correlationId } = req.params;
    const userId = req.user?.id;

    if (!correlationId) {
      res.status(400).json({
        success: false,
        message: 'ID de corrélation requis',
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
      });
      return;
    }

    const validation = verifyCorrelationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Données de vérification invalides',
        errors: validation.error.issues,
      });
      return;
    }

    const { notes } = validation.data;

    const updated = await correlationService.verifyCorrelation(
      correlationId,
      userId,
      notes
    );

    res.json({
      success: true,
      message: 'Corrélation vérifiée avec succès',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprime une corrélation
 */
export const deleteCorrelation: RequestHandler = async (req, res, next) => {
  try {
    const { correlationId } = req.params;

    if (!correlationId) {
      res.status(400).json({
        success: false,
        message: 'ID de corrélation requis',
      });
      return;
    }

    await correlationService.deleteCorrelation(correlationId);

    res.json({
      success: true,
      message: 'Corrélation supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
};
