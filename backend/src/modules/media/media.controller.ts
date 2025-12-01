import { Request, Response } from 'express';
import * as mediaService from './media.service';
import { prisma } from '@config/prisma';

/**
 * Récupère l'URL de base du serveur depuis les headers de la requête.
 * Supporte les environnements avec proxy (Codespaces, Heroku, AWS, etc.)
 */
function getServerBaseUrl(req: Request): string {
  const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:4000';
  return `${protocol}://${host}`;
}

/**
 * Upload d'un screenshot avec traitement sécurisé
 */
export async function uploadScreenshot(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni',
      });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    // Récupérer le reportId/caseId depuis la query
    const reportId = (req.query.caseId as string);
    let caseNumber = 'N/A';
    
    // Si un reportId est fourni, récupérer le caseNumber du rapport
    if (reportId && reportId !== 'N/A') {
      try {
        const report = await prisma.report.findUnique({
          where: { id: reportId },
          select: { caseNumber: true }
        });
        if (report && report.caseNumber) {
          caseNumber = report.caseNumber;
        }
      } catch (error) {
        // Si erreur (UUID invalide ou rapport inexistant), garder N/A
        console.warn(`Impossible de récupérer le caseNumber pour reportId ${reportId}`);
      }
    }

    const investigatorName =
      (req.query.investigatorName as string) || (req as any).user?.email || 'Investigateur';

    // Récupération de l'URL de base réelle du serveur
    const baseUrl = getServerBaseUrl(req);

    const result = await mediaService.processScreenshot(req.file, userId, {
      caseId: caseNumber, // Utiliser le caseNumber au lieu du reportId
      investigatorName,
    }, baseUrl);

    return res.json({
      success: true,
      data: {
        filename: result.filename,
        url: result.signedUrl,
        expiresAt: result.expiresAt,
        metadata: result.metadata,
      },
    });
  } catch (error: any) {
    console.error('Erreur upload screenshot:', error);
    return res.status(500).json({
      success: false,
      error: `Erreur lors du traitement: ${error.message}`,
    });
  }
}

/**
 * Récupération d'un screenshot via URL signée
 */
export async function getScreenshot(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    const { signature, expires } = req.query;

    if (!signature || !expires) {
      return res.status(400).json({
        success: false,
        error: 'URL invalide ou expirée',
      });
    }

    // Vérification de la signature
    const isValid = mediaService.verifySignature(
      filename,
      signature as string,
      expires as string
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Signature invalide',
      });
    }

    // Vérification de l'expiration (48h)
    const expiresAt = parseInt(expires as string, 10);
    if (Date.now() > expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'URL expirée',
      });
    }

    const filePath = await mediaService.getScreenshotPath(filename);
    return res.sendFile(filePath);
  } catch (error: any) {
    console.error('Erreur récupération screenshot:', error);
    return res.status(404).json({
      success: false,
      error: 'Fichier introuvable',
    });
  }
}

/**
 * Liste des screenshots de l'utilisateur pour un dossier spécifique
 */
export async function listScreenshots(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    // Récupération de l'URL de base réelle du serveur
    const baseUrl = getServerBaseUrl(req);

    // Filtrage optionnel par caseId (OBLIGATOIRE en production pour isolation)
    const caseId = req.query.caseId as string | undefined;

    const screenshots = await mediaService.listUserScreenshots(userId, baseUrl, caseId);

    return res.json({
      success: true,
      data: screenshots,
    });
  } catch (error: any) {
    console.error('Erreur liste screenshots:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération',
    });
  }
}

/**
 * Suppression d'un screenshot
 */
export async function deleteScreenshot(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    // Vérification optionnelle du caseId pour sécurité supplémentaire
    const caseId = req.query.caseId as string | undefined;

    await mediaService.deleteScreenshot(filename, userId, caseId);

    return res.json({
      success: true,
      message: 'Screenshot supprimé',
    });
  } catch (error: any) {
    console.error('Erreur suppression screenshot:', error);

    if (error.message?.includes('permissions')) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer ce fichier',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression',
    });
  }
}

/**
 * Télécharge une image depuis une URL externe et la stocke localement
 * Utile pour capturer les images WhatsApp/externes avant expiration
 */
export async function downloadFromUrl(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
      });
    }

    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'URL manquante',
      });
    }

    // Vérifier que l'URL est valide
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'URL invalide',
      });
    }

    const reportId = (req.query.caseId as string);
    let caseNumber = 'N/A';
    
    if (reportId && reportId !== 'N/A') {
      try {
        const report = await prisma.report.findUnique({
          where: { id: reportId },
          select: { caseNumber: true }
        });
        if (report && report.caseNumber) {
          caseNumber = report.caseNumber;
        }
      } catch (error) {
        console.warn(`Impossible de récupérer le caseNumber pour reportId ${reportId}`);
      }
    }

    const investigatorName =
      (req.query.investigatorName as string) || (req as any).user?.email || 'Investigateur';

    const baseUrl = getServerBaseUrl(req);

    const result = await mediaService.downloadImageFromUrl(url, userId, {
      caseId: caseNumber,
      investigatorName,
    }, baseUrl);

    return res.json({
      success: true,
      data: {
        filename: result.filename,
        url: result.signedUrl,
        expiresAt: result.expiresAt,
        metadata: result.metadata,
      },
    });
  } catch (error: any) {
    console.error('Erreur téléchargement depuis URL:', error);
    return res.status(500).json({
      success: false,
      error: `Erreur lors du téléchargement: ${error.message}`,
    });
  }
}
