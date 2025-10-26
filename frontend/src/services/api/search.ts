/**
 * API client pour le service de recherche Meilisearch
 */

import type { AxiosInstance } from "axios";
import { api } from "../http";

/**
 * Options de recherche pour les rapports
 */
export interface SearchOptions {
  /** Terme de recherche (texte libre) */
  q?: string;
  /** Filtrer par statut du rapport */
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** Filtrer par niveau d'urgence */
  urgencyLevel?: "ROUTINE" | "URGENT" | "CRITICAL";
  /** Filtrer par classification */
  classification?: "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET";
  /** Tri des résultats */
  sort?: "createdAt:asc" | "createdAt:desc" | "updatedAt:desc" | "issuedAt:desc" | "title:asc";
  /** Nombre de résultats par page */
  limit?: number;
  /** Décalage pour la pagination */
  offset?: number;
}

/**
 * Résultat de recherche d'un rapport
 */
export interface SearchHit {
  id: string;
  title: string;
  caseNumber: string | null;
  reportNumber: string | null;
  purpose: string | null;
  summary: string | null;
  investigationContext: string | null;
  keywords: string[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  urgencyLevel: "ROUTINE" | "URGENT" | "CRITICAL" | null;
  classification: "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL" | "SECRET" | null;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | null;
  modulesContent: string;
  /** Highlight du texte correspondant à la recherche */
  _formatted?: {
    title?: string;
    summary?: string;
    investigationContext?: string;
    modulesContent?: string;
  };
}

/**
 * Réponse de la recherche
 */
export interface SearchResponse {
  hits: SearchHit[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

/**
 * Distribution des facettes pour les filtres
 */
export interface FacetDistribution {
  status?: Record<string, number>;
  urgencyLevel?: Record<string, number>;
  classification?: Record<string, number>;
}

/**
 * Réponse des facettes
 */
export interface FacetsResponse {
  query: string;
  facetDistribution: FacetDistribution;
}

/**
 * Statistiques de l'index Meilisearch
 */
export interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: Record<string, number>;
}

/**
 * Donnée extraite avec ses sources
 */
export interface ExtractedItem {
  value: string;
  reports: Array<{
    id: string;
    title: string;
    caseNumber: string | null;
  }>;
  count: number;
}

/**
 * Données extraites des rapports
 */
export interface ExtractedData {
  phones: ExtractedItem[];
  emails: ExtractedItem[];
  names: ExtractedItem[];
  addresses: ExtractedItem[];
  urls: ExtractedItem[];
  accounts: ExtractedItem[];
  platforms: ExtractedItem[];
  companies: ExtractedItem[];
  aliases: ExtractedItem[];
  identifierTypes: ExtractedItem[];
  stats: {
    totalPhones: number;
    totalEmails: number;
    totalNames: number;
    totalAddresses: number;
    totalUrls: number;
    totalAccounts: number;
    totalPlatforms: number;
    totalCompanies: number;
    totalAliases: number;
    totalIdentifierTypes: number;
    totalReports: number;
  };
}

/**
 * Service de recherche Meilisearch
 */
class SearchService {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Rechercher des rapports
   * @param options Options de recherche et filtres
   * @returns Résultats de recherche avec highlights
   */
  async search(options: SearchOptions = {}): Promise<SearchResponse> {
    const { data } = await this.client.get<SearchResponse>("/search", {
      params: options,
    });
    return data;
  }

  /**
   * Obtenir la distribution des facettes pour les filtres UI
   * @param query Terme de recherche (optionnel)
   * @returns Compteurs par statut, urgence, classification
   */
  async getFacets(query?: string): Promise<FacetsResponse> {
    const { data } = await this.client.get<FacetsResponse>("/search/facets", {
      params: query ? { q: query } : {},
    });
    return data;
  }

  /**
   * Déclencher une réindexation complète (admin uniquement)
   * @returns Résultat de la réindexation
   */
  async reindex(): Promise<{ success: boolean; indexed: number; processingTimeMs: number }> {
    const { data } = await this.client.post("/search/reindex");
    return data;
  }

  /**
   * Obtenir les statistiques de l'index (admin uniquement)
   * @returns Statistiques Meilisearch
   */
  async getStats(): Promise<IndexStats> {
    const { data } = await this.client.get<IndexStats>("/search/stats");
    return data;
  }

  /**
   * Obtenir toutes les données extraites des rapports
   * @returns Données extraites agrégées
   */
  async getExtractedData(): Promise<ExtractedData> {
    const { data } = await this.client.get<ExtractedData>("/search/extracted");
    return data;
  }
}

// Export singleton
export const searchService = new SearchService(api);
export default searchService;
