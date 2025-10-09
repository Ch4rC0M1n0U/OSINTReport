/**
 * Service de sanitization des données pour la protection de la vie privée
 * Anonymise les données personnelles avant envoi aux APIs IA
 */

import { logger } from '@/config/logger';

// Types de données personnelles à anonymiser
export interface PersonalData {
  names?: string[];           // Noms et prénoms
  emails?: string[];          // Adresses email
  phones?: string[];          // Numéros de téléphone
  birthDates?: string[];      // Dates de naissance
  addresses?: string[];       // Adresses postales
  ids?: string[];            // Identifiants (SIREN, NIR, etc.)
  pseudonyms?: string[];     // Pseudos, usernames
  ipAddresses?: string[];    // Adresses IP
}

// Mapping pour remplacer les données réelles par des placeholders
interface SanitizationMap {
  [key: string]: string;
}

export class DataSanitizerService {
  /**
   * Anonymise un texte en remplaçant les données personnelles par des placeholders
   */
  static sanitizeText(text: string, personalData: PersonalData): { sanitized: string; map: SanitizationMap } {
    if (!text) {
      return { sanitized: '', map: {} };
    }

    let sanitized = text;
    const map: SanitizationMap = {};
    let counter = {
      person: 1,
      email: 1,
      phone: 1,
      date: 1,
      address: 1,
      id: 1,
      pseudo: 1,
      ip: 1,
    };

    // Anonymiser les noms et prénoms
    if (personalData.names?.length) {
      personalData.names.forEach(name => {
        if (name && name.trim()) {
          const placeholder = `[PERSONNE_${counter.person}]`;
          sanitized = this.replaceAll(sanitized, name, placeholder);
          map[placeholder] = name;
          counter.person++;
        }
      });
    }

    // Anonymiser les emails
    if (personalData.emails?.length) {
      personalData.emails.forEach(email => {
        if (email && email.trim()) {
          const placeholder = `[EMAIL_${counter.email}]`;
          sanitized = this.replaceAll(sanitized, email, placeholder);
          map[placeholder] = email;
          counter.email++;
        }
      });
    }

    // Anonymiser les téléphones
    if (personalData.phones?.length) {
      personalData.phones.forEach(phone => {
        if (phone && phone.trim()) {
          const placeholder = `[TELEPHONE_${counter.phone}]`;
          sanitized = this.replaceAll(sanitized, phone, placeholder);
          map[placeholder] = phone;
          counter.phone++;
        }
      });
    }

    // Anonymiser les dates de naissance
    if (personalData.birthDates?.length) {
      personalData.birthDates.forEach(date => {
        if (date && date.trim()) {
          const placeholder = `[DATE_NAISSANCE_${counter.date}]`;
          sanitized = this.replaceAll(sanitized, date, placeholder);
          map[placeholder] = date;
          counter.date++;
        }
      });
    }

    // Anonymiser les adresses
    if (personalData.addresses?.length) {
      personalData.addresses.forEach(address => {
        if (address && address.trim()) {
          const placeholder = `[ADRESSE_${counter.address}]`;
          sanitized = this.replaceAll(sanitized, address, placeholder);
          map[placeholder] = address;
          counter.address++;
        }
      });
    }

    // Anonymiser les identifiants
    if (personalData.ids?.length) {
      personalData.ids.forEach(id => {
        if (id && id.trim()) {
          const placeholder = `[IDENTIFIANT_${counter.id}]`;
          sanitized = this.replaceAll(sanitized, id, placeholder);
          map[placeholder] = id;
          counter.id++;
        }
      });
    }

    // Anonymiser les pseudonymes
    if (personalData.pseudonyms?.length) {
      personalData.pseudonyms.forEach(pseudo => {
        if (pseudo && pseudo.trim()) {
          const placeholder = `[PSEUDO_${counter.pseudo}]`;
          sanitized = this.replaceAll(sanitized, pseudo, placeholder);
          map[placeholder] = pseudo;
          counter.pseudo++;
        }
      });
    }

    // Anonymiser les adresses IP
    if (personalData.ipAddresses?.length) {
      personalData.ipAddresses.forEach(ip => {
        if (ip && ip.trim()) {
          const placeholder = `[IP_${counter.ip}]`;
          sanitized = this.replaceAll(sanitized, ip, placeholder);
          map[placeholder] = ip;
          counter.ip++;
        }
      });
    }

    logger.debug(
      { 
        originalLength: text.length, 
        sanitizedLength: sanitized.length,
        replacements: Object.keys(map).length 
      }, 
      'Texte anonymisé'
    );

    return { sanitized, map };
  }

  /**
   * Restaure les données personnelles dans un texte généré par l'IA
   */
  static desanitizeText(text: string, map: SanitizationMap): string {
    if (!text || !map || Object.keys(map).length === 0) {
      return text;
    }

    let desanitized = text;

    // Remplacer les placeholders par les vraies données
    Object.keys(map).forEach(placeholder => {
      const realValue = map[placeholder];
      desanitized = this.replaceAll(desanitized, placeholder, realValue);
    });

    logger.debug(
      { 
        sanitizedLength: text.length,
        desanitizedLength: desanitized.length,
        restorations: Object.keys(map).length 
      }, 
      'Texte restauré'
    );

    return desanitized;
  }

  /**
   * Anonymise un objet de contexte de génération
   */
  static sanitizeContext(context: any, personalData: PersonalData): { sanitized: any; map: SanitizationMap } {
    const sanitized = { ...context };
    let globalMap: SanitizationMap = {};

    // Parcourir toutes les propriétés et anonymiser les strings
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];

      if (typeof value === 'string') {
        const { sanitized: sanitizedValue, map } = this.sanitizeText(value, personalData);
        sanitized[key] = sanitizedValue;
        globalMap = { ...globalMap, ...map };
      } else if (value && typeof value === 'object') {
        // Anonymiser récursivement les objets
        const { sanitized: sanitizedObj, map } = this.sanitizeObject(value, personalData);
        sanitized[key] = sanitizedObj;
        globalMap = { ...globalMap, ...map };
      }
    });

    return { sanitized, map: globalMap };
  }

  /**
   * Anonymise un objet de manière récursive
   */
  private static sanitizeObject(obj: any, personalData: PersonalData): { sanitized: any; map: SanitizationMap } {
    if (Array.isArray(obj)) {
      let globalMap: SanitizationMap = {};
      const sanitized = obj.map(item => {
        if (typeof item === 'string') {
          const { sanitized: sanitizedValue, map } = this.sanitizeText(item, personalData);
          globalMap = { ...globalMap, ...map };
          return sanitizedValue;
        } else if (item && typeof item === 'object') {
          const { sanitized: sanitizedItem, map } = this.sanitizeObject(item, personalData);
          globalMap = { ...globalMap, ...map };
          return sanitizedItem;
        }
        return item;
      });
      return { sanitized, map: globalMap };
    }

    const sanitized: any = {};
    let globalMap: SanitizationMap = {};

    Object.keys(obj).forEach(key => {
      const value = obj[key];
      
      if (typeof value === 'string') {
        const { sanitized: sanitizedValue, map } = this.sanitizeText(value, personalData);
        sanitized[key] = sanitizedValue;
        globalMap = { ...globalMap, ...map };
      } else if (value && typeof value === 'object') {
        const { sanitized: sanitizedObj, map } = this.sanitizeObject(value, personalData);
        sanitized[key] = sanitizedObj;
        globalMap = { ...globalMap, ...map };
      } else {
        sanitized[key] = value;
      }
    });

    return { sanitized, map: globalMap };
  }

  /**
   * Détecte automatiquement les emails dans un texte
   */
  static detectEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Détecte automatiquement les numéros de téléphone français
   */
  static detectPhones(text: string): string[] {
    const phoneRegex = /(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g;
    return text.match(phoneRegex) || [];
  }

  /**
   * Détecte automatiquement les adresses IP
   */
  static detectIPs(text: string): string[] {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    return text.match(ipRegex) || [];
  }

  /**
   * Détection automatique de données sensibles dans un texte
   */
  static autoDetect(text: string): PersonalData {
    return {
      emails: this.detectEmails(text),
      phones: this.detectPhones(text),
      ipAddresses: this.detectIPs(text),
    };
  }

  /**
   * Remplace toutes les occurrences (case-insensitive)
   */
  private static replaceAll(text: string, search: string, replace: string): string {
    // Échapper les caractères spéciaux regex
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    return text.replace(regex, replace);
  }

  /**
   * Valide qu'un texte ne contient plus de données personnelles
   */
  static validateSanitization(text: string, personalData: PersonalData): { isClean: boolean; foundData: string[] } {
    const foundData: string[] = [];

    // Vérifier les noms
    personalData.names?.forEach(name => {
      if (name && text.toLowerCase().includes(name.toLowerCase())) {
        foundData.push(`Nom: ${name}`);
      }
    });

    // Vérifier les emails
    personalData.emails?.forEach(email => {
      if (email && text.toLowerCase().includes(email.toLowerCase())) {
        foundData.push(`Email: ${email}`);
      }
    });

    // Vérifier les téléphones
    personalData.phones?.forEach(phone => {
      if (phone && text.includes(phone)) {
        foundData.push(`Téléphone: ${phone}`);
      }
    });

    // Vérifier les dates de naissance
    personalData.birthDates?.forEach(date => {
      if (date && text.includes(date)) {
        foundData.push(`Date: ${date}`);
      }
    });

    // Vérifier les identifiants
    personalData.ids?.forEach(id => {
      if (id && text.includes(id)) {
        foundData.push(`ID: ${id}`);
      }
    });

    if (foundData.length > 0) {
      logger.warn({ foundData }, 'Données personnelles détectées dans le texte sanitizé !');
    }

    return {
      isClean: foundData.length === 0,
      foundData,
    };
  }
}
