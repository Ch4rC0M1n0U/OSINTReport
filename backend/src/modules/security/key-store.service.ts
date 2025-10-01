import { randomUUID } from "node:crypto";

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@shared/prisma";
import { CryptoEngine, unwrapCipherPayload, wrapCipherPayload } from "@shared/crypto";

type DbClient = PrismaClient | Prisma.TransactionClient;

type KeyStoreRecord = Awaited<ReturnType<typeof prisma.keyStore.create>>;

export type ActiveKey = {
  record: KeyStoreRecord;
  secret: Buffer;
};

const MASTER_KEY_ID = "master";

export class KeyStoreService {
  private static cache = new Map<string, Buffer>();
  private static activeCache?: ActiveKey;

  private static getClient(client?: Prisma.TransactionClient): DbClient {
    return (client ?? prisma) as DbClient;
  }

  private static buildLabel(label?: string) {
    return label ?? `key-${new Date().toISOString()}-${randomUUID()}`;
  }

  private static decryptDataKey(record: KeyStoreRecord): Buffer {
    const payload = unwrapCipherPayload(record.encryptedKey);
    if (!payload) {
      throw new Error("Clé chiffrée invalide (format inconnu)");
    }

    if (payload.keyId !== MASTER_KEY_ID) {
      throw new Error("Clé chiffrée avec un identifiant maître incompatible");
    }

    const secret = CryptoEngine.decryptBuffer(
      {
        iv: payload.iv,
        authTag: payload.authTag,
        cipherText: payload.cipherText,
      },
      CryptoEngine.masterKey
    );

    if (secret.length !== 32) {
      throw new Error("La clé dérivée ne fait pas 32 octets");
    }

    return secret;
  }

  private static async createKey(client: DbClient, label?: string): Promise<KeyStoreRecord> {
    const dataKey = CryptoEngine.generateDataKey();
    const encryptedKey = wrapCipherPayload(
      MASTER_KEY_ID,
      CryptoEngine.encryptBuffer(dataKey, CryptoEngine.masterKey)
    );

    return client.keyStore.create({
      data: {
        label: this.buildLabel(label),
        encryptedKey,
        active: true,
      },
    });
  }

  static async getActiveKey(client?: Prisma.TransactionClient): Promise<ActiveKey> {
    if (this.activeCache) {
      return this.activeCache;
    }

    const db = this.getClient(client);
    let record = await db.keyStore.findFirst({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      record = await this.createKey(db);
    }

    const cached = this.cache.get(record.id);
    const secret = cached ?? this.decryptDataKey(record);

    if (!cached) {
      this.cache.set(record.id, secret);
    }

    this.activeCache = { record, secret };
    return { record, secret };
  }

  static async getKeyById(keyId: string, client?: Prisma.TransactionClient): Promise<ActiveKey> {
    const db = this.getClient(client);
    const cachedSecret = this.cache.get(keyId);

    const record = await db.keyStore.findUnique({ where: { id: keyId } });
    if (!record) {
      throw new Error(`Clé ${keyId} introuvable`);
    }

    const secret = cachedSecret ?? this.decryptDataKey(record as KeyStoreRecord);

    if (!cachedSecret) {
      this.cache.set(record.id, secret);
    }

    if (record.active) {
      this.activeCache = { record: record as KeyStoreRecord, secret };
    }

    return { record: record as KeyStoreRecord, secret };
  }

  static async rotateActiveKey(label?: string): Promise<ActiveKey> {
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.keyStore.updateMany({
        where: { active: true },
        data: {
          active: false,
          rotatedAt: new Date(),
        },
      });

      const record = await this.createKey(tx, label);
      const secret = this.decryptDataKey(record);

      this.cache.set(record.id, secret);
      this.activeCache = { record, secret };

      return { record, secret };
    });
  }

  static resetCache() {
    this.cache.clear();
    this.activeCache = undefined;
  }
}
