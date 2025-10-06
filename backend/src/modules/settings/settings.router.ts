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

export default router;
