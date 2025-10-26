import { Router } from 'express';

import { requireAuth, requirePermissions } from '@/middleware/authenticate';
import { PermissionCode } from '@modules/auth/auth.constants';
import { ReportController } from '@modules/reports/report.controller';
import { checkMaintenanceMode } from '@middleware/maintenance';

const entityRouter = Router();

entityRouter.use(requireAuth);
entityRouter.use(checkMaintenanceMode);

/**
 * POST /api/entities
 * Créer une nouvelle entité
 */
entityRouter.post(
  '/',
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.createEntity(req, res, next)
);

/**
 * GET /api/entities
 * Lister les entités avec filtres
 * Query params: type, search, limit, offset
 */
entityRouter.get(
  '/',
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.listEntities(req, res, next)
);

/**
 * GET /api/entities/search
 * Rechercher des entités (autocomplétion)
 * Query params: q, type, limit
 */
entityRouter.get(
  '/search',
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.searchEntities(req, res, next)
);

/**
 * GET /api/entities/:entityId
 * Récupérer les détails d'une entité
 */
entityRouter.get(
  '/:entityId',
  requirePermissions(PermissionCode.REPORTS_READ),
  (req, res, next) => ReportController.getEntity(req, res, next)
);

/**
 * PATCH /api/entities/:entityId
 * Mettre à jour une entité
 */
entityRouter.patch(
  '/:entityId',
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.updateEntity(req, res, next)
);

/**
 * DELETE /api/entities/:entityId
 * Supprimer une entité
 */
entityRouter.delete(
  '/:entityId',
  requirePermissions(PermissionCode.REPORTS_WRITE),
  (req, res, next) => ReportController.deleteEntity(req, res, next)
);

export { entityRouter };
