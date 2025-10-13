import cron from 'node-cron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateSignedUrl } from '../media/media.service';

/**
 * Service CRON pour régénérer automatiquement les URLs de screenshots
 * qui expirent bientôt, afin de maintenir l'accès permanent aux images
 * dans les rapports archivés.
 */

const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
const REGENERATION_THRESHOLD_DAYS = 30; // Régénérer si expire dans moins de 30 jours
const NEW_EXPIRATION_DAYS = 180; // 6 mois

interface ScreenshotMetadata {
  filename: string;
  originalName: string;
  userId: string;
  caseId: string;
  investigatorName: string;
  size: number;
  width: number;
  height: number;
  format: string;
  uploadedAt: string;
  captureDate?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  lastUrlRegeneration?: number; // Timestamp de la dernière régénération
}

/**
 * Vérifie si un fichier existe
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Trouve tous les screenshots dont l'URL expire dans moins de X jours
 */
async function findExpiringScreenshots(thresholdDays: number): Promise<ScreenshotMetadata[]> {
  const expiringScreenshots: ScreenshotMetadata[] = [];
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  const thresholdTimestamp = Date.now() + thresholdMs;

  try {
    const files = await fs.readdir(uploadsDir);

    for (const file of files) {
      if (file.endsWith('.meta.json')) {
        const metadataPath = path.join(uploadsDir, file);
        
        try {
          const content = await fs.readFile(metadataPath, 'utf-8');
          const metadata: ScreenshotMetadata = JSON.parse(content);

          // Calculer l'expiration actuelle basée sur la dernière régénération
          // ou la date d'upload originale
          const baseTimestamp = metadata.lastUrlRegeneration || new Date(metadata.uploadedAt).getTime();
          const expirationTimestamp = baseTimestamp + (NEW_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

          // Si l'URL expire dans moins de X jours, la marquer pour régénération
          if (expirationTimestamp < thresholdTimestamp) {
            expiringScreenshots.push(metadata);
          }
        } catch (error: any) {
          console.error(`⚠️ Erreur lecture metadata ${file}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Erreur lecture dossier screenshots:', error.message);
  }

  return expiringScreenshots;
}

/**
 * Met à jour les métadonnées d'un screenshot avec le nouveau timestamp de régénération
 */
async function updateScreenshotMetadata(filename: string, lastUrlRegeneration: number): Promise<void> {
  const metadataPath = path.join(uploadsDir, `${filename}.meta.json`);

  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);
    
    metadata.lastUrlRegeneration = lastUrlRegeneration;
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  } catch (error: any) {
    console.error(`⚠️ Erreur mise à jour metadata ${filename}:`, error.message);
    throw error;
  }
}

/**
 * Régénère les URLs pour les screenshots qui expirent bientôt
 */
async function regenerateExpiringUrls(): Promise<void> {
  console.log('🔄 [CRON] Démarrage régénération URLs de screenshots...');
  console.log(`📅 Seuil: ${REGENERATION_THRESHOLD_DAYS} jours`);
  console.log(`⏱️  Nouvelle durée: ${NEW_EXPIRATION_DAYS} jours (6 mois)`);

  const startTime = Date.now();

  try {
    // Trouver tous les screenshots qui expirent bientôt
    const expiringScreenshots = await findExpiringScreenshots(REGENERATION_THRESHOLD_DAYS);

    if (expiringScreenshots.length === 0) {
      console.log('✅ [CRON] Aucun screenshot à régénérer');
      return;
    }

    console.log(`📊 [CRON] ${expiringScreenshots.length} screenshot(s) à régénérer`);

    let successCount = 0;
    let errorCount = 0;

    for (const screenshot of expiringScreenshots) {
      try {
        // Vérifier que le fichier existe toujours
        const filePath = path.join(uploadsDir, screenshot.filename);
        if (!(await fileExists(filePath))) {
          console.warn(`⚠️ [CRON] Fichier absent: ${screenshot.filename}`);
          errorCount++;
          continue;
        }

        // Générer nouvelle URL (6 mois)
        // Note: L'URL n'est pas stockée, elle est générée à la demande
        // On met juste à jour le timestamp de régénération dans les métadonnées
        const now = Date.now();
        await updateScreenshotMetadata(screenshot.filename, now);

        console.log(`✅ [CRON] ${screenshot.filename} - Metadata mis à jour (case: ${screenshot.caseId})`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ [CRON] Erreur ${screenshot.filename}:`, error.message);
        errorCount++;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [CRON] Régénération terminée en ${duration}s`);
    console.log(`📊 [CRON] Succès: ${successCount}, Erreurs: ${errorCount}`);

    // Logger dans la base de données (optionnel)
    try {
      await logCronExecution({
        task: 'screenshot_url_regeneration',
        success: successCount,
        errors: errorCount,
        duration: parseFloat(duration),
      });
    } catch (logError) {
      console.error('⚠️ [CRON] Erreur logging:', logError);
    }
  } catch (error: any) {
    console.error('❌ [CRON] Erreur fatale:', error.message);
    console.error(error.stack);
  }
}

/**
 * Logger l'exécution du CRON dans la base de données (optionnel)
 */
async function logCronExecution(data: {
  task: string;
  success: number;
  errors: number;
  duration: number;
}): Promise<void> {
  try {
    // Vous pouvez créer une table `cron_logs` pour tracker les exécutions
    // Pour l'instant, on log juste dans la console
    console.log(`📝 [CRON] Log: ${JSON.stringify(data)}`);
    
    // Exemple si vous voulez persister dans la DB:
    // await prisma.cronLog.create({
    //   data: {
    //     task: data.task,
    //     executedAt: new Date(),
    //     success: data.success,
    //     errors: data.errors,
    //     durationSeconds: data.duration,
    //   },
    // });
  } catch (error) {
    // Ne pas crasher si le logging échoue
    console.error('⚠️ [CRON] Erreur logging:', error);
  }
}

/**
 * Initialise et démarre le CRON job
 * S'exécute tous les jours à 3h00 du matin (heure locale du serveur)
 */
export function startScreenshotUrlCron(): void {
  console.log('🚀 [CRON] Initialisation du job de régénération des URLs de screenshots');
  console.log('⏰ [CRON] Planification: Tous les jours à 03:00');
  console.log(`📅 [CRON] Seuil de régénération: ${REGENERATION_THRESHOLD_DAYS} jours`);
  console.log(`⏱️  [CRON] Nouvelle durée: ${NEW_EXPIRATION_DAYS} jours (6 mois)`);

  // CRON pattern: '0 3 * * *' = Tous les jours à 3h00
  // Pour tester: '*/5 * * * *' = Toutes les 5 minutes
  cron.schedule('0 3 * * *', async () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏰ [CRON] Déclenchement à ${new Date().toLocaleString('fr-FR')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await regenerateExpiringUrls();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⏰ [CRON] Prochaine exécution: demain à 03:00');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }, {
    timezone: 'Europe/Brussels', // Timezone belge (ajustez selon votre localisation)
  });

  console.log('✅ [CRON] Job démarré avec succès');
  
  // Exécuter immédiatement au démarrage (optionnel, pour tester)
  // regenerateExpiringUrls();
}

/**
 * Fonction pour exécuter manuellement la régénération (pour tests)
 */
export async function manuallyRegenerateUrls(): Promise<void> {
  console.log('🔧 [MANUAL] Régénération manuelle démarrée');
  await regenerateExpiringUrls();
}
