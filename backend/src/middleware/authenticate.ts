import { NextFunction, Request, Response } from "express";
import createError from "http-errors";

import { cookieNames } from "@config/cookies";
import { AuthService } from "@modules/auth/auth.service";
import { PermissionCode } from "@modules/auth/auth.constants";
import { verifyAccessToken } from "@shared/token";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const accessToken = extractToken(req);
    if (!accessToken) {
      throw createError(401, "Token d'accès manquant");
    }

    const payload = verifyAccessToken(accessToken);
    const user = await AuthService.getAuthenticatedUser(payload.sub);

    req.user = {
      id: user.id,
      roleId: user.roleId,
      roleName: user.roleName,
      permissions: user.permissions,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (error) {
    next(createError(401, "Authentification requise"));
  }
}

export function requirePermissions(...permissions: PermissionCode[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return next(createError(401, "Authentification requise"));
    }

    const hasAllPermissions = permissions.every((permission) =>
      user.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(createError(403, "Permissions insuffisantes"));
    }

    next();
  };
}

function extractToken(req: Request): string | null {
  const bearer = req.headers.authorization;
  if (bearer?.startsWith("Bearer ")) {
    return bearer.substring(7);
  }

  const cookieToken = req.cookies?.[cookieNames.accessToken];
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}
