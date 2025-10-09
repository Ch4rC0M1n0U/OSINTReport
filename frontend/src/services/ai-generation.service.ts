/**
 * Service frontend pour appeler l'API de génération IA
 * avec protection automatique des données personnelles
 */

import { api } from './http';

export interface PersonalDataToProtect {
  names?: string[];
  emails?: string[];
  phones?: string[];
  birthDates?: string[];
  addresses?: string[];
  ids?: string[];
  pseudonyms?: string[];
  ipAddresses?: string[];
}

export interface AIGenerationContext {
  reportTitle?: string;
  reportType?: string;
  classification?: string;
  legalBasis?: string;
  existingContent?: string;
  moduleType?: string;
  moduleName?: string;
  entityData?: Record<string, any>;
  additionalContext?: string;
  personalData?: PersonalDataToProtect;
}

export interface AIGenerationResult {
  content: string;
  model: string;
  generatedAt: string;
}

export class AIGenerationService {
  /**
   * Génère un résumé de rapport avec protection des données personnelles
   */
  static async generateReportSummary(context: AIGenerationContext): Promise<AIGenerationResult> {
    try {
      const response = await api.post<{ data: AIGenerationResult }>('/ai/generate/summary', context);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération du résumé');
    }
  }

  /**
   * Génère du texte pour un module avec protection des données personnelles
   */
  static async generateModuleText(context: AIGenerationContext): Promise<AIGenerationResult> {
    try {
      const response = await api.post<{ data: AIGenerationResult }>('/ai/generate/module', context);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération du texte');
    }
  }

  /**
   * Génère une analyse d'entité avec protection des données personnelles
   */
  static async generateEntityAnalysis(context: AIGenerationContext): Promise<AIGenerationResult> {
    try {
      const response = await api.post<{ data: AIGenerationResult }>('/ai/generate/entity-analysis', context);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la génération de l\'analyse');
    }
  }

  /**
   * Vérifie le statut de l'IA
   */
  static async getStatus(): Promise<{ available: boolean; provider: string; model: string }> {
    try {
      const response = await api.get<{ data: { available: boolean; provider: string; model: string } }>('/ai/status');
      return response.data.data;
    } catch (error: any) {
      throw new Error('Impossible de vérifier le statut de l\'IA');
    }
  }

  /**
   * Extrait automatiquement les données personnelles d'un objet entité
   * pour faciliter l'anonymisation
   */
  static extractPersonalDataFromEntity(entity: any, entityType: string): PersonalDataToProtect {
    const personalData: PersonalDataToProtect = {
      names: [],
      emails: [],
      phones: [],
      addresses: [],
      pseudonyms: [],
    };

    if (!entity) {
      return personalData;
    }

    // Extraction selon le type d'entité
    switch (entityType.toLowerCase()) {
      case 'person':
        if (entity.name) personalData.names?.push(entity.name);
        if (entity.firstName && entity.lastName) {
          personalData.names?.push(`${entity.firstName} ${entity.lastName}`);
        }
        if (entity.email) personalData.emails?.push(entity.email);
        if (entity.phone) personalData.phones?.push(entity.phone);
        if (entity.address) personalData.addresses?.push(entity.address);
        if (entity.birthDate) personalData.birthDates?.push(entity.birthDate);
        if (entity.username) personalData.pseudonyms?.push(entity.username);
        break;

      case 'organization':
        if (entity.name) personalData.names?.push(entity.name);
        if (entity.contactEmail) personalData.emails?.push(entity.contactEmail);
        if (entity.contactPhone) personalData.phones?.push(entity.contactPhone);
        if (entity.address) personalData.addresses?.push(entity.address);
        break;

      case 'place':
        if (entity.address) personalData.addresses?.push(entity.address);
        break;

      case 'digital':
        if (entity.email) personalData.emails?.push(entity.email);
        if (entity.username) personalData.pseudonyms?.push(entity.username);
        if (entity.ipAddress) personalData.ipAddresses?.push(entity.ipAddress);
        break;
    }

    // Nettoyer les valeurs vides
    Object.keys(personalData).forEach(key => {
      const typedKey = key as keyof PersonalDataToProtect;
      if (Array.isArray(personalData[typedKey])) {
        personalData[typedKey] = personalData[typedKey]!.filter(v => v && v.trim());
        if (personalData[typedKey]!.length === 0) {
          delete personalData[typedKey];
        }
      }
    });

    return personalData;
  }

  /**
   * Exemple d'utilisation pour générer du texte d'un module personne
   */
  static async generatePersonText(person: any, existingContent?: string): Promise<string> {
    // Extraire automatiquement les données personnelles
    const personalData = this.extractPersonalDataFromEntity(person, 'person');

    // Générer le texte avec anonymisation automatique
    const result = await this.generateModuleText({
      moduleType: 'PERSON',
      moduleName: person.name || 'Personne',
      entityData: person,
      existingContent,
      personalData, // Les données seront automatiquement anonymisées
    });

    return result.content;
  }

  /**
   * Exemple d'utilisation pour générer du texte d'un module organisation
   */
  static async generateOrganizationText(org: any, existingContent?: string): Promise<string> {
    const personalData = this.extractPersonalDataFromEntity(org, 'organization');

    const result = await this.generateModuleText({
      moduleType: 'ORGANIZATION',
      moduleName: org.name || 'Organisation',
      entityData: org,
      existingContent,
      personalData,
    });

    return result.content;
  }

  /**
   * Exemple d'utilisation pour générer un résumé de rapport
   */
  static async generateReportSummaryText(
    reportData: {
      title: string;
      type: string;
      classification: string;
      legalBasis: string;
      existingContent?: string;
    },
    involvedPersons: any[] = []
  ): Promise<string> {
    // Extraire toutes les données personnelles des personnes impliquées
    const personalData: PersonalDataToProtect = {
      names: [],
      emails: [],
      phones: [],
      addresses: [],
    };

    involvedPersons.forEach(person => {
      const extracted = this.extractPersonalDataFromEntity(person, 'person');
      if (extracted.names) personalData.names?.push(...extracted.names);
      if (extracted.emails) personalData.emails?.push(...extracted.emails);
      if (extracted.phones) personalData.phones?.push(...extracted.phones);
      if (extracted.addresses) personalData.addresses?.push(...extracted.addresses);
    });

    const result = await this.generateReportSummary({
      reportTitle: reportData.title,
      reportType: reportData.type,
      classification: reportData.classification,
      legalBasis: reportData.legalBasis,
      existingContent: reportData.existingContent,
      personalData,
    });

    return result.content;
  }
}
