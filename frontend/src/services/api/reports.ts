import { api } from "../http";

export interface Report {
  id: string;
  title: string;
  caseNumber?: string;
  requestingService?: string;
  investigationContext?: string | null;
  urgencyLevel?: "ROUTINE" | "URGENT" | "CRITICAL" | null;
  classification?: "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET" | null;
  legalBasis?: string | null;
  keywords: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  issuedAt?: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  // Champs de validation par l'officier
  validatedAt?: string | null;
  validatedById?: string | null;
  validatorSignatureUrl?: string | null;
  validatorNotes?: string | null;
  isLocked?: boolean;
  validator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    grade?: string;
    unit?: string;
    matricule?: string;
  };
  _count?: {
    modules: number;
    entities: number;
  };
}

export interface ReportModule {
  id: string;
  type: string;
  title: string;
  position: number;
  includeInPdf: boolean;
  entityId?: string;
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  entity?: {
    id: string;
    label: string;
    type: string;
  };
}

export interface ReportStats {
  modules: number;
  entities: number;
  researchRecords: number;
  attachments: number;
  correlations: number;
}

export interface CreateReportData {
  title: string;
  caseNumber?: string;
  requestingService?: string;
  investigationContext?: string;
  urgencyLevel: "ROUTINE" | "URGENT" | "CRITICAL";
  classification: "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET";
  legalBasis?: string;
  keywords?: string[];
  isEmbargoed?: boolean;
  magistrateName?: string;
  investigatorName?: string;
  investigatorContact?: string;
}

export interface UpdateReportData extends Partial<CreateReportData> {}

// ============================================================================
// TYPES DE MODULES
// ============================================================================

// Types de modules (synchronisé avec backend)
export type ReportModuleType =
  | "summary"
  | "entities"
  | "objectives"
  | "research_summary"
  | "entity_overview"
  | "identifier_lookup"
  | "platform_analysis"
  | "media_gallery"
  | "data_retention"
  | "conclusions"
  | "investigation_leads"
  | "sign_off";

// Métadonnées pour l'affichage
export const MODULE_TYPE_METADATA: Record<
  ReportModuleType,
  { label: string; icon: string; description: string; order: number }
> = {
  summary: {
    label: "Résumé des faits",
    icon: "📋",
    description: "Bloc de texte riche décrivant le contexte et les faits",
    order: 1,
  },
  entities: {
    label: "Entités concernées",
    icon: "👥",
    description: "Liste des personnes/organisations/identifiants liés",
    order: 2,
  },
  objectives: {
    label: "Objectifs OSINT",
    icon: "🎯",
    description: "Liste des objectifs opérationnels de la recherche",
    order: 3,
  },
  research_summary: {
    label: "Résumé des recherches",
    icon: "📊",
    description: "Résultats globaux et éléments non trouvés",
    order: 4,
  },
  entity_overview: {
    label: "Vue d'ensemble d'une entité",
    icon: "🔍",
    description: "Recherches détaillées concernant une personne/organisation",
    order: 5,
  },
  identifier_lookup: {
    label: "Recherche d'identifiant",
    icon: "🔎",
    description: "Résultats pour un numéro, alias, username, email",
    order: 6,
  },
  platform_analysis: {
    label: "Analyse de plateforme",
    icon: "🌐",
    description: "Résultats sur Facebook, Instagram, X, WhatsApp, etc.",
    order: 7,
  },
  media_gallery: {
    label: "Galerie média",
    icon: "🖼️",
    description: "Collection d'images avec légendes",
    order: 8,
  },
  data_retention: {
    label: "Données sauvegardées",
    icon: "💾",
    description: "Archives de connexions, groupes, abonnements",
    order: 9,
  },
  conclusions: {
    label: "Conclusions",
    icon: "✅",
    description: "Conclusions opérationnelles de l'enquête",
    order: 10,
  },
  investigation_leads: {
    label: "Pistes d'enquête",
    icon: "🕵️",
    description: "Requisitions, plateformes à solliciter, données visées",
    order: 11,
  },
  sign_off: {
    label: "Signature",
    icon: "✍️",
    description: "Date, rédacteur, grade, unité",
    order: 12,
  },
};

// ============================================================================
// TYPES DE BASE POUR LES PAYLOADS
// ============================================================================

export type ConfidenceLevel = "confirmed" | "probable" | "possible" | "unknown";

export interface RichTextBlock {
  id: string;
  title: string;
  content: string;
}

export interface Source {
  type: "url" | "document" | "database" | "testimony";
  value: string;
  note?: string;
  accessedAt?: string;
}

// Détails spécifiques pour une personne physique
export interface PersonDetails {
  dateOfBirth?: string; // Format ISO 8601 (YYYY-MM-DD)
  nationalRegistryNumber?: string; // Numéro de Registre National (Belgique)
  physicalAddress?: string;
  phoneNumbers?: string[]; // Liste de numéros de téléphone
}

// Détails spécifiques pour une société/organisation
export interface CompanyDetails {
  bceNumber?: string; // Numéro BCE (Banque-Carrefour des Entreprises)
  headquartersAddress?: string; // Adresse du siège social
  operationalAddresses?: string[]; // Adresses d'exploitation
  phoneNumbers?: string[]; // Numéros de téléphone
  website?: string;
}

// Métadonnées enrichies pour les entités
export interface EntityMetadata {
  entityType?: 'person' | 'organization' | 'company' | 'group' | 'alias' | 'other';
  aliases?: string[];
  isVerified?: boolean;
  personDetails?: PersonDetails; // Si entityType === 'person'
  companyDetails?: CompanyDetails; // Si entityType === 'organization' | 'company'
  relatedIdentifiers?: string[]; // IDs vers IdentifierLookup
  relatedPlatforms?: string[]; // IDs vers PlatformAnalysis
  relatedMedia?: string[]; // IDs vers MediaGallery
}

export interface Finding {
  label: string;
  description: string;
  confidence?: ConfidenceLevel;
  sources: Source[];
  attachments?: string[];
  relatedEntities?: string[];
  metadata?: EntityMetadata; // Typage plus fort pour EntityOverview
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

export interface SummaryPayload {
  content: string;
}

export interface EntitiesPayload {
  entities: Array<{
    entityId: string;
    role?: string;
    notes?: string;
  }>;
}

export interface ObjectivesPayload {
  objectives: string[];
  richTextBlocks?: RichTextBlock[];
}

export interface ResearchSummaryPayload {
  summary: string;
  notFound: string[];
  methodology?: string;
  notes?: string;
  richTextBlocks?: RichTextBlock[];
}

export interface EntityOverviewPayload {
  entityId: string;
  context: string;
  findings: Finding[];
  notes?: string;
  richTextBlocks?: RichTextBlock[];
}

export interface IdentifierLookupPayload {
  identifierType: "phone" | "email" | "username" | "rrn" | "alias" | "other";
  identifierValue: string;
  findings: Finding[];
  notes?: string;
  richTextBlocks?: RichTextBlock[];
}

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
  screenshots?: string[];
  notes?: string;
}

export interface MediaGalleryPayload {
  items: MediaItem[];
  description?: string;
}

export interface DataRetentionPayload {
  datasets: Dataset[];
  richTextBlocks?: RichTextBlock[];
}

export interface ConclusionsPayload {
  statements: string[];
}

export interface InvestigationLeadsPayload {
  leads: InvestigationLead[];
  richTextBlocks?: RichTextBlock[];
}

export interface SignOffPayload {
  date: string;
  officer: Officer;
  additionalNotes?: string;
}

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

export interface CreateModuleData {
  type: ReportModuleType;
  title: string;
  entityId?: string;
  payload?: ModulePayload;
}

export const reportsApi = {
  // Rapports
  async list(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
  }) {
    const response = await api.get<{
      items: Report[];
      total: number;
      limit: number;
      offset: number;
    }>("/reports", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get<{ report: Report }>(`/reports/${id}`);
    return response.data.report;
  },

  async create(data: CreateReportData) {
    const response = await api.post<{ report: Report }>("/reports", data);
    return response.data.report;
  },

  async update(id: string, data: UpdateReportData) {
    const response = await api.patch<{ report: Report }>(`/reports/${id}`, data);
    return response.data.report;
  },

  async delete(id: string) {
    await api.delete(`/reports/${id}`);
  },

  async duplicate(id: string) {
    const response = await api.post<{ report: Report }>(`/reports/${id}/duplicate`);
    return response.data.report;
  },

  async updateStatus(id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
    const response = await api.patch<{ report: Report }>(`/reports/${id}/status`, {
      status,
    });
    return response.data.report;
  },

  async getStats(id: string) {
    const response = await api.get<{ stats: ReportStats }>(`/reports/${id}/stats`);
    return response.data.stats;
  },

  async getDashboard() {
    const response = await api.get<{
      totalReports: number;
      recentReports: Report[];
      statusDistribution: Record<string, number>;
      reportsTimeline: Array<{ date: string; count: number }>;
    }>("/reports/dashboard");
    return response.data;
  },

  // Modules
  async listModules(reportId: string) {
    const response = await api.get<{ modules: ReportModule[] }>(
      `/reports/${reportId}/modules`
    );
    return response.data.modules;
  },

  async getModule(reportId: string, moduleId: string) {
    const response = await api.get<{ module: ReportModule }>(
      `/reports/${reportId}/modules/${moduleId}`
    );
    return response.data.module;
  },

  async createModule(reportId: string, data: CreateModuleData) {
    const response = await api.post<{ module: ReportModule }>(
      `/reports/${reportId}/modules`,
      data
    );
    return response.data.module;
  },

  async updateModule(
    reportId: string,
    moduleId: string,
    data: Partial<CreateModuleData>
  ) {
    const response = await api.patch<{ module: ReportModule }>(
      `/reports/${reportId}/modules/${moduleId}`,
      data
    );
    return response.data.module;
  },

  async deleteModule(reportId: string, moduleId: string) {
    await api.delete(`/reports/${reportId}/modules/${moduleId}`);
  },

  async toggleModuleInPdf(reportId: string, moduleId: string, includeInPdf: boolean) {
    const response = await api.patch<{ module: ReportModule }>(
      `/reports/${reportId}/modules/${moduleId}`,
      { includeInPdf }
    );
    return response.data.module;
  },

  async reorderModules(reportId: string, moduleIds: string[]) {
    await api.post(`/reports/${reportId}/modules/reorder`, { moduleIds });
  },

  // Validation par l'officier
  async validateReport(reportId: string, validatorNotes?: string) {
    const response = await api.post<{ report: Report }>(
      `/reports/${reportId}/validate`,
      { validatorNotes }
    );
    return response.data.report;
  },

  async removeValidation(reportId: string) {
    const response = await api.delete<{ report: Report }>(
      `/reports/${reportId}/validate`
    );
    return response.data.report;
  },

  // Export PDF
  async exportPDF(reportId: string, watermark = true) {
    const response = await api.get(`/reports/${reportId}/export/pdf`, {
      params: { watermark: watermark ? "true" : "false" },
      responseType: "blob", // Important pour recevoir le PDF
    });
    return response.data as Blob;
  },

  async getExportInfo(reportId: string) {
    const response = await api.get<{
      available: boolean;
      formats: string[];
      filename: string;
      metadata: {
        classification: string;
        status: string;
        modulesCount: number;
        correlationsCount: number;
      };
    }>(`/reports/${reportId}/export`);
    return response.data;
  },
};
