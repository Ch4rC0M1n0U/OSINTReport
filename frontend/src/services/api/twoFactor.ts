import { api } from "@/services/http";

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export const twoFactorApi = {
  /**
   * Récupère le statut 2FA de l'utilisateur connecté
   */
  async getStatus(): Promise<TwoFactorStatus> {
    const response = await api.get<TwoFactorStatus>("/2fa/status");
    return response.data;
  },

  /**
   * Génère un secret 2FA et un QR code
   */
  async generateSecret(): Promise<TwoFactorSetup> {
    const response = await api.post<TwoFactorSetup>("/2fa/generate");
    return response.data;
  },

  /**
   * Active la 2FA avec le secret et le code de vérification
   */
  async enable(secret: string, token: string): Promise<void> {
    await api.post("/2fa/enable", { secret, token });
  },

  /**
   * Désactive la 2FA avec le code de vérification
   */
  async disable(token: string): Promise<void> {
    await api.post("/2fa/disable", { token });
  },

  /**
   * Vérifie un code 2FA lors du login
   */
  async verify2FA(tempToken: string, token: string): Promise<{user: any}> {
    const response = await api.post("/auth/verify-2fa", { tempToken, token });
    return response.data;
  },
};
