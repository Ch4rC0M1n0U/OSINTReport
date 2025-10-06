/**
 * Service API pour la gestion des paramètres système
 */

import { api } from "@/services/http";

export interface SystemSettings {
  id: string;
  serviceName: string;
  serviceFullName?: string | null;
  serviceAddress?: string | null;
  serviceCity?: string | null;
  servicePostalCode?: string | null;
  serviceCountry?: string | null;
  phoneNumber?: string | null;
  faxNumber?: string | null;
  emailContact?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  serviceName?: string;
  serviceFullName?: string | null;
  serviceAddress?: string | null;
  serviceCity?: string | null;
  servicePostalCode?: string | null;
  serviceCountry?: string | null;
  phoneNumber?: string | null;
  faxNumber?: string | null;
  emailContact?: string | null;
  websiteUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

class SettingsApi {
  /**
   * Récupérer les paramètres système
   */
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get<SystemSettings>("/settings");
    return response.data;
  }

  /**
   * Mettre à jour les paramètres système
   */
  async updateSettings(data: UpdateSettingsData): Promise<SystemSettings> {
    const response = await api.put<SystemSettings>("/settings", data);
    return response.data;
  }

  /**
   * Upload du logo
   */
  async uploadLogo(file: File): Promise<SystemSettings> {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await api.post<SystemSettings>(
      "/settings/logo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  /**
   * Supprimer le logo
   */
  async removeLogo(): Promise<SystemSettings> {
    const response = await api.delete<SystemSettings>("/settings/logo");
    return response.data;
  }

  /**
   * Génère l'URL complète du logo
   */
  getLogoUrl(logoPath: string | null): string | null {
    if (!logoPath) return null;
    if (logoPath.startsWith("http")) return logoPath;

    // En développement, le proxy Vite gère /uploads
    // En production, on utilise l'URL complète du backend
    if (import.meta.env.DEV) {
      // Utilise le proxy Vite en développement
      return logoPath;
    }

    // En production, construire l'URL de base
    const baseUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : window.location.origin.replace(/\/$/, "");

    return `${baseUrl}${logoPath}`;
  }
}

export const settingsApi = new SettingsApi();
