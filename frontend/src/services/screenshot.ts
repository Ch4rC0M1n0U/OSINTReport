import { api } from './http';

export interface Screenshot {
  filename: string;
  originalName: string;
  url: string;
  expiresAt: number;
  uploadedAt: string;
  captureDate?: string; // Date de capture depuis EXIF (optionnelle)
  gpsLatitude?: number; // Latitude GPS (optionnelle)
  gpsLongitude?: number; // Longitude GPS (optionnelle)
  gpsAltitude?: number; // Altitude GPS en mètres (optionnelle)
  caseId: string;
  size: number;
  width: number;
  height: number;
}

export interface UploadScreenshotOptions {
  caseId?: string;
  investigatorName?: string;
}

/**
 * Service de gestion des screenshots
 * Communique avec l'API sécurisée pour l'upload et la récupération
 */
export const screenshotService = {
  /**
   * Upload d'une capture d'écran
   * @param file Fichier à uploader (max 2MB, PNG/JPG/WebP)
   * @param options Options d'upload (caseId, investigatorName)
   * @returns Métadonnées du screenshot uploadé avec URL signée
   */
  async upload(file: File, options: UploadScreenshotOptions = {}): Promise<Screenshot> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams();
    if (options.caseId) {
      params.append('caseId', options.caseId);
    }
    if (options.investigatorName) {
      params.append('investigatorName', options.investigatorName);
    }

    const queryString = params.toString();
    const url = queryString ? `/media/upload?${queryString}` : '/media/upload';

    const response = await api.post<{ success: boolean; data: Screenshot }>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) {
      throw new Error('Upload failed');
    }

    return response.data.data;
  },

  /**
   * Liste tous les screenshots d'un dossier spécifique
   * @param caseId UID du dossier (OBLIGATOIRE pour isolation)
   * @returns Liste des screenshots du dossier avec URLs signées (valides 48h)
   */
  async list(caseId: string): Promise<Screenshot[]> {
    const response = await api.get<{ success: boolean; data: Screenshot[] }>(
      `/media/screenshots/list?caseId=${encodeURIComponent(caseId)}`
    );

    if (!response.data.success) {
      throw new Error('Failed to list screenshots');
    }

    return response.data.data;
  },

  /**
   * Suppression d'un screenshot
   * @param filename Nom du fichier à supprimer
   * @param caseId UID du dossier (pour vérification supplémentaire)
   */
  async delete(filename: string, caseId?: string): Promise<void> {
    const url = caseId
      ? `/media/screenshot/${filename}?caseId=${encodeURIComponent(caseId)}`
      : `/media/screenshot/${filename}`;

    const response = await api.delete<{ success: boolean; message: string }>(url);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Deletion failed');
    }
  },

  /**
   * Télécharge une image depuis une URL externe et la stocke localement
   * Utile pour capturer les images WhatsApp/externes avant expiration
   * @param url URL de l'image à télécharger
   * @param options Options (caseId, investigatorName)
   * @returns Métadonnées du screenshot avec URL signée locale
   */
  async downloadFromUrl(url: string, options: UploadScreenshotOptions = {}): Promise<Screenshot> {
    const params = new URLSearchParams();
    if (options.caseId) {
      params.append('caseId', options.caseId);
    }
    if (options.investigatorName) {
      params.append('investigatorName', options.investigatorName);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/media/download-from-url?${queryString}` : '/media/download-from-url';

    const response = await api.post<{ success: boolean; data: Screenshot }>(endpoint, { url });

    if (!response.data.success) {
      throw new Error('Download from URL failed');
    }

    return response.data.data;
  },
};
