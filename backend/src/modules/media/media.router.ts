import { Router } from 'express';
import multer = require('multer');
import { requireAuth } from '../../middleware/authenticate';
import * as mediaController from './media.controller';
import * as crypto from 'crypto';
import * as path from 'path';

const router = Router();

// Configuration Multer pour l'upload
const storage = multer.diskStorage({
  destination: './uploads/screenshots/temp',
  filename: (req, file, callback) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    callback(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, callback) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return callback(
        new Error('Format non supporté. Utilisez PNG, JPG ou WebP.')
      );
    }
    callback(null, true);
  },
});

// Toutes les routes nécessitent une authentification
router.use(requireAuth);

/**
 * POST /api/media/upload
 * Upload d'une capture d'écran avec traitement sécurisé
 */
router.post('/upload', upload.single('file'), mediaController.uploadScreenshot);

/**
 * GET /api/media/screenshot/:filename
 * Récupération d'un screenshot via URL signée
 */
router.get('/screenshot/:filename', mediaController.getScreenshot);

/**
 * GET /api/media/screenshots/list
 * Liste des screenshots de l'utilisateur
 */
router.get('/screenshots/list', mediaController.listScreenshots);

/**
 * DELETE /api/media/screenshot/:filename
 * Suppression d'un screenshot
 */
router.delete('/screenshot/:filename', mediaController.deleteScreenshot);

export { router as mediaRouter };
