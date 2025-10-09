/**
 * Service de chiffrement pour les clés API
 * Utilise AES-256-GCM pour chiffrer les clés de manière sécurisée
 */

import crypto from 'crypto';
import { logger } from '@/config/logger';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

export class ApiKeyEncryption {
  private static masterKey: Buffer | null = null;

  /**
   * Initialiser la clé master depuis les variables d'environnement
   */
  static initialize(): void {
    const masterKeyHex = process.env.API_KEY_ENCRYPTION_KEY;

    if (!masterKeyHex) {
      logger.warn('API_KEY_ENCRYPTION_KEY non définie, génération automatique (non sécurisé pour production)');
      // En production, cette clé devrait être définie dans les variables d'environnement
      this.masterKey = crypto.randomBytes(KEY_LENGTH);
      return;
    }

    try {
      this.masterKey = Buffer.from(masterKeyHex, 'hex');
      
      if (this.masterKey.length !== KEY_LENGTH) {
        throw new Error(`La clé doit faire ${KEY_LENGTH} bytes (64 caractères hex)`);
      }

      logger.info('Clé de chiffrement des API keys initialisée');
    } catch (error) {
      logger.error({ error }, 'Erreur lors de l\'initialisation de la clé de chiffrement');
      throw error;
    }
  }

  /**
   * Générer une nouvelle clé master (à utiliser en développement uniquement)
   */
  static generateMasterKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  }

  /**
   * Chiffrer une clé API
   */
  static encrypt(plaintext: string): string {
    if (!this.masterKey) {
      this.initialize();
    }

    if (!this.masterKey) {
      throw new Error('Clé de chiffrement non initialisée');
    }

    try {
      // Générer un IV aléatoire
      const iv = crypto.randomBytes(IV_LENGTH);

      // Créer le cipher
      const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

      // Chiffrer
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Récupérer le tag d'authentification
      const authTag = cipher.getAuthTag();

      // Combiner IV + AuthTag + Encrypted dans un seul string
      // Format: IV(32 hex chars) + AuthTag(32 hex chars) + Encrypted
      const combined = iv.toString('hex') + authTag.toString('hex') + encrypted;

      return combined;
    } catch (error) {
      logger.error({ error }, 'Erreur lors du chiffrement de la clé API');
      throw new Error('Erreur de chiffrement');
    }
  }

  /**
   * Déchiffrer une clé API
   */
  static decrypt(ciphertext: string): string {
    if (!this.masterKey) {
      this.initialize();
    }

    if (!this.masterKey) {
      throw new Error('Clé de chiffrement non initialisée');
    }

    try {
      // Extraire IV, AuthTag et données chiffrées
      const ivHex = ciphertext.slice(0, IV_LENGTH * 2);
      const authTagHex = ciphertext.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2);
      const encryptedHex = ciphertext.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Créer le decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      // Déchiffrer
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error({ error }, 'Erreur lors du déchiffrement de la clé API');
      throw new Error('Erreur de déchiffrement');
    }
  }

  /**
   * Masquer une clé API pour l'affichage (affiche seulement les 4 derniers caractères)
   */
  static mask(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '••••••••';
    }
    const visibleChars = 4;
    const maskedLength = apiKey.length - visibleChars;
    return '•'.repeat(maskedLength) + apiKey.slice(-visibleChars);
  }

  /**
   * Valider le format d'une clé API Gemini
   */
  static validateGeminiKey(apiKey: string): boolean {
    // Les clés Gemini commencent généralement par "AIza"
    return apiKey.startsWith('AIza') && apiKey.length > 30;
  }

  /**
   * Valider le format d'une clé API OpenAI
   */
  static validateOpenAIKey(apiKey: string): boolean {
    // Les clés OpenAI commencent par "sk-"
    return apiKey.startsWith('sk-') && apiKey.length > 40;
  }

  /**
   * Valider le format d'une clé API Claude
   */
  static validateClaudeKey(apiKey: string): boolean {
    // Les clés Claude commencent par "sk-ant-"
    return apiKey.startsWith('sk-ant-') && apiKey.length > 95;
  }
}

// Initialiser au chargement du module
ApiKeyEncryption.initialize();
