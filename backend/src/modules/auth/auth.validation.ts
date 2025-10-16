import { z } from "zod";

const policeEmailDomain = "@police.belgium.eu";

export const registerSchema = z
  .object({
    firstName: z.string().min(2).max(100),
    lastName: z.string().min(2).max(100),
    matricule: z.string().min(4).max(50).regex(/^[A-Z0-9-]+$/, {
      message: "Le matricule doit contenir des lettres majuscules, chiffres ou tirets",
    }),
    email: z.string().email().refine((value) => value.toLowerCase().endsWith(policeEmailDomain), {
      message: "L'adresse email doit appartenir au domaine @police.belgium.eu",
    }),
    phone: z
      .string()
      .regex(/^[\d\s\+\-\(\)]+$/, {
        message: "Le numéro de téléphone contient des caractères invalides",
      })
      .optional()
      .or(z.literal("")),
    grade: z
      .enum([
        "Inspecteur",
        "Premier Inspecteur",
        "Inspecteur principal",
        "Premier Inspecteur Principal",
        "Commissaire",
        "Premier Commissaire",
      ])
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(12)
      .regex(/[A-Z]/, { message: "Le mot de passe doit contenir au moins une majuscule" })
      .regex(/[a-z]/, { message: "Le mot de passe doit contenir au moins une minuscule" })
      .regex(/[0-9]/, { message: "Le mot de passe doit contenir au moins un chiffre" })
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, {
        message: "Le mot de passe doit contenir au moins un caractère spécial",
      }),
    role: z.enum(["admin", "editor", "reader"]).optional().default("reader"),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: registerSchema.shape.password,
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: registerSchema.shape.password,
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
