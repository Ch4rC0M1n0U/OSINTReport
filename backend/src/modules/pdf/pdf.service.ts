/**
 * Service de génération de rapports PDF
 * Utilise Puppeteer pour le rendu HTML → PDF
 * et pdf-lib pour les watermarks et métadonnées
 */

import puppeteer from "puppeteer";
import handlebars from "handlebars";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { readFile } from "fs/promises";
import { join } from "path";
import { logger } from "@/config/logger";
import { prisma } from "@/config/prisma";

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
   * Charger et compiler un template Handlebars
   */
  private static async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
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
  private static prepareTemplateData(report: any, options: GeneratePDFOptions) {
    const now = new Date();

    return {
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
   * Rendre le contenu d'un module
   */
  private static renderModuleContent(module: any): string {
    let content = "";

    // Headline
    if (module.headline) {
      content += `<p class="module-headline">${module.headline}</p>`;
    }

    // Research items
    if (module.researchItems && module.researchItems.length > 0) {
      content += '<div class="research-items">';
      module.researchItems.forEach((item: any) => {
        content += `
          <div class="research-item">
            <h4>${item.researchType?.name || "Recherche"}</h4>
            <p><strong>Entité:</strong> ${item.entity?.name || "N/A"}</p>
            ${item.findings ? `<div class="findings">${item.findings}</div>` : ""}
            ${item.notes ? `<p class="notes">${item.notes}</p>` : ""}
          </div>
        `;
      });
      content += "</div>";
    }

    // Payload générique
    if (module.payload && typeof module.payload === "object") {
      if (module.payload.findings) {
        content += '<div class="findings">';
        content += JSON.stringify(module.payload.findings, null, 2);
        content += "</div>";
      }
    }

    return content;
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
      const templateData = this.prepareTemplateData(report, options);
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
