import speakeasy from "speakeasy";
import qrcode from "qrcode";
import createError from "http-errors";
import { prisma } from "@shared/prisma";
import { logger } from "@config/logger";

export class TwoFactorService {
  /**
   * Génère un secret 2FA pour un utilisateur
   */
  static async generateSecret(userId: string): Promise<{
    secret: string;
    qrCode: string;
    backupCodes?: string[];
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    if (user.twoFactorEnabled) {
      throw createError(400, "L'authentification à deux facteurs est déjà activée");
    }

    // Générer le secret
    const secret = speakeasy.generateSecret({
      name: `OSINTReport (${user.email})`,
      issuer: "OSINTReport",
      length: 32,
    });

    if (!secret.base32) {
      throw createError(500, "Erreur lors de la génération du secret 2FA");
    }

    // Générer le QR code
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url || "");

    logger.info({ userId }, "Secret 2FA généré");

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
    };
  }

  /**
   * Active l'authentification à deux facteurs
   */
  static async enable(userId: string, secret: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    if (user.twoFactorEnabled) {
      throw createError(400, "L'authentification à deux facteurs est déjà activée");
    }

    // Vérifier le token
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!isValid) {
      throw createError(400, "Code de vérification invalide");
    }

    // Activer la 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    logger.info({ userId }, "Authentification à deux facteurs activée");
  }

  /**
   * Désactive l'authentification à deux facteurs
   */
  static async disable(userId: string, token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw createError(400, "L'authentification à deux facteurs n'est pas activée");
    }

    // Vérifier le token
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!isValid) {
      throw createError(400, "Code de vérification invalide");
    }

    // Désactiver la 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    logger.info({ userId }, "Authentification à deux facteurs désactivée");
  }

  /**
   * Vérifie un token 2FA
   */
  static async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return true; // Si la 2FA n'est pas activée, on accepte
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
      window: 2,
    });

    return isValid;
  }

  /**
   * Vérifie si un utilisateur a la 2FA activée
   */
  static async isEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    return user.twoFactorEnabled;
  }
}
