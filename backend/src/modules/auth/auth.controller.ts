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
  LoginInput,
  loginSchema,
  registerSchema,
} from "@modules/auth/auth.validation";
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

  private static writeAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(cookieNames.accessToken, accessToken, accessTokenCookieOptions);
    res.cookie(cookieNames.refreshToken, refreshToken, refreshTokenCookieOptions);
  }
}
