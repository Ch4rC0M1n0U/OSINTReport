import { Router } from "express";
import { requireAuth } from "../../middleware/authenticate";
import { AuditController } from "./audit.controller";

const router = Router();

// Toutes les routes nécessitent une authentification et les permissions système
router.use(requireAuth);

/**
 * GET /api/audit-logs
 * Récupérer les logs d'audit avec filtres et pagination
 */
router.get("/", AuditController.getLogs);

/**
 * GET /api/audit-logs/stats
 * Récupérer les statistiques des logs
 */
router.get("/stats", AuditController.getStats);

/**
 * GET /api/audit-logs/actions
 * Récupérer la liste des actions disponibles
 */
router.get("/actions", AuditController.getActions);

/**
 * GET /api/audit-logs/resources
 * Récupérer la liste des ressources disponibles
 */
router.get("/resources", AuditController.getResources);

export default router;
