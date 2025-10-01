import { PermissionCode } from "@modules/auth/auth.constants";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roleId: string;
      roleName: string;
      permissions: PermissionCode[];
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
