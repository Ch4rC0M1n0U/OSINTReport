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
  isEmbargoed: boolean;
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
  // Métadonnées supplémentaires pour recherche avancée
  metadata: {
    platforms: string[]; // Noms de plateformes extraits
    companies: string[]; // Noms d'entreprises extraits
    aliases: string[]; // Pseudos et aliases extraits
    identifierTypes: string[]; // Types d'identifiants recherchés
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
    platforms: string[];
    companies: string[];
    aliases: string[];
    identifierTypes: string[];
  } {
    const entities = {
      phones: [] as string[],
      emails: [] as string[],
      names: [] as string[],
      addresses: [] as string[],
      urls: [] as string[],
      accounts: [] as string[],
      platforms: [] as string[],
      companies: [] as string[],
      aliases: [] as string[],
      identifierTypes: [] as string[],
    };

    modules.forEach((module: any) => {
      if (!module.payload || typeof module.payload !== "object") return;

      const payload = module.payload;

      // Fonction helper pour extraire des findings
      const extractFromFindings = (findings: any[]) => {
        if (!Array.isArray(findings)) return;
        
        findings.forEach((finding: any) => {
          if (!finding) return;

          // Label du finding (souvent un nom, entreprise, ou identifiant)
          if (finding.label) {
            // Détecter si c'est un email, téléphone ou nom
            if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(finding.label)) {
              entities.emails.push(finding.label);
            } else if (/^\+?[\d\s\-()]{10,}$/.test(finding.label)) {
              entities.phones.push(finding.label);
            } else if (/^https?:\/\//i.test(finding.label)) {
              entities.urls.push(finding.label);
            } else {
              entities.names.push(finding.label);
            }
          }

          // Description peut contenir des identifiants
          if (finding.description) {
            const descStr = finding.description.toLowerCase();
            // Extraire téléphones de la description
            const phoneMatches = finding.description.match(/\+?[\d\s\-()]{10,}/g);
            if (phoneMatches) entities.phones.push(...phoneMatches);
            
            // Extraire emails de la description
            const emailMatches = finding.description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (emailMatches) entities.emails.push(...emailMatches);
            
            // Extraire URLs de la description
            const urlMatches = finding.description.match(/https?:\/\/[^\s"<>]+/g);
            if (urlMatches) entities.urls.push(...urlMatches);
          }

          // Métadonnées d'entité (EntityOverview)
          if (finding.metadata) {
            const metadata = finding.metadata;

            // Aliases
            if (metadata.aliases && Array.isArray(metadata.aliases)) {
              entities.names.push(...metadata.aliases.filter(Boolean));
              entities.aliases.push(...metadata.aliases.filter(Boolean)); // Aussi dans aliases dédiés
            }

            // Détails personne
            if (metadata.personDetails) {
              const person = metadata.personDetails;
              
              if (person.fullName) entities.names.push(person.fullName);
              if (person.firstName && person.lastName) {
                entities.names.push(`${person.firstName} ${person.lastName}`);
              }
              if (person.email) entities.emails.push(person.email);
              if (person.phoneNumbers && Array.isArray(person.phoneNumbers)) {
                entities.phones.push(...person.phoneNumbers.filter(Boolean));
              }
              if (person.physicalAddress) entities.addresses.push(person.physicalAddress);
              if (person.dateOfBirth) {
                // Ajouter comme metadata (peut être cherchable)
              }
              if (person.nationality) {
                entities.names.push(person.nationality);
              }
            }

            // Détails entreprise/organisation
            if (metadata.companyDetails) {
              const company = metadata.companyDetails;
              
              if (company.legalName) {
                entities.names.push(company.legalName);
                entities.companies.push(company.legalName); // Aussi dans companies dédiés
              }
              if (company.tradeName) {
                entities.names.push(company.tradeName);
                entities.companies.push(company.tradeName); // Aussi dans companies dédiés
              }
              if (company.registrationNumber) entities.accounts.push(company.registrationNumber);
              if (company.vatNumber) entities.accounts.push(company.vatNumber);
              if (company.website) entities.urls.push(company.website);
              if (company.email) entities.emails.push(company.email);
              if (company.phoneNumbers && Array.isArray(company.phoneNumbers)) {
                entities.phones.push(...company.phoneNumbers.filter(Boolean));
              }
              if (company.headquartersAddress) entities.addresses.push(company.headquartersAddress);
              if (company.operationalAddresses && Array.isArray(company.operationalAddresses)) {
                entities.addresses.push(...company.operationalAddresses.filter(Boolean));
              }
              if (company.industry) {
                entities.names.push(company.industry);
              }
            }

            // Identifiants liés
            if (metadata.relatedIdentifiers && Array.isArray(metadata.relatedIdentifiers)) {
              metadata.relatedIdentifiers.forEach((id: string) => {
                if (!id) return;
                
                // Détecter le type d'identifiant
                if (/^\+?[\d\s\-()]{10,}$/.test(id)) {
                  entities.phones.push(id);
                } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)) {
                  entities.emails.push(id);
                } else if (/^https?:\/\//i.test(id)) {
                  entities.urls.push(id);
                } else {
                  entities.accounts.push(id);
                }
              });
            }
          }

          // Sources (peuvent contenir URLs, noms de plateformes, etc.)
          if (finding.sources && Array.isArray(finding.sources)) {
            finding.sources.forEach((source: any) => {
              if (source.url) entities.urls.push(source.url);
              if (source.platform) entities.names.push(source.platform);
            });
          }
        });
      };

      // Extraire selon le type de module
      switch (module.type) {
        case "entities":
          // Module "Entités concernées" - contient des findings
          extractFromFindings(payload.findings || []);
          
          // Si le module a une entité liée, extraire son label
          if (module.entity && module.entity.label) {
            entities.names.push(module.entity.label);
          }
          break;

        case "entity_overview":
          // Vue d'ensemble d'une entité - extraction complète
          extractFromFindings(payload.findings || []);
          
          // Context peut contenir des informations
          if (payload.context) {
            const phoneMatches = payload.context.match(/\+?[\d\s\-()]{10,}/g);
            if (phoneMatches) entities.phones.push(...phoneMatches);
            
            const emailMatches = payload.context.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (emailMatches) entities.emails.push(...emailMatches);
          }

          // Label de l'entité
          if (payload.label) {
            entities.names.push(payload.label);
          }
          break;

        case "identifier_lookup":
          // Recherche d'identifiant - extraire la valeur cherchée
          if (payload.identifierValue) {
            const value = payload.identifierValue;
            const type = payload.identifierType;
            
            // Ajouter le type d'identifiant aux métadonnées
            if (type) {
              entities.identifierTypes.push(type);
            }

            switch (type) {
              case "phone":
                entities.phones.push(value);
                break;
              case "email":
                entities.emails.push(value);
                break;
              case "username":
              case "alias":
                entities.accounts.push(value);
                entities.aliases.push(value); // Aussi dans aliases
                break;
              case "rrn":
                entities.accounts.push(value);
                break;
              default:
                // Détecter automatiquement
                if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                  entities.emails.push(value);
                } else if (/^\+?[\d\s\-()]{10,}$/.test(value)) {
                  entities.phones.push(value);
                } else {
                  entities.accounts.push(value);
                }
            }
          }

          // Findings
          extractFromFindings(payload.findings || []);
          break;

        case "platform_analysis":
          // Analyse de plateforme - extraction complète
          if (payload.platform) {
            entities.names.push(payload.platform);
            entities.platforms.push(payload.platform); // Aussi dans platforms dédiés
          }

          if (payload.platformUrl) {
            entities.urls.push(payload.platformUrl);
          }

          // Findings (profils, comptes, etc.)
          extractFromFindings(payload.findings || []);

          // Données spécifiques plateforme (si présentes)
          if (payload.username) {
            entities.accounts.push(payload.username);
            entities.aliases.push(payload.username); // Aussi dans aliases
          }
          if (payload.handle) {
            entities.accounts.push(payload.handle);
            entities.aliases.push(payload.handle); // Aussi dans aliases
          }
          if (payload.profileUrl) entities.urls.push(payload.profileUrl);
          if (payload.email) entities.emails.push(payload.email);
          if (payload.phone) entities.phones.push(payload.phone);
          if (payload.fullName) entities.names.push(payload.fullName);
          if (payload.realName) entities.names.push(payload.realName);
          if (payload.location) entities.addresses.push(payload.location);

          // Tableaux
          if (payload.phoneNumbers && Array.isArray(payload.phoneNumbers)) {
            entities.phones.push(...payload.phoneNumbers.map((p: any) => 
              typeof p === 'string' ? p : p.number || p.value
            ).filter(Boolean));
          }

          if (payload.emails && Array.isArray(payload.emails)) {
            entities.emails.push(...payload.emails.map((e: any) => 
              typeof e === 'string' ? e : e.email || e.value
            ).filter(Boolean));
          }

          if (payload.names && Array.isArray(payload.names)) {
            entities.names.push(...payload.names.map((n: any) => 
              typeof n === 'string' ? n : n.name || n.value
            ).filter(Boolean));
          }

          if (payload.addresses && Array.isArray(payload.addresses)) {
            entities.addresses.push(...payload.addresses.map((a: any) => 
              typeof a === 'string' ? a : a.address || a.value
            ).filter(Boolean));
          }

          if (payload.urls && Array.isArray(payload.urls)) {
            entities.urls.push(...payload.urls.map((u: any) => 
              typeof u === 'string' ? u : u.url || u.value
            ).filter(Boolean));
          }

          if (payload.accounts && Array.isArray(payload.accounts)) {
            entities.accounts.push(...payload.accounts.map((a: any) => 
              typeof a === 'string' ? a : a.username || a.handle || a.account || a.value
            ).filter(Boolean));
          }
          break;

        case "research_summary":
          // Résumé des recherches
          if (payload.summary) {
            // Extraire identifiants du résumé
            const phoneMatches = payload.summary.match(/\+?[\d\s\-()]{10,}/g);
            if (phoneMatches) entities.phones.push(...phoneMatches);
            
            const emailMatches = payload.summary.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (emailMatches) entities.emails.push(...emailMatches);

            const urlMatches = payload.summary.match(/https?:\/\/[^\s"<>]+/g);
            if (urlMatches) entities.urls.push(...urlMatches);
          }

          // Éléments non trouvés (peuvent être des identifiants cherchés)
          if (payload.notFound && Array.isArray(payload.notFound)) {
            payload.notFound.forEach((item: string) => {
              if (!item) return;
              
              if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(item)) {
                entities.emails.push(item);
              } else if (/^\+?[\d\s\-()]{10,}$/.test(item)) {
                entities.phones.push(item);
              } else if (/^https?:\/\//i.test(item)) {
                entities.urls.push(item);
              } else {
                entities.accounts.push(item);
              }
            });
          }
          break;

        case "media_gallery":
          // Galerie média - extraire des captions et sources
          if (payload.items && Array.isArray(payload.items)) {
            payload.items.forEach((item: any) => {
              if (item.caption) {
                // Extraire des identifiants des captions
                const phoneMatches = item.caption.match(/\+?[\d\s\-()]{10,}/g);
                if (phoneMatches) entities.phones.push(...phoneMatches);
                
                const emailMatches = item.caption.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                if (emailMatches) entities.emails.push(...emailMatches);
              }
              
              if (item.source) {
                if (/^https?:\/\//i.test(item.source)) {
                  entities.urls.push(item.source);
                } else {
                  entities.names.push(item.source);
                }
              }
            });
          }
          break;

        case "data_retention":
          // Données sauvegardées - datasets
          if (payload.datasets && Array.isArray(payload.datasets)) {
            payload.datasets.forEach((dataset: any) => {
              if (dataset.label) entities.names.push(dataset.label);
              if (dataset.location) {
                if (/^https?:\/\//i.test(dataset.location)) {
                  entities.urls.push(dataset.location);
                } else {
                  entities.addresses.push(dataset.location);
                }
              }
            });
          }
          break;

        case "investigation_leads":
          // Pistes d'enquête - plateformes et requisitions
          if (payload.leads && Array.isArray(payload.leads)) {
            payload.leads.forEach((lead: any) => {
              if (lead.platform) entities.names.push(lead.platform);
              if (lead.legalBasis) {
                // Peut contenir des références
                const urlMatches = lead.legalBasis.match(/https?:\/\/[^\s"<>]+/g);
                if (urlMatches) entities.urls.push(...urlMatches);
              }
            });
          }
          break;

        case "sign_off":
          // Signature - informations de l'officier
          if (payload.officer) {
            if (payload.officer.name) entities.names.push(payload.officer.name);
            if (payload.officer.rank) entities.names.push(payload.officer.rank);
            if (payload.officer.unit) entities.names.push(payload.officer.unit);
            if (payload.officer.badgeNumber) entities.accounts.push(payload.officer.badgeNumber);
          }
          break;

        case "summary":
        case "objectives":
        case "conclusions":
          // Modules textuels - extraction générique
          const textContent = payload.content || 
                             (Array.isArray(payload.objectives) ? payload.objectives.join(' ') : '') ||
                             (Array.isArray(payload.statements) ? payload.statements.join(' ') : '');

          if (textContent) {
            const phoneMatches = textContent.match(/\+?[\d\s\-()]{10,}/g);
            if (phoneMatches) entities.phones.push(...phoneMatches);
            
            const emailMatches = textContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            if (emailMatches) entities.emails.push(...emailMatches);

            const urlMatches = textContent.match(/https?:\/\/[^\s"<>]+/g);
            if (urlMatches) entities.urls.push(...urlMatches);
          }
          break;

        default:
          // Pour les modules non reconnus, recherche générique dans le payload
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

      // Extraction depuis les richTextBlocks (nouveauté v2.1)
      if (payload.richTextBlocks && Array.isArray(payload.richTextBlocks)) {
        payload.richTextBlocks.forEach((block: any) => {
          if (!block.content) return;
          
          const phoneMatches = block.content.match(/\+?[\d\s\-()]{10,}/g);
          if (phoneMatches) entities.phones.push(...phoneMatches);
          
          const emailMatches = block.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
          if (emailMatches) entities.emails.push(...emailMatches);

          const urlMatches = block.content.match(/https?:\/\/[^\s"<>]+/g);
          if (urlMatches) entities.urls.push(...urlMatches);
        });
      }
    });

    // Dédupliquer et nettoyer
    return {
      phones: [...new Set(entities.phones.filter(Boolean).map(p => p.trim()))],
      emails: [...new Set(entities.emails.filter(Boolean).map(e => e.trim().toLowerCase()))],
      names: [...new Set(entities.names.filter(Boolean).map(n => n.trim()))],
      addresses: [...new Set(entities.addresses.filter(Boolean).map(a => a.trim()))],
      urls: [...new Set(entities.urls.filter(Boolean).map(u => u.trim()))],
      accounts: [...new Set(entities.accounts.filter(Boolean).map(a => a.trim()))],
      platforms: [...new Set(entities.platforms.filter(Boolean).map(p => p.trim()))],
      companies: [...new Set(entities.companies.filter(Boolean).map(c => c.trim()))],
      aliases: [...new Set(entities.aliases.filter(Boolean).map(a => a.trim()))],
      identifierTypes: [...new Set(entities.identifierTypes.filter(Boolean).map(t => t.trim()))],
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
          // Métadonnées supplémentaires
          "metadata.platforms",
          "metadata.companies",
          "metadata.aliases",
          "metadata.identifierTypes",
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
          // Métadonnées (pour filtrer)
          "metadata.platforms",
          "metadata.companies",
          "metadata.aliases",
          "metadata.identifierTypes",
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
      const extractedData = this.extractEntities(report.modules);

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
        isEmbargoed: report.isEmbargoed || false,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        modulesCount: report._count.modules,
        modulesContent,
        entities: {
          phones: extractedData.phones,
          emails: extractedData.emails,
          names: extractedData.names,
          addresses: extractedData.addresses,
          urls: extractedData.urls,
          accounts: extractedData.accounts,
        },
        metadata: {
          platforms: extractedData.platforms,
          companies: extractedData.companies,
          aliases: extractedData.aliases,
          identifierTypes: extractedData.identifierTypes,
        },
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

        const extractedData = this.extractEntities(report.modules);

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
          isEmbargoed: report.isEmbargoed || false,
          createdAt: report.createdAt.toISOString(),
          updatedAt: report.updatedAt.toISOString(),
          modulesCount: report._count.modules,
          modulesContent,
          entities: {
            phones: extractedData.phones,
            emails: extractedData.emails,
            names: extractedData.names,
            addresses: extractedData.addresses,
            urls: extractedData.urls,
            accounts: extractedData.accounts,
          },
          metadata: {
            platforms: extractedData.platforms,
            companies: extractedData.companies,
            aliases: extractedData.aliases,
            identifierTypes: extractedData.identifierTypes,
          },
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
    options: SearchOptions = {},
    userId?: string
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

      // Construire les filtres
      const filters: string[] = [];

      // Filtrer les rapports sous embargo
      if (userId) {
        filters.push(`(isEmbargoed = false OR ownerId = "${userId}")`);
      } else {
        filters.push(`isEmbargoed = false`);
      }

      // Ajouter les filtres personnalisés
      if (options.filter) {
        filters.push(options.filter);
      }

      if (filters.length > 0) {
        searchParams.filter = filters.join(" AND ");
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

  /**
   * Extraire toutes les données des rapports pour affichage
   */
  static async getExtractedData(): Promise<{
    phones: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    emails: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    names: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    addresses: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    urls: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    accounts: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    platforms: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    companies: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    aliases: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
    identifierTypes: Array<{ value: string; reports: Array<{ id: string; title: string; caseNumber: string | null }>; count: number }>;
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
  }> {
    try {
      // Récupérer tous les rapports avec leurs modules
      const reports: any[] = await prisma.report.findMany({
        select: {
          id: true,
          title: true,
          caseNumber: true,
          modules: {
            select: {
              type: true,
              payload: true,
            },
          },
        },
      });

      // Maps pour agréger les données avec leurs sources
      const phonesMap = new Map<string, Set<string>>();
      const emailsMap = new Map<string, Set<string>>();
      const namesMap = new Map<string, Set<string>>();
      const addressesMap = new Map<string, Set<string>>();
      const urlsMap = new Map<string, Set<string>>();
      const accountsMap = new Map<string, Set<string>>();
      const platformsMap = new Map<string, Set<string>>();
      const companiesMap = new Map<string, Set<string>>();
      const aliasesMap = new Map<string, Set<string>>();
      const identifierTypesMap = new Map<string, Set<string>>();

      // Créer un map des rapports pour accès rapide
      const reportsMap = new Map(
        reports.map((r) => [r.id, { id: r.id, title: r.title, caseNumber: r.caseNumber }])
      );

      // Extraire les données de chaque rapport
      reports.forEach((report) => {
        const reportId = report.id; // Utiliser l'ID réel du rapport (UUID)
        const extractedData = this.extractEntities(report.modules);

        // Agréger les données
        extractedData.phones.forEach((phone) => {
          if (!phonesMap.has(phone)) phonesMap.set(phone, new Set());
          phonesMap.get(phone)!.add(reportId);
        });

        extractedData.emails.forEach((email) => {
          if (!emailsMap.has(email)) emailsMap.set(email, new Set());
          emailsMap.get(email)!.add(reportId);
        });

        extractedData.names.forEach((name) => {
          if (!namesMap.has(name)) namesMap.set(name, new Set());
          namesMap.get(name)!.add(reportId);
        });

        extractedData.addresses.forEach((address) => {
          if (!addressesMap.has(address)) addressesMap.set(address, new Set());
          addressesMap.get(address)!.add(reportId);
        });

        extractedData.urls.forEach((url) => {
          if (!urlsMap.has(url)) urlsMap.set(url, new Set());
          urlsMap.get(url)!.add(reportId);
        });

        extractedData.accounts.forEach((account) => {
          if (!accountsMap.has(account)) accountsMap.set(account, new Set());
          accountsMap.get(account)!.add(reportId);
        });

        extractedData.platforms.forEach((platform) => {
          if (!platformsMap.has(platform)) platformsMap.set(platform, new Set());
          platformsMap.get(platform)!.add(reportId);
        });

        extractedData.companies.forEach((company) => {
          if (!companiesMap.has(company)) companiesMap.set(company, new Set());
          companiesMap.get(company)!.add(reportId);
        });

        extractedData.aliases.forEach((alias) => {
          if (!aliasesMap.has(alias)) aliasesMap.set(alias, new Set());
          aliasesMap.get(alias)!.add(reportId);
        });

        extractedData.identifierTypes.forEach((type) => {
          if (!identifierTypesMap.has(type)) identifierTypesMap.set(type, new Set());
          identifierTypesMap.get(type)!.add(reportId);
        });
      });

      // Convertir les Maps en tableaux triés par fréquence
      const toArray = (map: Map<string, Set<string>>) =>
        Array.from(map.entries())
          .map(([value, reportIds]) => ({
            value,
            reports: Array.from(reportIds).map(id => reportsMap.get(id)!),
            count: reportIds.size,
          }))
          .sort((a, b) => b.count - a.count);

      return {
        phones: toArray(phonesMap),
        emails: toArray(emailsMap),
        names: toArray(namesMap),
        addresses: toArray(addressesMap),
        urls: toArray(urlsMap),
        accounts: toArray(accountsMap),
        platforms: toArray(platformsMap),
        companies: toArray(companiesMap),
        aliases: toArray(aliasesMap),
        identifierTypes: toArray(identifierTypesMap),
        stats: {
          totalPhones: phonesMap.size,
          totalEmails: emailsMap.size,
          totalNames: namesMap.size,
          totalAddresses: addressesMap.size,
          totalUrls: urlsMap.size,
          totalAccounts: accountsMap.size,
          totalPlatforms: platformsMap.size,
          totalCompanies: companiesMap.size,
          totalAliases: aliasesMap.size,
          totalIdentifierTypes: identifierTypesMap.size,
          totalReports: reports.length,
        },
      };
    } catch (error) {
      logger.error({ err: error }, "❌ Erreur extraction données");
      throw error;
    }
  }
}
