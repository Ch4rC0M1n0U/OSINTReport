import { Router } from 'express';
import { requireAuth } from '@/middleware/authenticate';
import * as correlationController from './correlation.controller';
import { checkMaintenanceMode } from '@middleware/maintenance';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(requireAuth);
router.use(checkMaintenanceMode);

/**
 * POST /api/correlations/check
 * Vérifie s'il existe des corrélations pour une valeur donnée
 */
router.post('/check', correlationController.checkCorrelation);

/**
 * POST /api/correlations/reports/:reportId/detect
 * Détecte automatiquement toutes les corrélations pour un rapport
 */
router.post(
  '/reports/:reportId/detect',
  correlationController.detectReportCorrelations
);

/**
 * GET /api/correlations/reports/:reportId
 * Récupère les corrélations d'un rapport
 * Query params: type, minConfidence, verified
 */
router.get(
  '/reports/:reportId',
  correlationController.getReportCorrelations
);

/**
 * POST /api/correlations
 * Crée une corrélation manuelle entre deux rapports
 */
router.post('/', correlationController.createCorrelation);

/**
 * PATCH /api/correlations/:correlationId/verify
 * Vérifie/valide une corrélation
 */
router.patch(
  '/:correlationId/verify',
  correlationController.verifyCorrelation
);

/**
 * DELETE /api/correlations/:correlationId
 * Supprime une corrélation
 */
router.delete('/:correlationId', correlationController.deleteCorrelation);

export default router;
