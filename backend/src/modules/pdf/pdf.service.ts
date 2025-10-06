/**
 * Service de génération de rapports PDF
 * Utilise Puppeteer pour le rendu HTML → PDF
 * et pdf-lib pour les watermarks et métadonnées
 */

import puppeteer from "puppeteer";
import handlebars from "handlebars";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { logger } from "@/config/logger";
import { prisma } from "@/config/prisma";
import { SettingsService } from "@/modules/settings/settings.service";

interface GeneratePDFOptions {
  reportId: string;
  includeWatermark?: boolean;
  officerName?: string;
  officerRank?: string;
}

interface WatermarkConfig {
  text: string;
  color: { r: number; g: number; b: number };
  opacity: number;
}

export class PDFService {
  private static templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Enregistrer les helpers Handlebars personnalisés
   */
  private static registerHelpers() {
    // Helper pour comparaison égalité
    handlebars.registerHelper("eq", function (a: any, b: any) {
      return a === b;
    });

    // Helper pour formater une date
    handlebars.registerHelper("formatDate", function (date: string | Date) {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("fr-BE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    });

    // Helper pour formater une date avec heure
    handlebars.registerHelper("formatDateTime", function (date: string | Date) {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleDateString("fr-BE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    });

    // Helper pour uppercase
    handlebars.registerHelper("upper", function (str: string) {
      return str ? str.toUpperCase() : "";
    });

    // Helper pour vérifier si tableau non vide
    handlebars.registerHelper("hasItems", function (arr: any[]) {
      return arr && Array.isArray(arr) && arr.length > 0;
    });
  }

  /**
   * Charger et compiler un template Handlebars
   */
  private static async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    // Enregistrer les helpers (une seule fois)
    this.registerHelpers();

    // Vérifier le cache
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    // Charger le fichier template
    const templatePath = join(__dirname, "templates", `${templateName}.hbs`);
    const templateContent = await readFile(templatePath, "utf-8");

    // Compiler le template
    const compiled = handlebars.compile(templateContent);
    this.templateCache.set(templateName, compiled);

    return compiled;
  }

  /**
   * Récupérer les données complètes d'un rapport
   */
  private static async fetchReportData(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            matricule: true,
          },
        },
        modules: {
          orderBy: { position: "asc" },
          include: {
            entity: true,
            researchItems: {
              include: {
                entity: true,
                researchType: true,
              },
            },
          },
        },
        correlations: {
          include: {
            sourceReport: {
              select: {
                id: true,
                title: true,
                caseNumber: true,
              },
            },
            relatedReport: {
              select: {
                id: true,
                title: true,
                caseNumber: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      throw new Error(`Rapport ${reportId} introuvable`);
    }

    return report;
  }

  /**
   * Préparer les données pour le template
   */
  private static async prepareTemplateData(report: any, options: GeneratePDFOptions) {
    const now = new Date();
    
    // Récupérer les paramètres système
    const systemSettings = await SettingsService.getSettings();
    
    // Construire l'adresse complète du service
    const serviceAddressParts = [];
    if (systemSettings.serviceAddress) serviceAddressParts.push(systemSettings.serviceAddress);
    if (systemSettings.servicePostalCode || systemSettings.serviceCity) {
      const cityPart = [systemSettings.servicePostalCode, systemSettings.serviceCity]
        .filter(Boolean)
        .join(' ');
      serviceAddressParts.push(cityPart);
    }
    if (systemSettings.serviceCountry) serviceAddressParts.push(systemSettings.serviceCountry);
    const serviceAddress = serviceAddressParts.length > 0 ? serviceAddressParts.join(', ') : null;

    // Préparer l'URL du logo pour Puppeteer (base64 pour éviter les problèmes de sécurité file://)
    let logoUrl: string | null = null;
    if (systemSettings.logoUrl) {
      try {
        // Le logoUrl est relatif type "/uploads/logos/xxx.png"
        // __dirname en production: /workspaces/OSINTReport/backend/dist/modules/pdf
        // On veut accéder à: /workspaces/OSINTReport/backend/uploads/logos/xxx.png
        const relativePath = systemSettings.logoUrl.startsWith('/') 
          ? systemSettings.logoUrl.substring(1) 
          : systemSettings.logoUrl;
        const logoPath = resolve(join(__dirname, "../../../", relativePath));
        const fs = require('fs');
        
        if (fs.existsSync(logoPath)) {
          // Convertir l'image en base64
          const imageBuffer = fs.readFileSync(logoPath);
          const mimeType = systemSettings.logoUrl.toLowerCase().endsWith('.png') ? 'image/png' :
                          systemSettings.logoUrl.toLowerCase().endsWith('.jpg') || systemSettings.logoUrl.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' :
                          systemSettings.logoUrl.toLowerCase().endsWith('.svg') ? 'image/svg+xml' :
                          'image/png';
          const base64Image = imageBuffer.toString('base64');
          logoUrl = `data:${mimeType};base64,${base64Image}`;
          logger.debug(`Logo converti en base64 (${mimeType}, ${(base64Image.length / 1024).toFixed(2)} KB)`);
        } else {
          logger.warn(`Logo file not found: ${logoPath}`);
        }
      } catch (error) {
        logger.error(`Error loading logo: ${error}`);
      }
    }

    return {
      // Paramètres système
      serviceName: systemSettings.serviceName || "OSINT",
      serviceFullName: systemSettings.serviceFullName || null,
      serviceAddress: serviceAddress,
      servicePhone: systemSettings.phoneNumber || null,
      serviceFax: systemSettings.faxNumber || null,
      serviceEmail: systemSettings.emailContact || null,
      serviceWebsite: systemSettings.websiteUrl || null,
      logoUrl: logoUrl,
      primaryColor: systemSettings.primaryColor || "#003f87",
      secondaryColor: systemSettings.secondaryColor || "#0066cc",
      
      // Métadonnées du rapport
      title: report.title,
      caseNumber: report.caseNumber || "N/A",
      reportNumber: report.reportNumber || "N/A",
      classification: report.classification || "PUBLIC",
      urgencyLevel: report.urgencyLevel || "ROUTINE",
      status: report.status,

      // Dates
      issuedAt: report.issuedAt ? report.issuedAt.toLocaleDateString("fr-BE") : "Non émis",
      createdAt: report.createdAt.toLocaleDateString("fr-BE"),
      generatedDate: now.toLocaleDateString("fr-BE", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),

      // Contexte
      purpose: report.purpose || "",
      summary: report.summary || "",
      investigationContext: report.investigationContext || "",
      legalBasis: report.legalBasis || "",

      // Propriétaire / Officier
      owner: {
        name: `${report.owner.firstName} ${report.owner.lastName}`,
        matricule: report.owner.matricule || "N/A",
      },
      officer: options.officerName || `${report.owner.firstName} ${report.owner.lastName}`,
      officerRank: options.officerRank || "Inspecteur",

      // Service
      requestingService: report.requestingService || "PJF Bruxelles",
      reportingUnit: report.reportingUnit || "DRS - Data Management & Analysis",

      // Modules
      modules: report.modules.map((module: any) => ({
        title: module.title,
        headline: module.headline || "",
        type: module.type,
        content: this.renderModuleContent(module),
        position: module.position,
      })),

      // Corrélations
      correlations: report.correlations.map((corr: any) => ({
        type: corr.type,
        confidence: corr.confidence,
        description: corr.description,
        relatedReport:
          corr.sourceReportId === report.id ? corr.targetReport : corr.sourceReport,
      })),

      // Statistiques
      modulesCount: report.modules.length,
      correlationsCount: report.correlations.length,

      // Flags
      hasClassification: report.classification && report.classification !== "PUBLIC",
      isUrgent: report.urgencyLevel === "URGENT" || report.urgencyLevel === "CRITICAL",
    };
  }

  /**
   * Rendre le contenu d'un module selon son type
   */
  private static renderModuleContent(module: any): string {
    const type = module.type;
    const payload = module.payload || {};

    switch (type) {
      case "summary":
        return this.renderSummary(payload);
      case "entities":
        return this.renderEntities(payload, module.entity);
      case "objectives":
        return this.renderObjectives(payload);
      case "research_summary":
        return this.renderResearchSummary(payload);
      case "entity_overview":
        return this.renderEntityOverview(payload, module.entity);
      case "identifier_lookup":
        return this.renderIdentifierLookup(payload);
      case "platform_analysis":
        return this.renderPlatformAnalysis(payload);
      case "media_gallery":
        return this.renderMediaGallery(payload);
      case "data_retention":
        return this.renderDataRetention(payload);
      case "conclusions":
        return this.renderConclusions(payload);
      case "investigation_leads":
        return this.renderInvestigationLeads(payload);
      case "sign_off":
        return this.renderSignOff(payload);
      default:
        return this.renderGeneric(payload);
    }
  }

  /** Renderer pour module Summary */
  private static renderSummary(payload: any): string {
    return payload.content ? `<div class="content">${payload.content}</div>` : "";
  }

  /** Renderer pour module Entities */
  private static renderEntities(payload: any, linkedEntity: any): string {
    if (!payload.entities || payload.entities.length === 0) return "";

    let html = '<div class="entities-list">';
    payload.entities.forEach((entry: any) => {
      const entity = entry.entity || linkedEntity;
      if (!entity) return;

      html += '<div class="entity-card">';
      html += `<h4>${entity.name || "Entité"}</h4>`;
      
      if (entity.metadata) {
        const meta = entity.metadata;
        if (meta.entityType) {
          html += `<p><strong>Type:</strong> ${meta.entityType}</p>`;
        }
        if (meta.aliases && meta.aliases.length > 0) {
          html += `<p><strong>Alias:</strong> ${meta.aliases.join(", ")}</p>`;
        }
        
        // Détails personne
        if (meta.personDetails) {
          const pd = meta.personDetails;
          if (pd.dateOfBirth) html += `<p><strong>Date de naissance:</strong> ${pd.dateOfBirth}</p>`;
          if (pd.nationalRegistryNumber) html += `<p><strong>RRN:</strong> ${pd.nationalRegistryNumber}</p>`;
          if (pd.physicalAddress) html += `<p><strong>Adresse:</strong> ${pd.physicalAddress}</p>`;
          if (pd.phoneNumbers && pd.phoneNumbers.length > 0) {
            html += `<p><strong>Téléphones:</strong> ${pd.phoneNumbers.join(", ")}</p>`;
          }
        }
        
        // Détails société
        if (meta.companyDetails) {
          const cd = meta.companyDetails;
          if (cd.bceNumber) html += `<p><strong>BCE:</strong> ${cd.bceNumber}</p>`;
          if (cd.headquartersAddress) html += `<p><strong>Siège:</strong> ${cd.headquartersAddress}</p>`;
          if (cd.website) html += `<p><strong>Site web:</strong> ${cd.website}</p>`;
          if (cd.phoneNumbers && cd.phoneNumbers.length > 0) {
            html += `<p><strong>Téléphones:</strong> ${cd.phoneNumbers.join(", ")}</p>`;
          }
        }
      }
      
      if (entry.role) html += `<p><strong>Rôle:</strong> ${entry.role}</p>`;
      if (entry.notes) html += `<p class="notes">${entry.notes}</p>`;
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  /** Renderer pour module Objectives */
  private static renderObjectives(payload: any): string {
    if (!payload.objectives || payload.objectives.length === 0) return "";

    let html = '<ul class="objectives-list">';
    payload.objectives.forEach((obj: string) => {
      html += `<li>${obj}</li>`;
    });
    html += '</ul>';
    return html;
  }

  /** Renderer pour module Research Summary */
  private static renderResearchSummary(payload: any): string {
    let html = "";
    
    if (payload.summary) {
      html += `<div class="summary-text">${payload.summary}</div>`;
    }
    
    if (payload.notFound && payload.notFound.length > 0) {
      html += '<div class="not-found-section">';
      html += '<h4>Éléments non trouvés</h4>';
      html += '<ul>';
      payload.notFound.forEach((item: string) => {
        html += `<li>${item}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    }
    
    if (payload.methodology) {
      html += `<div class="methodology"><h4>Méthodologie</h4><p>${payload.methodology}</p></div>`;
    }
    
    if (payload.notes) {
      html += `<p class="notes">${payload.notes}</p>`;
    }
    
    return html;
  }

  /** Renderer pour module Entity Overview */
  private static renderEntityOverview(payload: any, entity: any): string {
    let html = "";
    
    if (entity) {
      html += `<div class="entity-header"><h4>${entity.name}</h4></div>`;
    }
    
    if (payload.context) {
      html += `<div class="context">${payload.context}</div>`;
    }
    
    if (payload.findings && payload.findings.length > 0) {
      html += this.renderFindings(payload.findings);
    }
    
    if (payload.notes) {
      html += `<p class="notes">${payload.notes}</p>`;
    }
    
    return html;
  }

  /** Renderer pour module Identifier Lookup */
  private static renderIdentifierLookup(payload: any): string {
    let html = "";
    
    if (payload.identifierValue) {
      html += `<p><strong>${payload.identifierType || "Identifiant"}:</strong> ${payload.identifierValue}</p>`;
    }
    
    if (payload.findings && payload.findings.length > 0) {
      html += this.renderFindings(payload.findings);
    }
    
    if (payload.notes) {
      html += `<p class="notes">${payload.notes}</p>`;
    }
    
    return html;
  }

  /** Renderer pour module Platform Analysis */
  private static renderPlatformAnalysis(payload: any): string {
    let html = "";
    
    if (payload.platform) {
      html += `<p><strong>Plateforme:</strong> ${payload.platform.toUpperCase()}</p>`;
    }
    
    if (payload.platformUrl) {
      html += `<p><strong>URL:</strong> <a href="${payload.platformUrl}">${payload.platformUrl}</a></p>`;
    }
    
    if (payload.findings && payload.findings.length > 0) {
      html += this.renderFindings(payload.findings);
    }
    
    if (payload.screenshots && payload.screenshots.length > 0) {
      html += '<div class="screenshots">';
      html += '<h4>Captures d\'écran</h4>';
      html += `<p>${payload.screenshots.length} capture(s) disponible(s)</p>`;
      html += '</div>';
    }
    
    if (payload.notes) {
      html += `<p class="notes">${payload.notes}</p>`;
    }
    
    return html;
  }

  /** Renderer pour module Media Gallery */
  private static renderMediaGallery(payload: any): string {
    let html = "";
    
    if (payload.description) {
      html += `<p class="description">${payload.description}</p>`;
    }
    
    if (payload.items && payload.items.length > 0) {
      html += '<div class="media-grid">';
      payload.items.forEach((item: any) => {
        html += '<div class="media-item">';
        html += `<p class="caption">${item.caption}</p>`;
        if (item.date) html += `<p class="date">${item.date}</p>`;
        if (item.source) html += `<p class="source">Source: ${item.source}</p>`;
        html += '</div>';
      });
      html += '</div>';
    }
    
    return html;
  }

  /** Renderer pour module Data Retention */
  private static renderDataRetention(payload: any): string {
    if (!payload.datasets || payload.datasets.length === 0) return "";

    let html = '<div class="datasets-list">';
    payload.datasets.forEach((dataset: any) => {
      html += '<div class="dataset-card">';
      html += `<h4>${dataset.label}</h4>`;
      html += `<p>${dataset.description}</p>`;
      html += `<p class="retention-policy"><strong>Rétention:</strong> ${dataset.retentionPolicy}</p>`;
      if (dataset.location) {
        html += `<p class="location"><strong>Emplacement:</strong> ${dataset.location}</p>`;
      }
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  /** Renderer pour module Conclusions */
  private static renderConclusions(payload: any): string {
    if (!payload.statements || payload.statements.length === 0) return "";

    let html = '<ul class="conclusions-list">';
    payload.statements.forEach((statement: string) => {
      html += `<li>${statement}</li>`;
    });
    html += '</ul>';
    return html;
  }

  /** Renderer pour module Investigation Leads */
  private static renderInvestigationLeads(payload: any): string {
    if (!payload.leads || payload.leads.length === 0) return "";

    let html = '<div class="leads-list">';
    payload.leads.forEach((lead: any) => {
      html += '<div class="lead-card">';
      html += `<h4>${lead.type || "Piste"}</h4>`;
      if (lead.platform) html += `<p><strong>Plateforme:</strong> ${lead.platform}</p>`;
      if (lead.legalBasis) html += `<p><strong>Base légale:</strong> ${lead.legalBasis}</p>`;
      if (lead.dataTargeted && lead.dataTargeted.length > 0) {
        html += `<p><strong>Données visées:</strong> ${lead.dataTargeted.join(", ")}</p>`;
      }
      if (lead.priority) {
        html += `<p class="priority priority-${lead.priority}"><strong>Priorité:</strong> ${lead.priority.toUpperCase()}</p>`;
      }
      if (lead.notes) html += `<p class="notes">${lead.notes}</p>`;
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  /** Renderer pour module Sign Off */
  private static renderSignOff(payload: any): string {
    let html = '<div class="sign-off-block">';
    
    if (payload.date) {
      html += `<p><strong>Date:</strong> ${new Date(payload.date).toLocaleDateString("fr-BE")}</p>`;
    }
    
    if (payload.officer) {
      html += '<div class="officer-info">';
      html += `<p><strong>${payload.officer.name}</strong></p>`;
      html += `<p>${payload.officer.rank}</p>`;
      html += `<p>${payload.officer.unit}</p>`;
      if (payload.officer.badgeNumber) {
        html += `<p>Matricule: ${payload.officer.badgeNumber}</p>`;
      }
      html += '</div>';
    }
    
    if (payload.additionalNotes) {
      html += `<p class="notes">${payload.additionalNotes}</p>`;
    }
    
    html += '</div>';
    return html;
  }

  /** Renderer générique pour Finding[] */
  private static renderFindings(findings: any[]): string {
    let html = '<div class="findings-section">';
    
    findings.forEach((finding: any) => {
      html += '<div class="finding-card">';
      html += `<h4>${finding.label}</h4>`;
      html += `<p>${finding.description}</p>`;
      
      if (finding.confidence) {
        html += `<p class="confidence confidence-${finding.confidence}">Confiance: ${finding.confidence}</p>`;
      }
      
      if (finding.sources && finding.sources.length > 0) {
        html += '<div class="sources"><strong>Sources:</strong><ul>';
        finding.sources.forEach((source: any) => {
          html += `<li>${source.type}: ${source.value}${source.note ? ` (${source.note})` : ""}</li>`;
        });
        html += '</ul></div>';
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }

  /** Renderer générique pour payload inconnu */
  private static renderGeneric(payload: any): string {
    if (!payload || Object.keys(payload).length === 0) return "";
    
    return `<pre class="payload-dump">${JSON.stringify(payload, null, 2)}</pre>`;
  }

  /**
   * Obtenir la configuration du watermark selon la classification
   */
  private static getWatermarkConfig(classification: string): WatermarkConfig | null {
    const configs: Record<string, WatermarkConfig> = {
      RESTRICTED: {
        text: "RESTREINT",
        color: { r: 0, g: 0.5, b: 1 },
        opacity: 0.3,
      },
      CONFIDENTIAL: {
        text: "CONFIDENTIEL",
        color: { r: 1, g: 0.5, b: 0 },
        opacity: 0.4,
      },
      SECRET: {
        text: "SECRET",
        color: { r: 1, g: 0, b: 0 },
        opacity: 0.5,
      },
    };

    return configs[classification] || null;
  }

  /**
   * Ajouter un watermark diagonal au PDF
   */
  private static async addWatermark(
    pdfBuffer: Buffer,
    config: WatermarkConfig
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = 80;

      // Calculer la position du texte en diagonale
      const textWidth = font.widthOfTextAtSize(config.text, fontSize);
      const x = (width - textWidth) / 2;
      const y = height / 2;

      page.drawText(config.text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(config.color.r, config.color.g, config.color.b),
        opacity: config.opacity,
        rotate: degrees(-45),
      });
    }

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Ajouter les métadonnées au PDF
   */
  private static async addMetadata(pdfBuffer: Buffer, report: any): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    pdfDoc.setTitle(`Rapport OSINT - Dossier ${report.caseNumber || report.id}`);
    pdfDoc.setAuthor(
      `${report.owner.firstName} ${report.owner.lastName} - ${report.reportingUnit || "Police Belge"}`
    );
    pdfDoc.setSubject("Rapport d'investigation OSINT");
    pdfDoc.setKeywords([
      "OSINT",
      "Investigation",
      "Police",
      report.classification || "PUBLIC",
    ]);
    pdfDoc.setCreator("OSINTReport v1.0");
    pdfDoc.setProducer("OSINTReport PDF Generator");
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    return Buffer.from(await pdfDoc.save());
  }

  /**
   * Générer le PDF complet d'un rapport
   */
  static async generatePDF(options: GeneratePDFOptions): Promise<Buffer> {
    const startTime = Date.now();
    logger.info({ reportId: options.reportId }, "🔄 Génération PDF démarrée");

    try {
      // 1. Récupérer les données du rapport
      const report = await this.fetchReportData(options.reportId);
      logger.debug("✅ Données du rapport récupérées");

      // 2. Préparer les données pour le template
      const templateData = await this.prepareTemplateData(report, options);
      logger.debug("✅ Données template préparées");

      // 3. Charger et rendre le template HTML
      const template = await this.loadTemplate("report-main");
      const html = template(templateData);
      logger.debug("✅ Template HTML rendu");

      // 4. Générer le PDF avec Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      let pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "1.5cm",
          right: "1.5cm",
          bottom: "1.5cm",
          left: "1.5cm",
        },
      });

      await browser.close();
      logger.debug("✅ PDF généré avec Puppeteer");

      // 5. Ajouter le watermark si nécessaire
      if (options.includeWatermark !== false && templateData.hasClassification) {
        const watermarkConfig = this.getWatermarkConfig(
          report.classification ?? "PUBLIC"
        );
        if (watermarkConfig) {
          pdfBuffer = await this.addWatermark(Buffer.from(pdfBuffer), watermarkConfig);
          logger.debug(`✅ Watermark "${watermarkConfig.text}" ajouté`);
        }
      }

      // 6. Ajouter les métadonnées
      pdfBuffer = await this.addMetadata(Buffer.from(pdfBuffer), report);
      logger.debug("✅ Métadonnées ajoutées");

      const duration = Date.now() - startTime;
      logger.info({ reportId: options.reportId, duration }, "✅ PDF généré avec succès");

      return Buffer.from(pdfBuffer);
    } catch (error) {
      logger.error({ err: error, reportId: options.reportId }, "❌ Erreur génération PDF");
      throw error;
    }
  }

  /**
   * Générer le nom de fichier pour le PDF
   */
  static generateFilename(report: { caseNumber?: string; reportNumber?: string }): string {
    const date = new Date().toISOString().split("T")[0];
    const caseNum = report.caseNumber?.replace(/[^a-zA-Z0-9]/g, "_") || "NOCASE";
    const reportNum = report.reportNumber?.replace(/[^a-zA-Z0-9]/g, "_") || "NOREPORT";

    return `OSINT_${caseNum}_${reportNum}_${date}.pdf`;
  }
}
