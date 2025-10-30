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
import { AuditService, AuditAction, AuditResource } from "@modules/audit/audit.service";

export class AuthController {
  static async register(req: Request, res: Response) {
    const payload = registerSchema.parse(req.body);
    const actor = req.user;

    if (!actor) {
      throw createError(401, "Authentification requise");
    }

    const user = await AuthService.register(payload, actor);

    // Logger la création d'utilisateur
    await AuditService.logFromRequest(
      req,
      AuditAction.USER_CREATE,
      AuditResource.USER,
      user.id,
      {
        email: user.email,
        matricule: user.matricule,
        createdBy: actor.id,
      }
    );

    res.status(201).json({ user });
  }

  static async login(req: Request, res: Response) {
    const payload: LoginInput = loginSchema.parse(req.body);

    try {
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

      // Logger la connexion réussie
      await AuditService.log({
        userId: result.user.id,
        action: AuditAction.LOGIN,
        resource: AuditResource.AUTH,
        details: {
          identifier: payload.identifier,
          matricule: result.user.matricule,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      AuthController.writeAuthCookies(res, result.accessToken, result.refreshToken);

      res.status(200).json({ user: result.user });
    } catch (error) {
      // Logger la tentative de connexion échouée
      await AuditService.log({
        userId: undefined,
        action: AuditAction.LOGIN_FAILED,
        resource: AuditResource.AUTH,
        details: {
          identifier: payload.identifier,
          reason: error instanceof Error ? error.message : "Unknown error",
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      throw error;
    }
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

    // Logger la vérification 2FA réussie
    await AuditService.log({
      userId: result.user.id,
      action: AuditAction.TWO_FACTOR_VERIFY,
      resource: AuditResource.AUTH,
      details: {
        matricule: result.user.matricule,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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
    const user = req.user;
    
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await AuthService.logout(payload.sessionId);
      } catch (error) {
        // ignore invalid token during logout
      }
    }

    // Logger la déconnexion
    if (user) {
      await AuditService.log({
        userId: user.id,
        action: AuditAction.LOGOUT,
        resource: AuditResource.AUTH,
        details: {
          matricule: user.matricule,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
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

    // Logger la demande de réinitialisation
    await AuditService.log({
      userId: undefined,
      action: AuditAction.PASSWORD_RESET_REQUEST,
      resource: AuditResource.AUTH,
      details: {
        email: payload.email,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

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

    // Logger la réinitialisation de mot de passe (sans récupérer l'ID utilisateur pour des raisons de sécurité)
    await AuditService.log({
      userId: undefined,
      action: AuditAction.PASSWORD_RESET_COMPLETE,
      resource: AuditResource.AUTH,
      details: {
        tokenUsed: true,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      message: "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.",
    });
  }

  private static writeAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(cookieNames.accessToken, accessToken, accessTokenCookieOptions);
    res.cookie(cookieNames.refreshToken, refreshToken, refreshTokenCookieOptions);
  }
}
