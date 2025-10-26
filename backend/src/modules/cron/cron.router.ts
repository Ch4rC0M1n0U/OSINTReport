import { Router } from 'express';
import { requireAuth, requirePermissions } from '@middleware/authenticate';
import { PermissionCode } from '@modules/auth/auth.constants';
import { manuallyRegenerateUrls } from './screenshot-url.cron';
import { checkMaintenanceMode } from '@middleware/maintenance';

const router = Router();

// Toutes les routes cron nécessitent l'authentification
router.use(requireAuth);
router.use(checkMaintenanceMode);

/**
 * POST /api/cron/screenshot-urls/regenerate
 * Déclenche manuellement la régénération des URLs de screenshots
 * Réservé aux administrateurs système
 */
router.post('/screenshot-urls/regenerate', requireAuth, requirePermissions(PermissionCode.SYSTEM_SETTINGS), async (req, res) => {
  try {

    // Lancer la régénération en arrière-plan
    res.status(202).json({
      message: 'Régénération des URLs démarrée',
      info: 'Le processus s\'exécute en arrière-plan. Consultez les logs serveur pour le suivi.',
    });

    // Exécuter après avoir envoyé la réponse
    setImmediate(async () => {
      try {
        await manuallyRegenerateUrls();
      } catch (error: any) {
        console.error('❌ [API] Erreur régénération manuelle:', error.message);
      }
    });
  } catch (error: any) {
    console.error('❌ [API] Erreur endpoint régénération:', error.message);
    res.status(500).json({ 
      message: 'Erreur lors du démarrage de la régénération',
      error: error.message,
    });
  }
});

/**
 * GET /api/cron/screenshot-urls/status
 * Obtient des statistiques sur les URLs de screenshots
 * Réservé aux administrateurs système
 */
router.get('/screenshot-urls/status', requireAuth, requirePermissions(PermissionCode.SYSTEM_SETTINGS), async (req, res) => {
  try {

    res.json({
      service: 'Screenshot URL Regeneration CRON',
      schedule: 'Tous les jours à 03:00 (Europe/Brussels)',
      regenerationThreshold: '30 jours avant expiration',
      newExpirationDuration: '180 jours (6 mois)',
      status: 'active',
      lastManualRun: 'N/A', // Peut être ajouté plus tard avec un système de tracking
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération du status',
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
