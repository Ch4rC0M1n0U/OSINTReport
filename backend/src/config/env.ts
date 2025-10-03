import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

const candidateEnvFiles = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env.local"),
  path.resolve(__dirname, "../../.env")
];

candidateEnvFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath });
  }
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("4000")
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().min(0)),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL doit être une URL valide" }),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET doit contenir au moins 32 caractères"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET doit contenir au moins 32 caractères"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  COOKIE_DOMAIN: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  BACKEND_URL: z.string().default("http://localhost:4000"),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12, "ADMIN_PASSWORD doit contenir au moins 12 caractères"),
  ADMIN_FIRST_NAME: z.string().default("Admin"),
  ADMIN_LAST_NAME: z.string().default("Police"),
  CRYPTO_MASTER_KEY: z.string().min(64, "CRYPTO_MASTER_KEY doit être une clé hex de 64 caractères minimum"),
  CRYPTO_ALGO: z.string().default("aes-256-gcm"),
  PASSWORD_SALT_ROUNDS: z
    .string()
    .optional()
    .transform((val) => (val ? Number.parseInt(val, 10) : undefined)),
  MEILISEARCH_HOST: z.string().default("http://localhost:7700"),
  MEILISEARCH_API_KEY: z.string().default("masterKey"),
});

export type Env = z.infer<typeof envSchema> & {
  PASSWORD_SALT_ROUNDS?: number;
};

export const env: Env = envSchema.parse(process.env);

export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
export const isDev = env.NODE_ENV === "development";
