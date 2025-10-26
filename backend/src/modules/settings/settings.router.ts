/**
 * Routes pour la gestion des paramètres système
 */

import { Router } from "express";
import multer from "multer";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { requireAuth, requirePermissions } from "@/middleware/authenticate";
import { PermissionCode } from "@/modules/auth/auth.constants";
import { SettingsController } from "./settings.controller";

const router = Router();

// Configuration multer pour l'upload de logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(__dirname, "../../../uploads/logos");
    
    // Créer le dossier s'il n'existe pas
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split(".").pop();
    cb(null, `logo-${uniqueSuffix}.${ext}`);
  },
});

const upload = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les images
    const allowedMimes = ["image/jpeg", "image/png", "image/svg+xml", "image/webp"];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Type de fichier non autorisé. Utilisez JPG, PNG, SVG ou WebP."));
    }
  },
});

/**
 * GET /api/settings
 * Récupérer les paramètres système (public)
 */
router.get("/", SettingsController.getSettings);

/**
 * GET /api/settings/maintenance-status
 * Vérifier le statut du mode maintenance (public)
 */
router.get("/maintenance-status", SettingsController.getMaintenanceStatus);

/**
 * PUT /api/settings
 * Mettre à jour les paramètres système
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.put(
  "/",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  SettingsController.updateSettings
);

/**
 * POST /api/settings/logo
 * Upload du logo
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.post(
  "/logo",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  upload.single("logo"),
  SettingsController.uploadLogo
);

/**
 * DELETE /api/settings/logo
 * Supprimer le logo
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.delete(
  "/logo",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  SettingsController.removeLogo
);

/**
 * PUT /api/settings/ai
 * Mettre à jour les paramètres IA
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.put(
  "/ai",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  SettingsController.updateAISettings
);

/**
 * GET /api/settings/ai/status
 * Récupérer le statut de l'IA
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.get(
  "/ai/status",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  SettingsController.getAIStatus
);

/**
 * POST /api/settings/ai/test
 * Tester la connexion à l'API IA
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.post(
  "/ai/test",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  SettingsController.testAIConnection
);

/**
 * POST /api/settings/teams/test
 * Tester le webhook Microsoft Teams
 * Requiert : authentification + permission SYSTEM_SETTINGS
 */
router.post(
  "/teams/test",
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  SettingsController.testTeamsWebhook
);

export default router;
