import { PermissionCode } from "@modules/auth/auth.constants";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      firstName: string;
      lastName: string;
      matricule: string;
      email: string;
      phone: string | null;
      grade: string | null;
      avatarUrl: string | null;
      signatureUrl: string | null;
      timezone: string | null;
      dateFormat: string | null;
      firstDayOfWeek: string | null;
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
