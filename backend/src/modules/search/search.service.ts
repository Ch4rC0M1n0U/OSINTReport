import { MeiliSearch, Index } from "meilisearch";
import { logger } from "@/config/logger";
import { env } from "@/config/env";
import { prisma } from "@/config/prisma";
import { ReportStatus } from "@prisma/client";

const MEILISEARCH_HOST = env.MEILISEARCH_HOST;
const MEILISEARCH_API_KEY = env.MEILISEARCH_API_KEY;

const REPORTS_INDEX = "reports";

interface SearchableReport {
  id: string;
  title: string;
  caseNumber: string;
  reportNumber: string;
  purpose: string;
  summary: string;
  investigationService: string;
  investigationContext: string;
  legalBasis: string;
  keywords: string[];
  status: string;
  urgencyLevel: string;
  classification: string;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  issuedAt: string | undefined;
  modulesCount: number;
  modulesContent: string;
}

interface SearchOptions {
  filter?: string;
  sort?: string[];
  limit?: number;
  offset?: number;
}

interface SearchResult {
  hits: SearchableReport[];
  estimatedTotalHits: number;
  limit: number;
  offset: number;
  processingTimeMs: number;
}

export class SearchService {
  private static reportsIndex: Index | null = null;

  /**
   * Initialiser les indexes Meilisearch
   */
  static async initializeIndexes(): Promise<void> {
    try {
      const client = new MeiliSearch({
        host: MEILISEARCH_HOST,
        apiKey: MEILISEARCH_API_KEY,
      });

      // Créer ou récupérer l'index
      try {
        await client.createIndex(REPORTS_INDEX, { primaryKey: "id" });
        logger.info(`✅ Index Meilisearch '${REPORTS_INDEX}' créé`);
      } catch (error: any) {
        // Index existe déjà
        if (error.code !== "index_already_exists") {
          throw error;
        }
        logger.info(`ℹ️  Index Meilisearch '${REPORTS_INDEX}' existe déjà`);
      }

      this.reportsIndex = client.index(REPORTS_INDEX);

      // Configurer les attributs de recherche
      await this.reportsIndex.updateSettings({
        searchableAttributes: [
          "title",
          "caseNumber",
          "reportNumber",
          "purpose",
          "summary",
          "investigationContext",
          "keywords",
          "modulesContent",
          "ownerName",
        ],
        filterableAttributes: [
          "status",
          "urgencyLevel",
          "classification",
          "ownerId",
          "createdAt",
          "issuedAt",
        ],
        sortableAttributes: ["createdAt", "updatedAt", "issuedAt", "title"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
        displayedAttributes: ["*"],
      });

      logger.info(`✅ Index Meilisearch '${REPORTS_INDEX}' configuré`);
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur initialisation Meilisearch");
      throw error;
    }
  }

  /**
   * Obtenir l'index, l'initialiser si nécessaire
   */
  private static async getIndex(): Promise<Index> {
    if (!this.reportsIndex) {
      await this.initializeIndexes();
    }
    return this.reportsIndex!;
  }

  /**
   * Indexer un rapport dans Meilisearch
   */
  static async indexReport(reportId: string): Promise<boolean> {
    try {
      const index = await this.getIndex();

      // Récupérer le rapport avec toutes les données nécessaires
      const report: any = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          modules: {
            select: {
              id: true,
              title: true,
              headline: true,
              payload: true,
            },
          },
          _count: {
            select: {
              modules: true,
            },
          },
        },
      });

      if (!report) {
        logger.warn(`⚠️  Rapport ${reportId} introuvable`);
        return false;
      }

      // Extraire le contenu des modules pour la recherche
      const modulesContent = report.modules
        .map((module: any) => {
          let content = "";
          if (module.title) content += `${module.title}\n`;
          if (module.headline) content += `${module.headline}\n`;
          if (module.payload && typeof module.payload === "object") {
            content += JSON.stringify(module.payload);
          }
          return content;
        })
        .join("\n\n");

      // Créer l'objet indexable
      const searchableReport: SearchableReport = {
        id: report.id,
        title: report.title,
        caseNumber: report.caseNumber || "",
        reportNumber: report.reportNumber || "",
        purpose: report.purpose || "",
        summary: report.summary || "",
        investigationService: report.requestingService || "",
        investigationContext: report.investigationContext || "",
        legalBasis: report.legalBasis || "",
        keywords: report.keywords || [],
        status: report.status,
        urgencyLevel: report.urgencyLevel || "",
        classification: report.classification || "",
        ownerName: `${report.owner.firstName} ${report.owner.lastName}`,
        ownerEmail: report.owner.email,
        ownerId: report.ownerId,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        modulesCount: report._count.modules,
        modulesContent,
        issuedAt: report.issuedAt?.toISOString(),
      };

      // Ajouter/mettre à jour dans l'index
      await index.addDocuments([searchableReport]);

      logger.info(`✅ Rapport ${reportId} indexé avec succès`);
      return true;
    } catch (error) {
      logger.error({ err: error }, `❌ Erreur indexation rapport ${reportId}`);
      return false;
    }
  }

  /**
   * Supprimer un rapport de l'index
   */
  static async deleteReport(reportId: string): Promise<boolean> {
    try {
      const index = await this.getIndex();
      await index.deleteDocument(reportId);

      logger.info(`✅ Rapport ${reportId} supprimé de l'index`);
      return true;
    } catch (error) {
      logger.error({ err: error }, `❌ Erreur suppression rapport ${reportId}`);
      return false;
    }
  }

  /**
   * Réindexer tous les rapports
   */
  static async reindexAll(): Promise<number> {
    try {
      const index = await this.getIndex();

      logger.info("🔄 Début de la réindexation de tous les rapports...");

      // Récupérer tous les rapports
      const reports: any[] = await prisma.report.findMany({
        include: {
          owner: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          modules: {
            select: {
              id: true,
              title: true,
              headline: true,
              payload: true,
            },
          },
          _count: {
            select: {
              modules: true,
            },
          },
        },
      });

      // Transformer en documents indexables
      const searchableReports: SearchableReport[] = reports.map((report: any) => {
        const modulesContent = report.modules
          .map((module: any) => {
            let content = "";
            if (module.title) content += `${module.title}\n`;
            if (module.headline) content += `${module.headline}\n`;
            if (module.payload && typeof module.payload === "object") {
              content += JSON.stringify(module.payload);
            }
            return content;
          })
          .join("\n\n");

        return {
          id: report.id,
          title: report.title,
          caseNumber: report.caseNumber || "",
          reportNumber: report.reportNumber || "",
          purpose: report.purpose || "",
          summary: report.summary || "",
          investigationService: report.requestingService || "",
          investigationContext: report.investigationContext || "",
          legalBasis: report.legalBasis || "",
          keywords: report.keywords || [],
          status: report.status,
          urgencyLevel: report.urgencyLevel || "",
          classification: report.classification || "",
          ownerName: `${report.owner.firstName} ${report.owner.lastName}`,
          ownerEmail: report.owner.email,
          ownerId: report.ownerId,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
          modulesCount: report._count.modules,
          modulesContent,
          issuedAt: report.issuedAt?.toISOString(),
        };
      });

      // Supprimer tous les documents existants et réindexer
      await index.deleteAllDocuments();
      await index.addDocuments(searchableReports);

      logger.info(`✅ ${reports.length} rapports réindexés avec succès`);
      return reports.length;
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur réindexation");
      throw error;
    }
  }

  /**
   * Rechercher des rapports
   */
  static async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    try {
      const index = await this.getIndex();

      const searchParams: any = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        attributesToHighlight: ["title", "summary", "modulesContent"],
        highlightPreTag: "<mark>",
        highlightPostTag: "</mark>",
      };

      if (options.filter) {
        searchParams.filter = options.filter;
      }

      if (options.sort) {
        searchParams.sort = options.sort;
      }

      const result = await index.search(query, searchParams);

      return {
        hits: result.hits as SearchableReport[],
        estimatedTotalHits: result.estimatedTotalHits || 0,
        limit: result.limit || 20,
        offset: result.offset || 0,
        processingTimeMs: result.processingTimeMs || 0,
      };
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur recherche Meilisearch");
      throw error;
    }
  }

  /**
   * Obtenir les facettes (pour les filtres)
   */
  static async getFacets(query: string = ""): Promise<any> {
    try {
      const index = await this.getIndex();

      const result = await index.search(query, {
        facets: ["status", "urgencyLevel", "classification"],
      });

      return result.facetDistribution || {};
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur récupération facettes");
      throw error;
    }
  }

  /**
   * Obtenir les statistiques de l'index
   */
  static async getStats(): Promise<any> {
    try {
      const index = await this.getIndex();
      const stats = await index.getStats();

      return {
        numberOfDocuments: stats.numberOfDocuments,
        isIndexing: stats.isIndexing,
        fieldDistribution: stats.fieldDistribution,
      };
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur récupération stats");
      throw error;
    }
  }
}
