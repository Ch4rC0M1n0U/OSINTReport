import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@shared/prisma";
import { CryptoEngine, unwrapCipherPayload, wrapCipherPayload } from "@shared/crypto";

import { KeyStoreService } from "./key-store.service";

type DbClient = PrismaClient | Prisma.TransactionClient;

type VaultItemRecord = Awaited<ReturnType<typeof prisma.vaultItem.create>>;

type StoreOptions = {
  expiresAt?: Date | null;
};

const POINTER_PREFIX = "vault:";

export class VaultService {
  private static getClient(client?: Prisma.TransactionClient): DbClient {
    return (client ?? prisma) as DbClient;
  }

  static buildPointer(id: string) {
    return `${POINTER_PREFIX}${id}`;
  }

  static isPointer(value: string) {
    return value.startsWith(POINTER_PREFIX);
  }

  static extractId(pointer: string) {
    return pointer.slice(POINTER_PREFIX.length);
  }

  static async storeString(
    reportId: string,
    field: string,
    value: string,
    options: StoreOptions = {},
    client?: Prisma.TransactionClient
  ): Promise<VaultItemRecord> {
    const db = this.getClient(client);
    const { record: keyRecord, secret } = await KeyStoreService.getActiveKey(client);

    const components = CryptoEngine.encryptBuffer(Buffer.from(value, "utf8"), secret);
    const cipherText = wrapCipherPayload(keyRecord.id, components);

    return db.vaultItem.create({
      data: {
        reportId,
        field,
        keyId: keyRecord.id,
        cipherText,
        expiresAt: options.expiresAt ?? null,
      },
    });
  }

  static async storeJson(
    reportId: string,
    field: string,
    value: Record<string, unknown>,
    options: StoreOptions = {},
    client?: Prisma.TransactionClient
  ): Promise<VaultItemRecord> {
    const serialized = JSON.stringify(value);
    return this.storeString(reportId, field, serialized, options, client);
  }

  static async reveal(pointer: string, client?: Prisma.TransactionClient): Promise<Buffer> {
    if (!this.isPointer(pointer)) {
      throw new Error("Valeur fournie qui n'est pas un pointeur de coffre");
    }

    const id = this.extractId(pointer);
    const db = this.getClient(client);

    const record = await db.vaultItem.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`Élément de coffre ${id} introuvable`);
    }

    const serialized = unwrapCipherPayload(record.cipherText);
    if (!serialized) {
      throw new Error("Payload chiffré invalide pour l'élément de coffre");
    }

    const { secret } = await KeyStoreService.getKeyById(record.keyId, client);
    return CryptoEngine.decryptBuffer(
      {
        iv: serialized.iv,
        authTag: serialized.authTag,
        cipherText: serialized.cipherText,
      },
      secret
    );
  }

  static async revealString(pointer: string, client?: Prisma.TransactionClient): Promise<string> {
    const buffer = await this.reveal(pointer, client);
    return buffer.toString("utf8");
  }

  static async revealJson<T = Record<string, unknown>>(
    pointer: string,
    client?: Prisma.TransactionClient
  ): Promise<T> {
    const content = await this.revealString(pointer, client);
    return JSON.parse(content) as T;
  }

  static async deletePointer(pointer: string, client?: Prisma.TransactionClient) {
    if (!this.isPointer(pointer)) {
      return;
    }

    const id = this.extractId(pointer);
    const db = this.getClient(client);

    await db.vaultItem.deleteMany({ where: { id } });
  }

  static async deleteById(id: string, client?: Prisma.TransactionClient) {
    const db = this.getClient(client);
    await db.vaultItem.deleteMany({ where: { id } });
  }
}
