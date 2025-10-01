import { prisma } from "@shared/prisma";
import { hashPassword, verifyPassword } from "@shared/password";
import { logger } from "@config/logger";
import { env } from "@config/env";

import { PermissionCode, ROLE_DEFINITIONS } from "./auth.constants";

const PERMISSION_DEFINITIONS: Array<{ id: string; code: PermissionCode; description: string }> = [
  {
    id: "perm-reports-read",
    code: PermissionCode.REPORTS_READ,
    description: "Lecture des rapports OSINT",
  },
  {
    id: "perm-reports-write",
    code: PermissionCode.REPORTS_WRITE,
    description: "Création et modification des rapports OSINT",
  },
  {
    id: "perm-users-read",
    code: PermissionCode.USERS_READ,
    description: "Lecture des comptes utilisateurs",
  },
  {
    id: "perm-users-write",
    code: PermissionCode.USERS_WRITE,
    description: "Gestion des comptes utilisateurs",
  },
  {
    id: "perm-admin",
    code: PermissionCode.ADMIN,
    description: "Administration complète du système",
  },
];

export async function bootstrapAuth() {
  await ensurePermissions();
  const roles = await ensureRoles();
  await ensureRolePermissions(roles);
  await ensureAdminAccount(roles);
}

async function ensurePermissions() {
  for (const permission of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { description: permission.description },
      create: {
        id: permission.id,
        code: permission.code,
        description: permission.description,
      },
    });
  }
}

async function ensureRoles() {
  const roleMap = new Map<string, { id: string; name: string }>();

  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: {
        description: roleDef.description,
      },
      create: {
        id: roleDef.id,
        name: roleDef.name,
        description: roleDef.description,
      },
    });

    roleMap.set(roleDef.name, role);
  }

  return roleMap;
}

async function ensureRolePermissions(roleMap: Map<string, { id: string }>) {
  const permissions = await prisma.permission.findMany();
  const permissionByCode = new Map<string, (typeof permissions)[number]>(
    permissions.map((permission: (typeof permissions)[number]) => [permission.code, permission])
  );

  for (const roleDef of ROLE_DEFINITIONS) {
    const role = roleMap.get(roleDef.name);
    if (!role) {
      continue;
    }

    const records = roleDef.permissions
      .map((code) => {
        const permission = permissionByCode.get(code);
        if (!permission) {
          logger.warn({ code }, "Permission introuvable pendant le bootstrap");
          return null;
        }
        return {
          roleId: role.id,
          permissionId: permission.id,
        };
      })
      .filter((value): value is { roleId: string; permissionId: string } => Boolean(value));

    if (records.length > 0) {
      await prisma.rolePermission.createMany({
        data: records,
        skipDuplicates: true,
      });
    }
  }
}

async function ensureAdminAccount(roleMap: Map<string, { id: string }>) {
  const adminEmail = env.ADMIN_EMAIL.toLowerCase();
  const adminRole = roleMap.get("admin");

  if (!adminRole) {
    logger.error("Le rôle admin est introuvable après bootstrap");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    const updates: {
      roleId?: string;
      status?: "ACTIVE";
      passwordHash?: string;
    } = {};

    if (existing.roleId !== adminRole.id || existing.status !== "ACTIVE") {
      updates.roleId = adminRole.id;
      updates.status = "ACTIVE";
    }

    const passwordMatches = await verifyPassword(existing.passwordHash, env.ADMIN_PASSWORD).catch(
      () => false
    );

    if (!passwordMatches) {
      updates.passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: existing.id },
        data: updates,
      });

      logger.info(
        { email: adminEmail, passwordReset: Boolean(updates.passwordHash) },
        "Compte administrateur synchronisé"
      );
    }

    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  await prisma.user.create({
    data: {
      firstName: env.ADMIN_FIRST_NAME,
      lastName: env.ADMIN_LAST_NAME,
      matricule: env.ADMIN_EMAIL.split("@")[0].toUpperCase(),
      email: adminEmail,
      passwordHash,
      roleId: adminRole.id,
      status: "ACTIVE",
    },
  });

  logger.info({ email: adminEmail }, "Compte administrateur initial créé");
}
