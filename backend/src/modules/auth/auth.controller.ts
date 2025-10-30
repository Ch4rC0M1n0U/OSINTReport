import { Request, Response } from "express";
import createError from "http-errors";

import {
  accessTokenCookieOptions,
  clearedCookieOptions,
  cookieNames,
  refreshTokenCookieOptions,
} from "@config/cookies";
import { AuthService } from "@modules/auth/auth.service";
import {
  ChangePasswordInput,
  changePasswordSchema,
  ForgotPasswordInput,
  forgotPasswordSchema,
  LoginInput,
  loginSchema,
  registerSchema,
  ResetPasswordInput,
  resetPasswordSchema,
} from "@modules/auth/auth.validation";
import { verify2FASchema } from "@modules/auth/auth2FA.validation";
import { verifyRefreshToken } from "@shared/token";

export class AuthController {
  static async register(req: Request, res: Response) {
    const payload = registerSchema.parse(req.body);
    const actor = req.user;

    if (!actor) {
      throw createError(401, "Authentification requise");
    }

    const user = await AuthService.register(payload, actor);

    res.status(201).json({ user });
  }

  static async login(req: Request, res: Response) {
    const payload: LoginInput = loginSchema.parse(req.body);

    const result = await AuthService.login(payload, {
      userAgent: req.get("user-agent") ?? undefined,
      ipAddress: req.ip,
    });

    // Si la 2FA est requise, retourner le tempToken
    if (result.requires2FA) {
      return res.status(200).json({ 
        requires2FA: true, 
        tempToken: result.tempToken 
      });
    }

    // Sinon, compléter le login
    if (!result.accessToken || !result.refreshToken || !result.user) {
      throw createError(500, "Erreur lors de la connexion");
    }

    AuthController.writeAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({ user: result.user });
  }

  static async verify2FA(req: Request, res: Response) {
    const payload = verify2FASchema.parse(req.body);

    const result = await AuthService.verify2FAAndCompleteLogin(
      payload.tempToken,
      payload.token,
      {
        userAgent: req.get("user-agent") ?? undefined,
        ipAddress: req.ip,
      }
    );

    AuthController.writeAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({ user: result.user });
  }

  static async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[cookieNames.refreshToken];
    if (!refreshToken) {
      throw createError(401, "Refresh token manquant");
    }

    const result = await AuthService.refresh(refreshToken);

    AuthController.writeAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(200).json({ user: result.user });
  }

  static async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[cookieNames.refreshToken];
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await AuthService.logout(payload.sessionId);
      } catch (error) {
        // ignore invalid token during logout
      }
    }

    res
      .clearCookie(cookieNames.accessToken, clearedCookieOptions)
      .clearCookie(cookieNames.refreshToken, clearedCookieOptions)
      .status(204)
      .send();
  }

  static async changePassword(req: Request, res: Response) {
    const payload: ChangePasswordInput = changePasswordSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      throw createError(401, "Authentification requise");
    }

    await AuthService.changePassword(user.id, payload.currentPassword, payload.newPassword);

    res
      .clearCookie(cookieNames.accessToken, clearedCookieOptions)
      .clearCookie(cookieNames.refreshToken, clearedCookieOptions)
      .status(204)
      .send();
  }

  static async forgotPassword(req: Request, res: Response) {
    const payload: ForgotPasswordInput = forgotPasswordSchema.parse(req.body);

    // Appel asynchrone sans attendre pour ne pas révéler si l'email existe
    AuthService.requestPasswordReset(payload.email).catch((error) => {
      console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
    });

    // Réponse immédiate pour ne pas révéler si l'email existe
    res.status(200).json({
      message:
        "Si un compte avec cet email existe, un lien de réinitialisation a été envoyé.",
    });
  }

  static async resetPassword(req: Request, res: Response) {
    const payload: ResetPasswordInput = resetPasswordSchema.parse(req.body);

    await AuthService.resetPassword(payload.token, payload.newPassword);

    res.status(200).json({
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
    });
  }

  private static writeAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(cookieNames.accessToken, accessToken, accessTokenCookieOptions);
    res.cookie(cookieNames.refreshToken, refreshToken, refreshTokenCookieOptions);
  }
}
