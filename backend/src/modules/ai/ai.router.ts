/**
 * Routes pour les fonctionnalités IA
 */

import { Router } from 'express';
import { requireAuth, requirePermissions } from '@/middleware/authenticate';
import { PermissionCode } from '@/modules/auth/auth.constants';
import { AIController } from './ai.controller';

const router = Router();

/**
 * POST /api/ai/generate/summary
 * Génère un résumé de rapport avec l'IA
 * Requiert : authentification + permission REPORTS_WRITE
 */
router.post(
  '/generate/summary',
  requireAuth,
  requirePermissions(PermissionCode.REPORTS_WRITE),
  AIController.generateSummary
);

/**
 * POST /api/ai/generate/module
 * Génère du texte pour un module de rapport
 * Requiert : authentification + permission REPORTS_WRITE
 */
router.post(
  '/generate/module',
  requireAuth,
  requirePermissions(PermissionCode.REPORTS_WRITE),
  AIController.generateModuleText
);

/**
 * POST /api/ai/generate/entity-analysis
 * Génère une analyse d'entité
 * Requiert : authentification + permission REPORTS_WRITE
 */
router.post(
  '/generate/entity-analysis',
  requireAuth,
  requirePermissions(PermissionCode.REPORTS_WRITE),
  AIController.generateEntityAnalysis
);

/**
 * GET /api/ai/status
 * Vérifie si l'IA est disponible
 * Requiert : authentification
 */
router.get(
  '/status',
  requireAuth,
  AIController.getStatus
);

/**
 * POST /api/ai/test
 * Teste la connexion à l'API IA
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.post(
  '/test',
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  AIController.testConnection
);

export default router;
