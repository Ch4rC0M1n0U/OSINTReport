import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  type CipherGCM,
  type DecipherGCM,
} from "node:crypto";

import { env } from "@config/env";

const ENCRYPTION_PREFIX = "enc::";
const ENCRYPTION_VERSION = 1;

const masterKey = Buffer.from(env.CRYPTO_MASTER_KEY, "hex");

if (masterKey.length !== 32) {
  throw new Error(
    "CRYPTO_MASTER_KEY doit représenter 32 octets (64 caractères hexadécimaux) pour aes-256-gcm"
  );
}

export type CipherComponents = {
  iv: string;
  authTag: string;
  cipherText: string;
};

export type SerializedCipher = {
  v: number;
  keyId: string;
  iv: string;
  authTag: string;
  cipherText: string;
};

export class CryptoEngine {
  static get algorithm() {
    return env.CRYPTO_ALGO;
  }

  static get masterKey(): Buffer {
    return masterKey;
  }

  static generateDataKey(): Buffer {
    return randomBytes(32);
  }

  static encryptBuffer(plain: Buffer, key: Buffer): CipherComponents {
    const iv = randomBytes(12);
    const cipher = createCipheriv(CryptoEngine.algorithm, key, iv) as CipherGCM;
    const cipherText = Buffer.concat([cipher.update(plain), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      cipherText: cipherText.toString("base64"),
    };
  }

  static decryptBuffer(payload: CipherComponents, key: Buffer): Buffer {
    const iv = Buffer.from(payload.iv, "base64");
    const authTag = Buffer.from(payload.authTag, "base64");
    const cipherText = Buffer.from(payload.cipherText, "base64");

    const decipher = createDecipheriv(CryptoEngine.algorithm, key, iv) as DecipherGCM;
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    return decrypted;
  }

  static serializeEnvelope(envelope: SerializedCipher): string {
    const json = JSON.stringify(envelope);
    return `${ENCRYPTION_PREFIX}${Buffer.from(json, "utf8").toString("base64")}`;
  }

  static deserializeEnvelope(value: string): SerializedCipher | null {
    if (!value.startsWith(ENCRYPTION_PREFIX)) {
      return null;
    }

    const payload = value.slice(ENCRYPTION_PREFIX.length);
    const decoded = Buffer.from(payload, "base64").toString("utf8");

    const parsed = JSON.parse(decoded) as SerializedCipher;
    if (!parsed || typeof parsed !== "object" || parsed.v !== ENCRYPTION_VERSION) {
      throw new Error("Version de payload chiffré incompatible");
    }

    if (!parsed.keyId || !parsed.iv || !parsed.authTag || !parsed.cipherText) {
      throw new Error("Payload chiffré invalide");
    }

    return parsed;
  }
}

export function wrapCipherPayload(keyId: string, components: CipherComponents): string {
  return CryptoEngine.serializeEnvelope({
    v: ENCRYPTION_VERSION,
    keyId,
    iv: components.iv,
    authTag: components.authTag,
    cipherText: components.cipherText,
  });
}

export function unwrapCipherPayload(value: string): SerializedCipher | null {
  return CryptoEngine.deserializeEnvelope(value);
}
