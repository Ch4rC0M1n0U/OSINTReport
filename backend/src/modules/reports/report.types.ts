/**
 * Types pour les modules de rapport OSINT
 * Conformes au template documenté dans docs/report-template.md
 */

// ============================================================================
// TYPES DE BASE
// ============================================================================

export type ConfidenceLevel = "confirmed" | "probable" | "possible" | "unknown";

export interface Source {
  type: "url" | "document" | "database" | "testimony";
  value: string;
  note?: string;
  accessedAt?: string;
}

export interface Finding {
  label: string;
  description: string;
  confidence?: ConfidenceLevel;
  sources: Source[];
  attachments?: string[]; // UUIDs des attachements
  relatedEntities?: string[]; // UUIDs des entités liées
  metadata?: Record<string, any>;
}

export interface MediaItem {
  attachmentId: string;
  caption: string;
  date?: string;
  source?: string;
}

export interface Dataset {
  label: string;
  description: string;
  retentionPolicy: string;
  location?: string;
}

export interface InvestigationLead {
  type: "requisition" | "platform_contact" | "follow_up";
  platform?: string;
  legalBasis?: string;
  dataTargeted?: string[];
  priority?: "low" | "medium" | "high";
  notes?: string;
}

export interface Officer {
  name: string;
  rank: string;
  unit: string;
  badgeNumber?: string;
}

// ============================================================================
// PAYLOADS PAR TYPE DE MODULE
// ============================================================================

/**
 * Module: Résumé des faits
 * Bloc de texte riche décrivant le contexte
 */
export interface SummaryPayload {
  content: string; // Markdown ou HTML
}

/**
 * Module: Entités concernées
 * Liste des personnes/organisations/identifiants liés
 */
export interface EntitiesPayload {
  entities: Array<{
    entityId: string;
    role?: string;
    notes?: string;
  }>;
}

/**
 * Module: Objectifs OSINT
 * Liste des objectifs opérationnels
 */
export interface ObjectivesPayload {
  objectives: string[];
}

/**
 * Module: Résumé des recherches
 * Résultats globaux et éléments non trouvés
 */
export interface ResearchSummaryPayload {
  summary: string;
  notFound: string[];
  methodology?: string;
  notes?: string;
}

/**
 * Module: Vue d'ensemble d'une entité
 * Recherches détaillées concernant une personne/organisation
 */
export interface EntityOverviewPayload {
  entityId: string;
  context: string;
  findings: Finding[];
  notes?: string;
}

/**
 * Module: Recherche d'identifiant
 * Résultats pour un numéro, alias, username, email
 */
export interface IdentifierLookupPayload {
  identifierType: "phone" | "email" | "username" | "rrn" | "alias" | "other";
  identifierValue: string;
  findings: Finding[];
  notes?: string;
}

/**
 * Module: Analyse de plateforme
 * Résultats sur Facebook, Instagram, X, WhatsApp, etc.
 */
export interface PlatformAnalysisPayload {
  platform:
    | "facebook"
    | "instagram"
    | "x"
    | "whatsapp"
    | "telegram"
    | "linkedin"
    | "tiktok"
    | "snapchat"
    | "other";
  platformUrl?: string;
  findings: Finding[];
  screenshots?: string[]; // UUIDs des captures d'écran
  notes?: string;
}

/**
 * Module: Galerie média
 * Collection d'images avec légendes
 */
export interface MediaGalleryPayload {
  items: MediaItem[];
  description?: string;
}

/**
 * Module: Données sauvegardées
 * Archives de connexions, groupes, abonnements
 */
export interface DataRetentionPayload {
  datasets: Dataset[];
}

/**
 * Module: Conclusions
 * Conclusions opérationnelles de l'enquête
 */
export interface ConclusionsPayload {
  statements: string[];
}

/**
 * Module: Pistes d'enquête
 * Requisitions, plateformes à solliciter, données visées
 */
export interface InvestigationLeadsPayload {
  leads: InvestigationLead[];
}

/**
 * Module: Signature
 * Date, rédacteur, grade, unité
 */
export interface SignOffPayload {
  date: string;
  officer: Officer;
  additionalNotes?: string;
}

// ============================================================================
// UNION TYPE POUR TOUS LES PAYLOADS
// ============================================================================

export type ModulePayload =
  | SummaryPayload
  | EntitiesPayload
  | ObjectivesPayload
  | ResearchSummaryPayload
  | EntityOverviewPayload
  | IdentifierLookupPayload
  | PlatformAnalysisPayload
  | MediaGalleryPayload
  | DataRetentionPayload
  | ConclusionsPayload
  | InvestigationLeadsPayload
  | SignOffPayload;

// ============================================================================
// HELPERS DE TYPE
// ============================================================================

/**
 * Map type de module -> payload
 */
export type PayloadForModuleType<T extends string> = T extends "summary"
  ? SummaryPayload
  : T extends "entities"
  ? EntitiesPayload
  : T extends "objectives"
  ? ObjectivesPayload
  : T extends "research_summary"
  ? ResearchSummaryPayload
  : T extends "entity_overview"
  ? EntityOverviewPayload
  : T extends "identifier_lookup"
  ? IdentifierLookupPayload
  : T extends "platform_analysis"
  ? PlatformAnalysisPayload
  : T extends "media_gallery"
  ? MediaGalleryPayload
  : T extends "data_retention"
  ? DataRetentionPayload
  : T extends "conclusions"
  ? ConclusionsPayload
  : T extends "investigation_leads"
  ? InvestigationLeadsPayload
  : T extends "sign_off"
  ? SignOffPayload
  : never;
