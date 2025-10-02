import { z } from "zod";

export const smtpConfigSchema = z
  .object({
    host: z.string().min(1, "L'hôte SMTP est requis"),
    port: z.number().int().min(1).max(65535),
    secure: z.boolean().default(true),
    username: z.string().min(1, "Le nom d'utilisateur est requis"),
    password: z.string().min(1, "Le mot de passe est requis"),
    fromEmail: z.string().email("Email d'expéditeur invalide"),
    fromName: z.string().optional(),
    active: z.boolean().default(true),
  })
  .strict();

export type SmtpConfigInput = z.infer<typeof smtpConfigSchema>;

export const smtpTestSchema = z
  .object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    secure: z.boolean(),
    username: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

export type SmtpTestInput = z.infer<typeof smtpTestSchema>;
