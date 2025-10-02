import { z } from "zod";

export const USER_STATUS_VALUES = ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;

const userStatusEnum = z.enum(USER_STATUS_VALUES);

export const listUsersQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    search: z.string().trim().min(2).optional(),
  status: userStatusEnum.optional(),
    roleId: z.string().trim().min(1).optional(),
  })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const createUserSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().toLowerCase().email(),
    matricule: z.string().trim().min(3),
    roleId: z.string().trim().min(1),
  status: userStatusEnum.optional(),
    password: z.string().min(12).max(128).optional(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().min(1).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    matricule: z.string().trim().min(3).optional(),
    roleId: z.string().trim().min(1).optional(),
  status: userStatusEnum.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Aucune mise à jour fournie",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(12).max(128).optional(),
  })
  .strict();

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});
