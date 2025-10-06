export enum PermissionCode {
  REPORTS_READ = "reports:read",
  REPORTS_WRITE = "reports:write",
  USERS_READ = "users:read",
  USERS_WRITE = "users:write",
  ADMIN = "system:admin",
  SYSTEM_SETTINGS = "system:settings",
}

export type RoleDefinition = {
  id: string;
  name: string;
  description: string;
  permissions: PermissionCode[];
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    id: "role-admin",
    name: "admin",
    description: "Accès complet à toutes les fonctionnalités et administration.",
    permissions: [
      PermissionCode.REPORTS_READ,
      PermissionCode.REPORTS_WRITE,
      PermissionCode.USERS_READ,
      PermissionCode.USERS_WRITE,
      PermissionCode.ADMIN,
      PermissionCode.SYSTEM_SETTINGS,
    ],
  },
  {
    id: "role-editor",
    name: "editor",
    description: "Création et modification des rapports.",
    permissions: [
      PermissionCode.REPORTS_READ,
      PermissionCode.REPORTS_WRITE,
    ],
  },
  {
    id: "role-reader",
    name: "reader",
    description: "Consultation des rapports.",
    permissions: [PermissionCode.REPORTS_READ],
  },
];
