import { PermissionCode } from "./auth.constants";

export type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
};

export type SessionResult = {
  accessToken: string;
  refreshToken: string;
  refreshTokenJti: string;
  sessionId: string;
  expiresAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    roleId: string;
    roleName: string;
    permissions: PermissionCode[];
  };
};
