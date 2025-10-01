import argon2 from "argon2";
import { env } from "@config/env";

const defaultOptions: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: env.PASSWORD_SALT_ROUNDS ?? 3,
  parallelism: 1,
};

async function hashValue(plain: string): Promise<string> {
  return argon2.hash(plain, defaultOptions);
}

async function verifyValue(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain, defaultOptions);
  } catch (error) {
    return false;
  }
}

export const hashPassword = hashValue;
export const verifyPassword = verifyValue;
export const hashSecret = hashValue;
export const verifySecret = verifyValue;
