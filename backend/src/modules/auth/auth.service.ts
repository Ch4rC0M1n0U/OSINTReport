import createError from "http-errors";
import { prisma } from "@shared/prisma";
import { hashPassword, hashSecret, verifyPassword, verifySecret } from "@shared/password";
import { createRefreshToken, signAccessToken, verifyRefreshToken } from "@shared/token";

import { PermissionCode } from "./auth.constants";
import { LoginInput, RegisterInput } from "./auth.validation";

export type AuthenticatedUser = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  phone: string | null;
  grade: string | null;
  unit: string | null;
  avatarUrl: string | null;
  signatureUrl: string | null;
  timezone: string | null;
  dateFormat: string | null;
  firstDayOfWeek: string | null;
  roleId: string;
  roleName: string;
  permissions: PermissionCode[];
};

function mapPermissions(rolePermissions: { permission: { code: string } }[]): PermissionCode[] {
  return rolePermissions.map((rolePermission) => rolePermission.permission.code as PermissionCode);
}

async function getUserWithRoleByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      matricule: true,
      email: true,
      phone: true,
      grade: true,
      unit: true,
      avatarUrl: true,
      signatureUrl: true,
      timezone: true,
      dateFormat: true,
      firstDayOfWeek: true,
      passwordHash: true,
      roleId: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });
}

type UserWithRole = NonNullable<Awaited<ReturnType<typeof getUserWithRoleByEmail>>>;

function buildAuthenticatedUser(user: UserWithRole): AuthenticatedUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    matricule: user.matricule,
    email: user.email,
    phone: user.phone,
    grade: user.grade,
    unit: user.unit,
    avatarUrl: user.avatarUrl,
    signatureUrl: user.signatureUrl,
    timezone: user.timezone,
    dateFormat: user.dateFormat,
    firstDayOfWeek: user.firstDayOfWeek,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: mapPermissions(user.role.permissions),
  };
}

export class AuthService {
  static async register(input: RegisterInput, actor: AuthenticatedUser): Promise<AuthenticatedUser> {
    if (!actor.permissions.includes(PermissionCode.USERS_WRITE)) {
      throw createError(403, "Insuffisance de droits pour créer un utilisateur");
    }

    const role = await prisma.role.findUnique({ where: { name: input.role } });
    if (!role) {
      throw createError(400, "Rôle inconnu");
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email.toLowerCase() }, { matricule: input.matricule }],
      },
    });

    if (existing) {
      throw createError(409, "Un utilisateur avec cet email ou matricule existe déjà");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        matricule: input.matricule,
        email: input.email.toLowerCase(),
        phone: input.phone || null,
        grade: input.grade || null,
        passwordHash,
        roleId: role.id,
  status: "ACTIVE",
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return buildAuthenticatedUser(user);
  }

  static async login(
    input: LoginInput,
    context: { userAgent?: string; ipAddress?: string }
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshTokenJti: string;
    sessionId: string;
    expiresAt: Date;
    user: AuthenticatedUser;
  }> {
    const user = await getUserWithRoleByEmail(input.email);

    if (!user) {
      throw createError(401, "Identifiants invalides");
    }

    if (user.status !== "ACTIVE") {
      throw createError(403, "Compte utilisateur inactif. Contactez un administrateur.");
    }

    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw createError(401, "Identifiants invalides");
    }

    const authenticated = buildAuthenticatedUser(user);

    const accessToken = signAccessToken({
      sub: authenticated.id,
      roleId: authenticated.roleId,
      roleName: authenticated.roleName,
      permissions: authenticated.permissions,
    });

    const refresh = createRefreshToken(authenticated.id);
    const refreshTokenHash = await hashSecret(refresh.jti);

    await prisma.userSession.create({
      data: {
        id: refresh.sessionId,
        userId: authenticated.id,
        refreshTokenHash,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: refresh.expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      refreshTokenJti: refresh.jti,
      sessionId: refresh.sessionId,
      expiresAt: refresh.expiresAt,
      user: authenticated,
    };
  }

  static async refresh(refreshToken: string) {
    let payload: { sub: string; sessionId: string; jti: string };

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw createError(401, "Refresh token invalide");
    }

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw createError(401, "Session expirée. Reconnectez-vous.");
    }

    const isValid = await verifySecret(session.refreshTokenHash, payload.jti);
    if (!isValid) {
      await prisma.userSession.delete({ where: { id: payload.sessionId } });
      throw createError(401, "Token de session invalide");
    }

    const user = session.user;

    if (user.status !== "ACTIVE") {
      throw createError(403, "Compte utilisateur inactif");
    }

    const authenticated = buildAuthenticatedUser(user);

    const accessToken = signAccessToken({
      sub: authenticated.id,
      roleId: authenticated.roleId,
      roleName: authenticated.roleName,
      permissions: authenticated.permissions,
    });

    const refresh = createRefreshToken(authenticated.id);
    const refreshTokenHash = await hashSecret(refresh.jti);

    await prisma.$transaction([
      prisma.userSession.delete({ where: { id: session.id } }),
      prisma.userSession.create({
        data: {
          id: refresh.sessionId,
          userId: authenticated.id,
          refreshTokenHash,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
          expiresAt: refresh.expiresAt,
        },
      }),
    ]);

    return {
      accessToken,
      refreshToken: refresh.token,
      refreshTokenJti: refresh.jti,
      sessionId: refresh.sessionId,
      expiresAt: refresh.expiresAt,
      user: authenticated,
    };
  }

  static async logout(sessionId: string) {
    await prisma.userSession.deleteMany({ where: { id: sessionId } });
  }

  static async revokeUserSessions(userId: string) {
    await prisma.userSession.deleteMany({ where: { userId } });
  }

  static async changePassword(userId: string, current: string, next: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    const isValid = await verifyPassword(user.passwordHash, current);
    if (!isValid) {
      throw createError(400, "Mot de passe actuel invalide");
    }

    const newHash = await hashPassword(next);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await this.revokeUserSessions(userId);
  }

  static async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw createError(404, "Utilisateur introuvable");
    }

    return buildAuthenticatedUser(user);
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Ne pas révéler si l'utilisateur existe ou non pour des raisons de sécurité
    if (!user) {
      return;
    }

    // Générer un token unique
    const crypto = await import("crypto");
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await hashSecret(resetToken);

    // Le token expire dans 1 heure
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Invalider tous les tokens précédents non utilisés
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    // Créer le nouveau token
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Envoyer l'email
    const { EmailService } = await import("@modules/email/email.service");
    const { env } = await import("@config/env");

    await EmailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken,
      env.FRONTEND_URL
    );
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = await hashSecret(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken) {
      throw createError(400, "Token de réinitialisation invalide ou expiré");
    }

    if (resetToken.usedAt) {
      throw createError(400, "Ce token a déjà été utilisé");
    }

    if (resetToken.expiresAt < new Date()) {
      throw createError(400, "Ce token a expiré");
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await hashPassword(newPassword);

    // Mettre à jour le mot de passe et marquer le token comme utilisé
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // Révoquer toutes les sessions de l'utilisateur
    await this.revokeUserSessions(resetToken.userId);
  }
}
