import { Router } from "express";
import { SearchController } from "./search.controller";
import { requireAuth } from "@/middleware/authenticate";
import { requirePermissions } from "@/middleware/authenticate";
import { PermissionCode } from "@/modules/auth/auth.constants";

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(requireAuth);

/**
 * @route GET /search
 * @desc Rechercher des rapports
 * @access Private (REPORTS_READ)
 */
router.get(
  "/",
  requirePermissions(PermissionCode.REPORTS_READ),
  SearchController.search
);

/**
 * @route GET /search/facets
 * @desc Obtenir les facettes (compteurs par filtre)
 * @access Private (REPORTS_READ)
 */
router.get(
  "/facets",
  requirePermissions(PermissionCode.REPORTS_READ),
  SearchController.getFacets
);

/**
 * @route POST /search/reindex
 * @desc Réindexer tous les rapports
 * @access Private (ADMIN)
 */
router.post(
  "/reindex",
  requirePermissions(PermissionCode.ADMIN),
  SearchController.reindex
);

/**
 * @route GET /search/stats
 * @desc Obtenir les statistiques de l'index
 * @access Private (ADMIN)
 */
router.get(
  "/stats",
  requirePermissions(PermissionCode.ADMIN),
  SearchController.getStats
);

export default router;
