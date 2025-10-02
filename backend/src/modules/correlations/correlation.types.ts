/**
 * Types pour le système de détection de corrélations
 */

export enum CorrelationType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  ADDRESS = 'ADDRESS',
  NAME = 'NAME',
  ACCOUNT = 'ACCOUNT',
  ORGANIZATION = 'ORGANIZATION',
}

export interface CorrelationData {
  value: string; // La valeur qui a créé la corrélation
  context?: string; // Contexte additionnel (ex: "trouvé dans module X")
  extractedFrom?: string; // Champ source (ex: "entity.phoneNumber")
}

export interface CorrelationMatch {
  reportId: string;
  reportTitle: string;
  reportNumber?: string;
  caseNumber?: string;
  correlationType: CorrelationType;
  correlationData: CorrelationData;
  confidence: number;
  createdAt: Date;
}

export interface CreateCorrelationDto {
  sourceReportId: string;
  relatedReportId: string;
  correlationType: CorrelationType;
  correlationData: CorrelationData;
  confidence: number;
  notes?: string;
}

export interface CorrelationCheckRequest {
  reportId: string;
  value: string; // Valeur à vérifier (téléphone, email, etc.)
  type: CorrelationType;
}

export interface CorrelationCheckResponse {
  found: boolean;
  matches: CorrelationMatch[];
  totalMatches: number;
}

export interface VerifyCorrelationDto {
  correlationId: string;
  userId: string;
  notes?: string;
}
