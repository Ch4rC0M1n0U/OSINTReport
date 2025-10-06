import sharp = require('sharp');
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
// @ts-ignore - No types available for exif-parser
const exifParser = require('exif-parser');

interface ScreenshotMetadata {
  caseId: string;
  investigatorName: string;
}

interface ProcessedScreenshot {
  filename: string;
  signedUrl: string;
  expiresAt: number;
  metadata: {
    originalName: string;
    size: number;
    width: number;
    height: number;
    format: string;
    uploadedAt: string;
    uploadedBy: string;
  };
}

const uploadsDir = path.join(process.cwd(), 'uploads', 'screenshots');
const tempDir = path.join(uploadsDir, 'temp');
const secretKey = process.env.MEDIA_SECRET_KEY || 'change-this-in-production-please';

/**
 * Initialisation des dossiers
 */
async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error('Erreur création dossiers:', error);
  }
}

// Création des dossiers au démarrage
ensureDirectories();

/**
 * Traitement complet d'un screenshot:
 * 1. Lecture des métadonnées EXIF
 * 2. Compression optimale
 * 3. Watermarking automatique
 * 4. Stockage sécurisé
 * 5. Génération URL signée
 */
export async function processScreenshot(
  file: Express.Multer.File,
  userId: string,
  metadata: ScreenshotMetadata,
  baseUrl?: string
): Promise<ProcessedScreenshot> {
  const tempPath = file.path;
  const finalFilename = `${crypto.randomBytes(16).toString('hex')}.webp`;
  const finalPath = path.join(uploadsDir, finalFilename);

  try {
    // 1. Lecture de l'image source
    console.log(`📊 Processing image: ${file.originalname} (${file.size} bytes)`);
    
    const image = sharp(tempPath, {
      limitInputPixels: 50000000, // 50MP max (au lieu de 268MP par défaut, mais mieux géré)
      failOnError: false, // Continue même avec des erreurs mineures
    });
    const imageMetadata = await image.metadata();
    
    console.log(`📏 Image dimensions: ${imageMetadata.width}x${imageMetadata.height}`);
    console.log(`📦 Image format: ${imageMetadata.format}`);
    console.log(`💾 Image size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    // 2. Extraction EXIF détaillée (date/heure de capture + GPS)
    // TEMPORAIREMENT DÉSACTIVÉ - Cause des erreurs 500 avec certaines images
    let captureDate: string | undefined;
    let gpsLatitude: number | undefined;
    let gpsLongitude: number | undefined;
    let gpsAltitude: number | undefined;
    
    console.log('ℹ️ EXIF extraction temporarily disabled - will be re-enabled after debugging');
    
    /* DÉSACTIVÉ TEMPORAIREMENT
    try {
      // Lecture du fichier pour extraction EXIF avec exif-parser
      const fileBuffer = await fs.readFile(tempPath);
      
      try {
        // Vérification que le buffer est valide
        if (!fileBuffer || fileBuffer.length === 0) {
          console.log('ℹ️ Empty file buffer, skipping EXIF extraction');
        } else {
          const parser = exifParser.create(fileBuffer);
          
          // Parse avec options pour éviter les erreurs
          const result = parser.parse();
          
          if (result && result.tags) {
            console.log('ℹ️ EXIF tags found:', Object.keys(result.tags).length);
            
            // Extraction de la date de capture
            if (result.tags.DateTimeOriginal) {
              try {
                // DateTimeOriginal est en timestamp Unix
                captureDate = new Date(result.tags.DateTimeOriginal * 1000).toISOString();
                console.log('📸 Capture date extracted:', captureDate);
              } catch (dateErr) {
                console.warn('⚠️ Date conversion failed');
              }
            } else if (result.tags.CreateDate) {
              try {
                captureDate = new Date(result.tags.CreateDate * 1000).toISOString();
                console.log('📸 Create date extracted:', captureDate);
              } catch (dateErr) {
                console.warn('⚠️ Date conversion failed');
              }
            }
            
            // Extraction des coordonnées GPS
            const hasGPSLat = result.tags.GPSLatitude !== undefined && 
                             result.tags.GPSLatitude !== null &&
                             !isNaN(result.tags.GPSLatitude);
            const hasGPSLon = result.tags.GPSLongitude !== undefined && 
                             result.tags.GPSLongitude !== null &&
                             !isNaN(result.tags.GPSLongitude);
            
            if (hasGPSLat && hasGPSLon) {
              gpsLatitude = Number(result.tags.GPSLatitude);
              gpsLongitude = Number(result.tags.GPSLongitude);
              
              // Validation des coordonnées (latitude: -90 à 90, longitude: -180 à 180)
              if (gpsLatitude >= -90 && gpsLatitude <= 90 && 
                  gpsLongitude >= -180 && gpsLongitude <= 180) {
                console.log(`📍 GPS coordinates extracted: ${gpsLatitude}, ${gpsLongitude}`);
                
                // Altitude (optionnelle)
                if (result.tags.GPSAltitude !== undefined && 
                    result.tags.GPSAltitude !== null &&
                    !isNaN(result.tags.GPSAltitude)) {
                  gpsAltitude = Number(result.tags.GPSAltitude);
                  console.log('📍 GPS altitude extracted:', gpsAltitude);
                }
              } else {
                console.warn('⚠️ Invalid GPS coordinates:', gpsLatitude, gpsLongitude);
                gpsLatitude = undefined;
                gpsLongitude = undefined;
              }
            } else {
              console.log('ℹ️ No GPS data in image');
            }
          } else {
            console.log('ℹ️ No EXIF tags found in image');
          }
        }
      } catch (exifErr: any) {
        console.warn('⚠️ exif-parser failed:', exifErr.message, exifErr.stack);
        // Continue sans EXIF - ce n'est pas bloquant
      }
    } catch (err: any) {
      console.error('⚠️ EXIF extraction error:', err.message, err.stack);
      // Continue même si EXIF échoue - ce n'est pas critique
    }
    */

    // 3. Création du watermark
    const watermarkText = createWatermarkText(metadata);
    const watermarkSvg = generateWatermarkSvg(
      watermarkText,
      imageMetadata.width || 800
    );

    // 4. Traitement et compression
    // Pour les grandes images (>3000px), on garde une meilleure qualité
    const maxDimension = 3840; // 4K UHD
    const targetWidth = Math.min(imageMetadata.width || maxDimension, maxDimension);
    const targetHeight = Math.min(imageMetadata.height || maxDimension, maxDimension);
    
    console.log(`🔧 Resizing to max ${targetWidth}x${targetHeight}`);
    
    const processedImage = await image
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          gravity: 'southeast',
        },
      ])
      .webp({
        quality: 85,
        effort: 4, // Réduit de 6 à 4 pour traiter plus vite les grandes images
      })
      .withMetadata() // Garde les métadonnées de base
      .toFile(finalPath);
    
    console.log(`✅ Image processed: ${processedImage.width}x${processedImage.height}, ${(processedImage.size / 1024).toFixed(0)} KB`);

    // 5. Suppression du fichier temporaire
    await fs.unlink(tempPath);

    // 6. Sauvegarde des métadonnées (avec date de capture EXIF + GPS)
    await saveScreenshotMetadata({
      filename: finalFilename,
      originalName: file.originalname,
      userId,
      caseId: metadata.caseId,
      investigatorName: metadata.investigatorName,
      size: processedImage.size,
      width: processedImage.width,
      height: processedImage.height,
      format: processedImage.format,
      uploadedAt: new Date().toISOString(),
      captureDate, // Date de capture depuis EXIF (si disponible)
      gpsLatitude, // Latitude GPS (si disponible)
      gpsLongitude, // Longitude GPS (si disponible)
      gpsAltitude, // Altitude GPS (si disponible)
    });

    // 7. Génération URL signée (valide 48h)
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000; // 48h
    const signedUrl = generateSignedUrl(finalFilename, expiresAt, baseUrl);

    return {
      filename: finalFilename,
      signedUrl,
      expiresAt,
      metadata: {
        originalName: file.originalname,
        size: processedImage.size,
        width: processedImage.width,
        height: processedImage.height,
        format: processedImage.format,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      },
    };
  } catch (error: any) {
    // Nettoyage en cas d'erreur
    console.error('❌ Screenshot processing failed:', error.message);
    console.error('Stack:', error.stack);
    
    try {
      await fs.unlink(tempPath);
      if (await fileExists(finalPath)) {
        await fs.unlink(finalPath);
      }
    } catch (cleanupError) {
      console.error('⚠️ Cleanup error:', cleanupError);
    }
    
    // Message d'erreur plus informatif
    if (error.message.includes('Input image exceeds pixel limit')) {
      throw new Error('Image trop grande (nombre de pixels dépassé). Essayez de réduire la résolution.');
    } else if (error.message.includes('memory')) {
      throw new Error('Image trop volumineuse pour le traitement. Essayez de compresser l\'image d\'abord.');
    }
    
    throw error;
  }
}

/**
 * Création du texte du watermark
 * Format: Date + Heure | Case UID
 */
function createWatermarkText(metadata: ScreenshotMetadata): string {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${date} | Case: ${metadata.caseId}`;
}

/**
 * Génération du SVG du watermark
 */
function generateWatermarkSvg(text: string, imageWidth: number): string {
  const fontSize = Math.max(12, Math.min(16, imageWidth / 80));
  const padding = 10;

  return `
    <svg width="${imageWidth}" height="40">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect x="0" y="0" width="${imageWidth}" height="40" fill="rgba(0,0,0,0.6)"/>
      <text
        x="${padding}"
        y="25"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        fill="white"
        filter="url(#shadow)"
      >${text}</text>
    </svg>
  `;
}

/**
 * Génération d'une URL signée avec expiration
 * @param filename Nom du fichier
 * @param expiresAt Timestamp d'expiration
 * @param baseUrl URL de base du serveur (détectée depuis la requête)
 */
export function generateSignedUrl(
  filename: string,
  expiresAt: number,
  baseUrl?: string
): string {
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${filename}:${expiresAt}`)
    .digest('hex');

  // Utiliser l'URL fournie, sinon fallback sur env, sinon localhost
  const apiUrl = baseUrl || process.env.API_URL || 'http://localhost:4000';
  return `${apiUrl}/api/media/screenshot/${filename}?signature=${signature}&expires=${expiresAt}`;
}

/**
 * Vérification de la signature d'une URL
 */
export function verifySignature(
  filename: string,
  signature: string,
  expires: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(`${filename}:${expires}`)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Récupération du chemin complet d'un screenshot
 */
export async function getScreenshotPath(filename: string): Promise<string> {
  const filePath = path.join(uploadsDir, filename);

  if (!(await fileExists(filePath))) {
    throw new Error('Screenshot introuvable');
  }

  return filePath;
}

/**
 * Vérification de l'existence d'un fichier
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
 * Sauvegarde des métadonnées d'un screenshot
 */
async function saveScreenshotMetadata(data: {
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
  captureDate?: string; // Date de capture depuis EXIF (optionnelle)
  gpsLatitude?: number; // Latitude GPS (optionnelle)
  gpsLongitude?: number; // Longitude GPS (optionnelle)
  gpsAltitude?: number; // Altitude GPS en mètres (optionnelle)
}) {
  const metadataPath = path.join(uploadsDir, `${data.filename}.meta.json`);
  await fs.writeFile(metadataPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Liste des screenshots d'un dossier spécifique
 * Les screenshots sont isolés par caseId pour maintenir la confidentialité
 */
export async function listUserScreenshots(
  userId: string,
  baseUrl?: string,
  caseId?: string
): Promise<any[]> {
  const files = await fs.readdir(uploadsDir);
  const screenshots = [];

  for (const file of files) {
    if (file.endsWith('.meta.json')) {
      const metadataPath = path.join(uploadsDir, file);
      const content = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);

      // Filtrer par userId ET caseId si fourni
      const userMatch = metadata.userId === userId;
      const caseMatch = !caseId || metadata.caseId === caseId;

      if (userMatch && caseMatch) {
        const expiresAt = Date.now() + 48 * 60 * 60 * 1000;
        screenshots.push({
          filename: metadata.filename,
          originalName: metadata.originalName,
          url: generateSignedUrl(metadata.filename, expiresAt, baseUrl),
          expiresAt,
          uploadedAt: metadata.uploadedAt || new Date().toISOString(),
          captureDate: metadata.captureDate, // Date de capture EXIF (si disponible)
          caseId: metadata.caseId,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
        });
      }
    }
  }

  return screenshots;
}

/**
 * Suppression d'un screenshot
 * Vérifie les permissions (userId) et l'appartenance au dossier (caseId)
 */
export async function deleteScreenshot(
  filename: string,
  userId: string,
  caseId?: string
) {
  const metadataPath = path.join(uploadsDir, `${filename}.meta.json`);

  // Vérification des permissions
  if (await fileExists(metadataPath)) {
    const content = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);

    if (metadata.userId !== userId) {
      throw new Error('Vous ne pouvez pas supprimer ce fichier (permissions)');
    }

    // Vérification de l'appartenance au dossier si caseId fourni
    if (caseId && metadata.caseId !== caseId) {
      throw new Error('Ce screenshot n\'appartient pas à ce dossier');
    }
  }

  // Suppression des fichiers
  const filePath = path.join(uploadsDir, filename);
  await fs.unlink(filePath);
  if (await fileExists(metadataPath)) {
    await fs.unlink(metadataPath);
  }
}
