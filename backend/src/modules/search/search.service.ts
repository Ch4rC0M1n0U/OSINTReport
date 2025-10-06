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
  // Entités extraites des modules
  entities: {
    phones: string[];
    emails: string[];
    names: string[];
    addresses: string[];
    urls: string[];
    accounts: string[];
  };
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
   * Extraire les entités des modules d'un rapport
   */
  private static extractEntities(modules: any[]): {
    phones: string[];
    emails: string[];
    names: string[];
    addresses: string[];
    urls: string[];
    accounts: string[];
  } {
    const entities = {
      phones: [] as string[],
      emails: [] as string[],
      names: [] as string[],
      addresses: [] as string[],
      urls: [] as string[],
      accounts: [] as string[],
    };

    modules.forEach((module: any) => {
      if (!module.payload || typeof module.payload !== "object") return;

      const payload = module.payload;

      // Extraire selon le type de module
      switch (module.type) {
        case "platform_analysis":
          // Téléphones
          if (payload.phoneNumbers && Array.isArray(payload.phoneNumbers)) {
            entities.phones.push(...payload.phoneNumbers.map((p: any) => p.number || p));
          }
          if (payload.phone) entities.phones.push(payload.phone);

          // Emails
          if (payload.emails && Array.isArray(payload.emails)) {
            entities.emails.push(...payload.emails.map((e: any) => e.email || e));
          }
          if (payload.email) entities.emails.push(payload.email);

          // Noms
          if (payload.names && Array.isArray(payload.names)) {
            entities.names.push(...payload.names.map((n: any) => n.name || n));
          }
          if (payload.fullName) entities.names.push(payload.fullName);
          if (payload.realName) entities.names.push(payload.realName);

          // Adresses
          if (payload.addresses && Array.isArray(payload.addresses)) {
            entities.addresses.push(...payload.addresses.map((a: any) => 
              typeof a === 'string' ? a : a.address || JSON.stringify(a)
            ));
          }
          if (payload.location) entities.addresses.push(payload.location);

          // URLs
          if (payload.urls && Array.isArray(payload.urls)) {
            entities.urls.push(...payload.urls.map((u: any) => u.url || u));
          }
          if (payload.profileUrl) entities.urls.push(payload.profileUrl);
          if (payload.websiteUrl) entities.urls.push(payload.websiteUrl);

          // Comptes
          if (payload.accounts && Array.isArray(payload.accounts)) {
            entities.accounts.push(...payload.accounts.map((a: any) => 
              a.username || a.handle || a.account || a
            ));
          }
          if (payload.username) entities.accounts.push(payload.username);
          if (payload.handle) entities.accounts.push(payload.handle);
          break;

        case "entity_overview":
          // Extraire depuis metadata
          if (payload.metadata) {
            // Téléphones depuis personDetails
            if (payload.metadata.personDetails?.phoneNumbers && Array.isArray(payload.metadata.personDetails.phoneNumbers)) {
              entities.phones.push(...payload.metadata.personDetails.phoneNumbers.filter(Boolean));
            }

            // Téléphones depuis companyDetails
            if (payload.metadata.companyDetails?.phoneNumbers && Array.isArray(payload.metadata.companyDetails.phoneNumbers)) {
              entities.phones.push(...payload.metadata.companyDetails.phoneNumbers.filter(Boolean));
            }

            // Identifiants liés (peuvent être téléphones, emails, usernames)
            if (payload.metadata.relatedIdentifiers && Array.isArray(payload.metadata.relatedIdentifiers)) {
              payload.metadata.relatedIdentifiers.forEach((id: string) => {
                if (!id) return;
                
                // Détecter le type d'identifiant
                if (/^\+?[\d\s\-()]{10,}$/.test(id)) {
                  entities.phones.push(id);
                } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)) {
                  entities.emails.push(id);
                } else {
                  entities.accounts.push(id);
                }
              });
            }

            // Emails depuis personDetails ou companyDetails
            if (payload.metadata.personDetails?.email) {
              entities.emails.push(payload.metadata.personDetails.email);
            }

            // Adresses
            if (payload.metadata.personDetails?.physicalAddress) {
              entities.addresses.push(payload.metadata.personDetails.physicalAddress);
            }
            if (payload.metadata.companyDetails?.headquartersAddress) {
              entities.addresses.push(payload.metadata.companyDetails.headquartersAddress);
            }
            if (payload.metadata.companyDetails?.operationalAddresses && Array.isArray(payload.metadata.companyDetails.operationalAddresses)) {
              entities.addresses.push(...payload.metadata.companyDetails.operationalAddresses.filter(Boolean));
            }

            // Noms/Aliases
            if (payload.metadata.aliases && Array.isArray(payload.metadata.aliases)) {
              entities.names.push(...payload.metadata.aliases.filter(Boolean));
            }

            // Website
            if (payload.metadata.companyDetails?.website) {
              entities.urls.push(payload.metadata.companyDetails.website);
            }
          }

          // Label principal de l'entité
          if (payload.label) {
            entities.names.push(payload.label);
          }
          break;

        case "identifier_lookup":
          // Parcourir les items de recherche
          if (payload.items && Array.isArray(payload.items)) {
            payload.items.forEach((item: any) => {
              if (item.type === "PHONE" && item.value) entities.phones.push(item.value);
              if (item.type === "EMAIL" && item.value) entities.emails.push(item.value);
              if (item.type === "NAME" && item.value) entities.names.push(item.value);
              if (item.type === "ADDRESS" && item.value) entities.addresses.push(item.value);
              if (item.type === "URL" && item.value) entities.urls.push(item.value);
              if (item.type === "ACCOUNT" && item.value) entities.accounts.push(item.value);
            });
          }
          break;

        default:
          // Recherche générique dans le payload
          const payloadStr = JSON.stringify(payload).toLowerCase();
          
          // Pattern téléphone international
          const phonePattern = /\+?[\d\s\-()]{10,}/g;
          const phones = payloadStr.match(phonePattern);
          if (phones) entities.phones.push(...phones);

          // Pattern email
          const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const emails = payloadStr.match(emailPattern);
          if (emails) entities.emails.push(...emails);

          // Pattern URL
          const urlPattern = /https?:\/\/[^\s"<>]+/g;
          const urls = payloadStr.match(urlPattern);
          if (urls) entities.urls.push(...urls);
          break;
      }
    });

    // Dédupliquer et nettoyer
    return {
      phones: [...new Set(entities.phones.filter(Boolean))],
      emails: [...new Set(entities.emails.filter(Boolean))],
      names: [...new Set(entities.names.filter(Boolean))],
      addresses: [...new Set(entities.addresses.filter(Boolean))],
      urls: [...new Set(entities.urls.filter(Boolean))],
      accounts: [...new Set(entities.accounts.filter(Boolean))],
    };
  }

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
          // Entités
          "entities.phones",
          "entities.emails",
          "entities.names",
          "entities.addresses",
          "entities.urls",
          "entities.accounts",
        ],
        filterableAttributes: [
          "status",
          "urgencyLevel",
          "classification",
          "ownerId",
          "createdAt",
          "issuedAt",
          // Entités (pour filtrer)
          "entities.phones",
          "entities.emails",
          "entities.names",
          "entities.addresses",
          "entities.urls",
          "entities.accounts",
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

      // Extraire les entités des modules
      const entities = this.extractEntities(report.modules);

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
        entities,
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

        const entities = this.extractEntities(report.modules);

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
          entities,
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
