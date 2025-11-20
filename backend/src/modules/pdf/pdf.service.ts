/**
 * Service de génération de rapports PDF
 * Utilise Puppeteer pour le rendu HTML → PDF
 * et pdf-lib pour les watermarks et métadonnées
 */

import puppeteer from "puppeteer";
import handlebars from "handlebars";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { readFile } from "fs/promises";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import axios from "axios";
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

    // Helper pour nettoyer le HTML de TipTap (pas de conversion Markdown)
    handlebars.registerHelper("markdown", function (text: string) {
      if (!text) return "";
      
      // TipTap génère déjà du HTML, on ne fait que nettoyer
      let html = text
        // Nettoyer les caractères de contrôle invisibles
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        // Supprimer les spans vides
        .replace(/<span[^>]*>\s*<\/span>/gi, '')
        .replace(/<span[^>]*>[\s\u200B-\u200D\uFEFF]*<\/span>/gi, '');

      return new handlebars.SafeString(html);
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
            signatureUrl: true,
          },
        },
        modules: {
          where: {
            OR: [
              { includeInPdf: true }, // Modules marqués pour inclusion
              { type: "sign_off" }     // Module sign_off toujours inclus pour la signature
            ]
          },
          orderBy: { position: "asc" },
          include: {
            entity: true,
            researchItems: {
              include: {
                entity: true,
                researchType: true,
              },
            },
            attachments: true, // Charger les pièces jointes (screenshots, etc.)
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
   * Convertir toutes les images d'un HTML en base64
   */
  private static async convertImagesToBase64(html: string): Promise<string> {
    // Regex pour trouver tous les tags <img src="...">
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    const urlsToReplace: { original: string; base64: string }[] = [];

    // Extraire toutes les URLs d'images
    const urls: string[] = [];
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (!url.startsWith('data:')) {
        urls.push(url);
      }
    }

    // Télécharger et convertir chaque image en base64
    for (const url of urls) {
      try {
        logger.debug(`Téléchargement image: ${url.substring(0, 80)}...`);
        
        let buffer: Buffer;
        let contentType: string;
        
        // Détecter si c'est une URL de screenshot local (avec signature)
        // Format: /api/media/screenshot/filename.png?signature=...&expires=...
        if (url.includes('/api/media/screenshot/') || url.includes('/media/screenshot/')) {
          // Extraire le filename de l'URL
          const urlObj = new URL(url, 'http://localhost'); // Base URL pour parser les chemins relatifs
          const pathParts = urlObj.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          
          logger.debug(`🔍 Screenshot détecté: ${filename}`);
          
          // Charger directement depuis le filesystem au lieu de passer par l'URL signée
          const fs = require('fs');
          const path = require('path');
          const screenshotPath = path.join(process.cwd(), 'uploads', 'screenshots', filename);
          
          if (fs.existsSync(screenshotPath)) {
            buffer = fs.readFileSync(screenshotPath);
            
            // Détecter le type MIME depuis l'extension
            const ext = filename.split('.').pop()?.toLowerCase();
            contentType = ext === 'png' ? 'image/png' :
                         ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
                         ext === 'webp' ? 'image/webp' :
                         ext === 'gif' ? 'image/gif' : 'image/png';
            
            logger.debug(`✅ Screenshot chargé depuis filesystem (${contentType}, ${(buffer.length / 1024).toFixed(2)} KB)`);
          } else {
            logger.warn(`⚠️ Fichier screenshot absent: ${screenshotPath}`);
            // Essayer quand même avec l'URL (cas où le fichier a été déplacé)
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            buffer = Buffer.from(response.data, 'binary');
            contentType = response.headers['content-type'] || 'image/png';
          }
        } else {
          // URL classique (externe ou upload standard)
          const response = await axios.get(url, { responseType: 'arraybuffer' });
          buffer = Buffer.from(response.data, 'binary');
          contentType = response.headers['content-type'] || 'image/png';
        }
        
        const base64 = buffer.toString('base64');
        const dataUri = `data:${contentType};base64,${base64}`;
        
        urlsToReplace.push({ original: url, base64: dataUri });
        logger.debug(`✅ Image convertie (${contentType}, ${(base64.length / 1024).toFixed(2)} KB)`);
      } catch (error) {
        logger.warn(`❌ Erreur téléchargement image ${url}: ${error}`);
        // Continuer même si une image échoue
      }
    }

    // Remplacer toutes les URLs par leur version base64
    let modifiedHtml = html;
    for (const { original, base64 } of urlsToReplace) {
      // Échapper les caractères spéciaux dans l'URL pour le regex
      const escapedUrl = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const replaceRegex = new RegExp(escapedUrl, 'g');
      modifiedHtml = modifiedHtml.replace(replaceRegex, base64);
    }

    return modifiedHtml;
  }

  /**
   * Préparer les données pour le template
   */
  private static async prepareTemplateData(report: any, options: GeneratePDFOptions) {
    const now = new Date();
    
    // Récupérer les paramètres système
    const systemSettings = await SettingsService.getSettings();
    
    // Pré-charger toutes les entités référencées dans les modules
    const entityIds: string[] = [];
    report.modules.forEach((module: any) => {
      if (module.type === 'entities' && module.payload?.entities) {
        module.payload.entities.forEach((entry: any) => {
          if (entry.entityId && !entityIds.includes(entry.entityId)) {
            entityIds.push(entry.entityId);
          }
        });
      }
    });
    
    // Charger les entités depuis la base de données
    const entitiesMap = new Map();
    if (entityIds.length > 0) {
      const entities = await prisma.entity.findMany({
        where: { id: { in: entityIds } },
      });
      entities.forEach(entity => {
        entitiesMap.set(entity.id, entity);
      });
    }
    
    // Enrichir les modules avec les entités complètes
    report.modules.forEach((module: any) => {
      if (module.type === 'entities' && module.payload?.entities) {
        module.payload.entities.forEach((entry: any) => {
          if (entry.entityId) {
            entry.entity = entitiesMap.get(entry.entityId);
          }
        });
      }
    });
    
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

    // Préparer la signature de l'utilisateur en base64 (si elle existe)
    let signatureBase64: string | null = null;
    if (report.owner.signatureUrl) {
      try {
        // Le signatureUrl est relatif type "/images/signatures/xxx.png"
        const relativePath = report.owner.signatureUrl.startsWith('/') 
          ? report.owner.signatureUrl.substring(1) 
          : report.owner.signatureUrl;
        
        // Chemin vers frontend/public
        const signaturePath = resolve(join(__dirname, "../../../..", "frontend", "public", relativePath));
        const fs = require('fs');
        
        if (fs.existsSync(signaturePath)) {
          // Convertir l'image en base64
          const imageBuffer = fs.readFileSync(signaturePath);
          const base64Image = imageBuffer.toString('base64');
          signatureBase64 = `data:image/png;base64,${base64Image}`;
          logger.debug(`Signature convertie en base64 (${(base64Image.length / 1024).toFixed(2)} KB)`);
        } else {
          logger.warn(`Signature file not found: ${signaturePath}`);
        }
      } catch (error) {
        logger.error(`Error loading signature: ${error}`);
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
        signatureBase64: signatureBase64,
      },
      officer: options.officerName || `${report.owner.firstName} ${report.owner.lastName}`,
      officerRank: options.officerRank || "Inspecteur",

      // Service
      requestingService: report.requestingService || "PJF Bruxelles",
      reportingUnit: report.reportingUnit || "DR5 - OSINT",

      // Modules
      modules: report.modules.map((module: any) => ({
        title: module.title,
        headline: module.headline || "",
        type: module.type,
        content: this.renderModuleContent(module),
        position: module.position,
      })),

      // Extraire les données du module sign_off pour la signature
      signOffData: (() => {
        const signOffModule = report.modules.find((m: any) => m.type === "sign_off");
        if (signOffModule && signOffModule.payload) {
          return {
            hasSignOff: true,
            date: signOffModule.payload.date 
              ? new Date(signOffModule.payload.date).toLocaleDateString("fr-BE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : null,
            officer: signOffModule.payload.officer || null,
          };
        }
        return { hasSignOff: false, date: null, officer: null };
      })(),

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
        return this.renderEntities(payload, module.entity, module.attachments);
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
        // Le module sign_off n'est plus rendu dans le contenu,
        // il est utilisé uniquement pour la signature en pied de page
        return "";
      default:
        return this.renderGeneric(payload);
    }
  }

  /**
   * Rendre les blocs de texte enrichi (richTextBlocks)
   */
  private static renderRichTextBlocks(richTextBlocks: any[]): string {
    if (!richTextBlocks || richTextBlocks.length === 0) return "";

    let html = '<div class="rich-text-blocks">';
    richTextBlocks.forEach((block: any, index: number) => {
      html += '<div class="rich-text-block">';
      
      if (block.title) {
        html += `<h4 class="block-title">${block.title}</h4>`;
      } else {
        html += `<h4 class="block-title">Bloc de texte ${index + 1}</h4>`;
      }
      
      // Nettoyer le HTML de TipTap
      if (block.content) {
        html += `<div class="block-content">${this.cleanTipTapHtml(block.content)}</div>`;
      }
      
      html += '</div>';
    });
    html += '</div>';
    
    return html;
  }

  /**
   * Convertir les émojis Unicode en images Twemoji base64
   * Télécharge les images PNG depuis le CDN et les convertit en base64
   */
  private static async convertEmojisToBase64Images(html: string): Promise<string> {
    if (!html) return "";
    
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F910}-\u{1F96B}\u{1F980}-\u{1F9E0}]/gu;
    const emojis = html.match(emojiRegex) || [];
    
    // Dédupliquer les emojis
    const uniqueEmojis = [...new Set(emojis)];
    
    // Créer un cache emoji -> base64
    const emojiCache = new Map<string, string>();
    
    // Télécharger et convertir chaque emoji unique
    for (const emoji of uniqueEmojis) {
      const codePoints = [];
      for (let i = 0; i < emoji.length; i++) {
        const code = emoji.codePointAt(i);
        if (code !== undefined) {
          codePoints.push(code.toString(16));
          if (code > 0xFFFF) i++;
        }
      }
      
      const twemojiUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/${codePoints.join('-')}.png`;
      
      try {
        const response = await fetch(twemojiUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          emojiCache.set(emoji, `data:image/png;base64,${base64}`);
        }
      } catch (error) {
        console.warn(`Impossible de charger l'emoji ${emoji}:`, error);
      }
    }
    
    // Remplacer tous les emojis par leurs versions base64
    let result = html;
    for (const [emoji, base64] of emojiCache.entries()) {
      const imgTag = `<img src="${base64}" alt="${emoji}" class="emoji-inline" style="display:inline-block;width:16px;height:16px;vertical-align:-3px;margin:0 2px;" />`;
      result = result.split(emoji).join(imgTag);
    }
    
    return result;
  }



  /**
   * Nettoyer le HTML généré par TipTap pour le PDF
   * TipTap génère du HTML, pas du Markdown - on nettoie uniquement les attributs techniques
   * Les emojis seront convertis en images base64 plus tard dans le processus
   */
  private static cleanTipTapHtml(content: string): string {
    if (!content) return "";
    
    // Le contenu vient de TipTap qui génère déjà du HTML VALIDE
    // On nettoie UNIQUEMENT les attributs techniques de TipTap, RIEN d'autre
    let html = content
      // Convertir les entités de personnes <span data-entity-id="..."> AVANT de nettoyer
      .replace(/<span[^>]*data-entity-id="([^"]*)"[^>]*>([^<]*)<\/span>/gi, '<strong class="entity-mention">$2</strong>')
      // Nettoyer UNIQUEMENT les attributs data-* de TipTap (pas les balises)
      .replace(/\sdata-[a-z-]+="[^"]*"/gi, '')
      // Nettoyer UNIQUEMENT les classes ProseMirror (garder les autres classes)
      .replace(/\sclass="ProseMirror[^"]*"/gi, '')
      .replace(/\sProseMirror-[\w-]+/gi, '')
      // Supprimer UNIQUEMENT les spans vides SANS contenu
      .replace(/<span(?:\s+style="[^"]*")?(?:\s+dir="[^"]*")?(?:\s+role="[^"]*")?\s*>\s*<\/span>/gi, '')
      // Nettoyer UNIQUEMENT les caractères de contrôle invisibles (zero-width spaces)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Supprimer les paragraphes vides qui créent des sauts de lignes parasites
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<p><br\s*\/?><\/p>/gi, '')
      // Supprimer les <br> multiples consécutifs
      .replace(/(<br\s*\/?>){3,}/gi, '<br><br>')
      // Supprimer les <br> au début et à la fin
      .replace(/^(<br\s*\/?>)+/gi, '')
      .replace(/(<br\s*\/?>)+$/gi, '');
    
    // Ne pas convertir les emojis ici - ce sera fait globalement sur le HTML complet
    return html;
  }

  /** Renderer pour module Summary */
  private static renderSummary(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    // Contenu principal
    if (payload.content) {
      html += `<div class="content">${this.cleanTipTapHtml(payload.content)}</div>`;
    }
    
    return html || "<p><em>Aucun résumé disponible</em></p>";
  }

  /** Renderer pour module Entities */
  private static renderEntities(payload: any, linkedEntity: any, attachments: any[] = []): string {
    // Le module peut contenir soit des "entities" (anciennes données), soit des "findings" (nouvelles données)
    const dataSource = payload.findings || payload.entities || [];
    if (dataSource.length === 0) return "";

    let html = '<div class="entities-list">';
    dataSource.forEach((entry: any, index: number) => {
      // Pour les findings: entry.label et entry.metadata
      // Pour les entities: entry.entity.name et entry.entity.metadata
      const entityName = entry.label || entry.entity?.name || entry.name || "Entité";
      const meta = entry.metadata || entry.entity?.metadata;
      
      if (!meta) return; // Pas de métadonnées, on skip

      html += '<div class="entity-card">';
      html += `<h4><span class="entity-number">${index + 1}</span>${entityName}</h4>`;
      
      if (meta) {
        
        // Type d'entité (traduire les codes)
        if (meta.entityType) {
          const typeLabels: Record<string, string> = {
            'person': 'Personne',
            'organization': 'Organisation',
            'company': 'Entreprise',
            'group': 'Groupe',
            'alias': 'Alias',
            'other': 'Autre'
          };
          const typeLabel = typeLabels[meta.entityType] || meta.entityType;
          html += `<div class="field-label">Type</div>`;
          html += `<div class="field-value">${typeLabel}</div>`;
        }
        
        // Alias
        if (meta.aliases && meta.aliases.length > 0) {
          html += `<div class="field-label">Alias / Pseudonymes</div>`;
          html += `<div class="field-value">${meta.aliases.join(", ")}</div>`;
        }
        
        // Détails personne
        if (meta.personDetails) {
          const pd = meta.personDetails;
          
          if (pd.dateOfBirth) {
            html += `<div class="field-label">Date de naissance</div>`;
            html += `<div class="field-value">${pd.dateOfBirth}</div>`;
          }
          
          if (pd.nationalRegistryNumber) {
            html += `<div class="field-label">Numéro de Registre National</div>`;
            html += `<div class="field-value">${pd.nationalRegistryNumber}</div>`;
          }
          
          if (pd.physicalAddress) {
            html += `<div class="field-label">Adresse physique</div>`;
            html += `<div class="field-value">${pd.physicalAddress}</div>`;
          }
          
          if (pd.phoneNumbers && pd.phoneNumbers.length > 0) {
            html += `<div class="field-label">Téléphones</div>`;
            html += `<div class="field-value">${pd.phoneNumbers.join(", ")}</div>`;
          }
        }
        
        // Détails société
        if (meta.companyDetails) {
          const cd = meta.companyDetails;
          
          // Raison sociale
          if (cd.legalName) {
            html += `<div class="field-label">Raison sociale</div>`;
            html += `<div class="field-value">${cd.legalName}</div>`;
          }
          
          // Nom commercial
          if (cd.tradeName) {
            html += `<div class="field-label">Nom commercial</div>`;
            html += `<div class="field-value">${cd.tradeName}</div>`;
          }
          
          // Numéro BCE
          if (cd.bceNumber) {
            html += `<div class="field-label">Numéro BCE</div>`;
            html += `<div class="field-value">${cd.bceNumber}</div>`;
          }
          
          // Numéro d'entreprise (registrationNumber)
          if (cd.registrationNumber) {
            html += `<div class="field-label">Numéro d'entreprise</div>`;
            html += `<div class="field-value">${cd.registrationNumber}</div>`;
          }
          
          // Numéro TVA
          if (cd.vatNumber) {
            html += `<div class="field-label">Numéro de TVA</div>`;
            html += `<div class="field-value">${cd.vatNumber}</div>`;
          }
          
          // Secteur d'activité
          if (cd.industry) {
            html += `<div class="field-label">Secteur d'activité</div>`;
            html += `<div class="field-value">${cd.industry}</div>`;
          }
          
          // Siège social
          if (cd.headquartersAddress) {
            html += `<div class="field-label">Siège social</div>`;
            html += `<div class="field-value">${cd.headquartersAddress}</div>`;
          }
          
          // Adresses d'exploitation (array)
          if (cd.operationalAddresses && cd.operationalAddresses.length > 0) {
            html += `<div class="field-label">Adresses d'exploitation</div>`;
            html += `<div class="field-value">`;
            cd.operationalAddresses.forEach((addr: string, idx: number) => {
              html += `<div style="margin-bottom: 4px;">📍 ${addr}</div>`;
            });
            html += `</div>`;
          }
          
          // Site web
          if (cd.website) {
            html += `<div class="field-label">Site web</div>`;
            html += `<div class="field-value"><a href="${cd.website}">${cd.website}</a></div>`;
          }
          
          // Email de l'entreprise
          if (cd.email) {
            html += `<div class="field-label">Email</div>`;
            html += `<div class="field-value"><a href="mailto:${cd.email}">${cd.email}</a></div>`;
          }
          
          // Téléphones
          if (cd.phoneNumbers && cd.phoneNumbers.length > 0) {
            html += `<div class="field-label">Téléphones</div>`;
            html += `<div class="field-value">${cd.phoneNumbers.join(", ")}</div>`;
          }
        }
      }
      
      // Description (pour les findings)
      if (entry.description) {
        html += `<div class="field-label">Description</div>`;
        html += `<div class="field-value">${entry.description}</div>`;
      }
      
      // Niveau de confiance
      if (entry.confidence) {
        const confidenceLabels: Record<string, string> = {
          'confirmed': 'Confirmé',
          'probable': 'Probable',
          'possible': 'Possible',
          'unknown': 'Inconnu'
        };
        const confidenceLabel = confidenceLabels[entry.confidence] || entry.confidence;
        html += `<div class="field-label">Niveau de confiance</div>`;
        html += `<div class="field-value"><span class="confidence confidence-${entry.confidence}">${confidenceLabel}</span></div>`;
      }
      
      // Sources
      if (entry.sources && entry.sources.length > 0) {
        html += `<div class="field-label">Sources</div>`;
        html += `<div class="field-value">`;
        html += '<ul style="margin: 0; padding-left: 20px;">';
        entry.sources.forEach((source: any) => {
          if (typeof source === 'string') {
            html += `<li>${source}</li>`;
          } else {
            let sourceText = '';
            if (source.type) sourceText += `${source.type}: `;
            if (source.value) sourceText += source.value;
            if (source.url) sourceText += ` (<a href="${source.url}">${source.url}</a>)`;
            if (source.date) sourceText += ` - ${new Date(source.date).toLocaleDateString('fr-BE')}`;
            if (source.note) sourceText += ` - ${source.note}`;
            html += `<li>${sourceText}</li>`;
          }
        });
        html += '</ul>';
        html += `</div>`;
      }
      
      // Rôle
      if (entry.role) {
        html += `<div class="field-label">Rôle</div>`;
        html += `<div class="field-value">${entry.role}</div>`;
      }
      
      // Notes
      if (entry.notes) {
        html += `<div class="field-label">Notes</div>`;
        html += `<div class="field-value notes">${entry.notes}</div>`;
      }
      
      // Pièces jointes dans le finding
      if (entry.attachments && entry.attachments.length > 0) {
        html += `<div class="attachments-section" style="margin-top: 20px;">`;
        html += `<h5>📎 Pièces jointes (${entry.attachments.length})</h5>`;
        
        entry.attachments.forEach((attachmentUrl: string, idx: number) => {
          // Les URLs contiennent déjà le domaine complet, on les utilise telles quelles
          // Elles seront converties en base64 par convertImagesToBase64() plus tard
          html += '<div class="attachment-container">';
          html += `<img src="${attachmentUrl}" class="attachment-image" alt="Capture d'écran ${idx + 1}" />`;
          html += `<div class="attachment-caption"><span class="attachment-number">#${idx + 1}</span>Capture d'écran - ${entityName}</div>`;
          html += '</div>';
        });
        
        html += '</div>';
        html += '</div>';
      }
      
      html += '</div>';
    });
    
    // Captures d'écran / Pièces jointes du module (en dehors de la boucle d'entités)
    if (attachments && attachments.length > 0) {
      html += `<div class="attachments-section">`;
      html += `<h5>Pièces jointes du module (${attachments.length})</h5>`;
      
      attachments.forEach((attachment: any, idx: number) => {
        // Construire l'URL complète de la pièce jointe
        const imageUrl = `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/${attachment.storageKey}`;
        
        html += '<div class="attachment-container">';
        html += `<img src="${imageUrl}" class="attachment-image" alt="${attachment.caption || 'Pièce jointe'}" />`;
        
        if (attachment.caption) {
          html += `<div class="attachment-caption"><span class="attachment-number">#${idx + 1}</span>${attachment.caption}</div>`;
        } else {
          html += `<div class="attachment-caption"><span class="attachment-number">#${idx + 1}</span>Pièce jointe</div>`;
        }
        
        html += '</div>';
      });
      
      html += '</div>';
    }

    html += '</div>';
    return html;
  }  /** Renderer pour module Objectives */
  private static renderObjectives(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    // Liste des objectifs
    if (payload.objectives && payload.objectives.length > 0) {
      html += '<ul class="objectives-list">';
      payload.objectives.forEach((obj: string) => {
        html += `<li>${obj}</li>`;
      });
      html += '</ul>';
    }
    
    return html || "<p><em>Aucun objectif défini</em></p>";
  }

  /** Renderer pour module Research Summary */
  private static renderResearchSummary(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    if (payload.summary) {
      html += `<div class="summary-text">${this.cleanTipTapHtml(payload.summary)}</div>`;
    }
    
    if (payload.methodology) {
      html += '<div class="methodology">';
      html += '<h4>Méthodologie</h4>';
      html += `<div>${this.cleanTipTapHtml(payload.methodology)}</div>`;
      html += '</div>';
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
    
    if (payload.notes) {
      html += `<div class="notes-section"><h4>Notes complémentaires</h4><div>${this.cleanTipTapHtml(payload.notes)}</div></div>`;
    }
    
    return html || "<p><em>Aucun contenu</em></p>";
  }

  /** Renderer pour module Entity Overview */
  private static renderEntityOverview(payload: any, entity: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    if (entity) {
      html += `<div class="entity-header"><h4>${entity.name}</h4></div>`;
    }
    
    if (payload.context) {
      html += `<div class="context">${this.cleanTipTapHtml(payload.context)}</div>`;
    }
    
    if (payload.findings && payload.findings.length > 0) {
      html += this.renderFindings(payload.findings);
    }
    
    if (payload.notes) {
      html += `<p class="notes">${this.cleanTipTapHtml(payload.notes)}</p>`;
    }
    
    return html || "<p><em>Aucune information</em></p>";
  }

  /** Renderer pour module Identifier Lookup */
  private static renderIdentifierLookup(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    if (payload.identifierValue) {
      html += `<p><strong>${payload.identifierType || "Identifiant"}:</strong> ${payload.identifierValue}</p>`;
    }
    
    if (payload.findings && payload.findings.length > 0) {
      html += this.renderFindings(payload.findings);
    }
    
    if (payload.notes) {
      html += `<p class="notes">${this.cleanTipTapHtml(payload.notes)}</p>`;
    }
    
    return html || "<p><em>Aucune recherche effectuée</em></p>";
  }

  /** Renderer pour module Platform Analysis */
  private static renderPlatformAnalysis(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
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
      html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin-top: 10px;">';
      payload.screenshots.forEach((screenshot: any) => {
        const imageUrl = typeof screenshot === 'string' ? screenshot : screenshot.url;
        const caption = typeof screenshot === 'object' && screenshot.caption ? screenshot.caption : '';
        html += '<div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">';
        html += `<img src="${imageUrl}" style="width: 100%; height: auto; display: block;" alt="Screenshot" />`;
        if (caption) {
          html += `<p style="padding: 8px; margin: 0; font-size: 12px; background: #f5f5f5;">${caption}</p>`;
        }
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    }
    
    if (payload.notes) {
      html += `<p class="notes">${this.cleanTipTapHtml(payload.notes)}</p>`;
    }
    
    return html || "<p><em>Aucune analyse de plateforme</em></p>";
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
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    // Liste des datasets
    if (payload.datasets && payload.datasets.length > 0) {
      html += '<div class="datasets-list">';
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
    }
    
    return html || "<p><em>Aucun dataset enregistré</em></p>";
  }

  /** Renderer pour module Conclusions */
  private static renderConclusions(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    // Contenu principal (Markdown from WysiwygEditor)
    if (payload.content) {
      html += `<div class="conclusions-content">${this.cleanTipTapHtml(payload.content)}</div>`;
    }
    
    // Anciennes "statements" (pour compatibilité)
    if (payload.statements && payload.statements.length > 0) {
      html += '<ul class="conclusions-list">';
      payload.statements.forEach((statement: string) => {
        html += `<li>${statement}</li>`;
      });
      html += '</ul>';
    }
    
    return html || "<p><em>Aucune conclusion</em></p>";
  }

  /** Renderer pour module Investigation Leads */
  private static renderInvestigationLeads(payload: any): string {
    let html = "";
    
    // Blocs de texte enrichi
    if (payload.richTextBlocks && payload.richTextBlocks.length > 0) {
      html += this.renderRichTextBlocks(payload.richTextBlocks);
    }
    
    // Liste des pistes
    if (payload.leads && payload.leads.length > 0) {
      html += '<div class="leads-list">';
      payload.leads.forEach((lead: any, index: number) => {
        html += '<div class="lead-card">';
        html += `<h4>Piste ${index + 1}: ${lead.type || "Piste d'enquête"}</h4>`;
        if (lead.platform) html += `<p><strong>Plateforme:</strong> ${lead.platform}</p>`;
        if (lead.legalBasis) html += `<p><strong>Base légale:</strong> ${lead.legalBasis}</p>`;
        if (lead.dataTargeted && lead.dataTargeted.length > 0) {
          html += `<p><strong>Données visées:</strong> ${lead.dataTargeted.join(", ")}</p>`;
        }
        if (lead.priority) {
          const priorityLabels: Record<string, string> = {
            high: "Haute",
            medium: "Moyenne",
            low: "Basse"
          };
          html += `<p class="priority priority-${lead.priority}"><strong>Priorité:</strong> ${priorityLabels[lead.priority] || lead.priority}</p>`;
        }
        if (lead.notes) html += `<p class="notes">${lead.notes}</p>`;
        html += '</div>';
      });
      html += '</div>';
    }
    
    return html || "<p><em>Aucune piste d'enquête</em></p>";
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

  /**
   * Mapper les labels de champs vers leurs émojis correspondants
   */
  private static getEmojiForLabel(label: string): string {
    const emojiMap: Record<string, string> = {
      "Nom du profil / Username": "👤",
      "Username": "👤",
      "Niveau de confiance": "✅",
      "Statut de vérification": "🔒",
      "Type d'entité": "🏷️",
      "Type": "🏷️",
      "Date de naissance": "📅",
      "Localisation": "📍",
      "Email": "📧",
      "Téléphone": "📞",
      "Site web": "🌐",
      "Plateforme": "📱",
      "URL du profil": "🔗",
      "Statut du compte": "💼",
      "Abonnés": "👥",
      "Abonnements": "👥",
      "Compte créé le": "📅",
      "Numéro de Registre National": "🆔",
      "Adresse physique": "📍",
      "Sources": "📚",
      "Pièces jointes": "📎"
    };
    
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (label.includes(key) || key.includes(label)) {
        return emoji + " ";
      }
    }
    
    return "";
  }

  /** Renderer générique pour Finding[] */
  private static renderFindings(findings: any[]): string {
    let html = '<div class="findings-section">';
    
    findings.forEach((finding: any, index: number) => {
      html += '<div class="finding-card">';
      
      // Titre avec numérotation
      html += `<h4><span class="finding-number">${index + 1}</span>${finding.label || "Finding"}</h4>`;
      
      // Description
      if (finding.description) {
        html += `<p class="finding-description">${finding.description}</p>`;
      }
      
      // Tableau des métadonnées
      html += '<table class="finding-table">';
      
      // Type d'entité (pour les profils)
      if (finding.type) {
        html += '<tr>';
        html += `<td class="label-col">Type d'entité</td>`;
        html += `<td class="value-col">${finding.type}</td>`;
        html += '</tr>';
      }
      
      // Métadonnées structurées
      if (finding.metadata) {
        const meta = finding.metadata;
        
        // Plateforme
        if (meta.platform) {
          html += '<tr>';
          html += `<td class="label-col">Plateforme</td>`;
          html += `<td class="value-col">${meta.platform.toUpperCase()}</td>`;
          html += '</tr>';
        }
        
        // URL du profil
        if (meta.profileUrl) {
          html += '<tr>';
          html += `<td class="label-col">URL du profil</td>`;
          html += `<td class="value-col"><a href="${meta.profileUrl}">${meta.profileUrl}</a></td>`;
          html += '</tr>';
        }
        
        // Statut du compte
        if (meta.accountStatus) {
          html += '<tr>';
          html += `<td class="label-col">Statut du compte</td>`;
          html += `<td class="value-col">${meta.accountStatus}</td>`;
          html += '</tr>';
        }
        
        // Username / Nom du profil
        if (meta.username) {
          html += '<tr>';
          html += `<td class="label-col">Nom du profil / Username</td>`;
          html += `<td class="value-col">${meta.username}</td>`;
          html += '</tr>';
        }
        
        // Niveau de confiance
        if (finding.confidence || meta.confidence) {
          const conf = finding.confidence || meta.confidence;
          html += '<tr>';
          html += `<td class="label-col">Niveau de confiance</td>`;
          html += `<td class="value-col"><span class="confidence-badge confidence-${conf}">${conf}</span></td>`;
          html += '</tr>';
        }
        
        // Statut de vérification
        if (meta.verified !== undefined) {
          html += '<tr>';
          html += `<td class="label-col">Statut de vérification</td>`;
          html += `<td class="value-col">${meta.verified ? 'Vérifié' : 'Non vérifié'}</td>`;
          html += '</tr>';
        }
        
        // Date de naissance
        if (meta.dateOfBirth) {
          html += '<tr>';
          html += `<td class="label-col">Date de naissance</td>`;
          html += `<td class="value-col">${meta.dateOfBirth}</td>`;
          html += '</tr>';
        }
        
        // Statistiques de followers/abonnés
        if (meta.followersCount !== undefined) {
          html += '<tr>';
          html += `<td class="label-col">Abonnés</td>`;
          html += `<td class="value-col">${meta.followersCount}</td>`;
          html += '</tr>';
        }
        if (meta.followingCount !== undefined) {
          html += '<tr>';
          html += `<td class="label-col">Abonnements</td>`;
          html += `<td class="value-col">${meta.followingCount}</td>`;
          html += '</tr>';
        }
        
        // Date de création du compte
        if (meta.accountCreationDate) {
          html += '<tr>';
          html += `<td class="label-col">Compte créé le</td>`;
          html += `<td class="value-col">${meta.accountCreationDate}</td>`;
          html += '</tr>';
        }
        
        // Localisation
        if (meta.location) {
          html += '<tr>';
          html += `<td class="label-col">Localisation</td>`;
          html += `<td class="value-col">${meta.location}</td>`;
          html += '</tr>';
        }
        
        // Données de contact
        if (meta.contactInfo) {
          const contact = meta.contactInfo;
          if (contact.email) {
            html += '<tr>';
            html += `<td class="label-col">Email</td>`;
            html += `<td class="value-col">${contact.email}</td>`;
            html += '</tr>';
          }
          if (contact.phone) {
            html += '<tr>';
            html += `<td class="label-col">Téléphone</td>`;
            html += `<td class="value-col">${contact.phone}</td>`;
            html += '</tr>';
          }
          if (contact.website) {
            html += '<tr>';
            html += `<td class="label-col">Site web</td>`;
            html += `<td class="value-col"><a href="${contact.website}">${contact.website}</a></td>`;
            html += '</tr>';
          }
        }
        
        // Informations personnelles
        if (meta.personDetails) {
          const pd = meta.personDetails;
          
          if (pd.dateOfBirth) {
            html += '<tr>';
            html += `<td class="label-col">Date de naissance</td>`;
            html += `<td class="value-col">${pd.dateOfBirth}</td>`;
            html += '</tr>';
          }
          
          if (pd.nationalRegistryNumber) {
            html += '<tr>';
            html += `<td class="label-col">Numéro de Registre National</td>`;
            html += `<td class="value-col">${pd.nationalRegistryNumber}</td>`;
            html += '</tr>';
          }
          
          if (pd.physicalAddress) {
            html += '<tr>';
            html += `<td class="label-col">Adresse physique</td>`;
            html += `<td class="value-col">${pd.physicalAddress}</td>`;
            html += '</tr>';
          }
          
          if (pd.phoneNumbers && pd.phoneNumbers.length > 0) {
            html += '<tr>';
            html += `<td class="label-col">Téléphones</td>`;
            html += `<td class="value-col">${pd.phoneNumbers.join(", ")}</td>`;
            html += '</tr>';
          }
        }
      }
      
      // Sources
      if (finding.sources && finding.sources.length > 0) {
        html += '<tr>';
        html += `<td class="label-col">Sources</td>`;
        html += '<td class="value-col"><ul class="sources-list">';
        finding.sources.forEach((source: any) => {
          html += `<li>${source.type}: ${source.value}${source.note ? ` (${source.note})` : ""}</li>`;
        });
        html += '</ul></td>';
        html += '</tr>';
      }
      
      html += '</table>';
      
      // Pièces jointes (images) - en dehors du tableau
      if (finding.attachments && finding.attachments.length > 0) {
        html += `<div class="attachments-section">`;
        html += `<h5>Pièces jointes (${finding.attachments.length})</h5>`;
        const findingLabel = finding.label || "Finding";
        finding.attachments.forEach((attachment: string, idx: number) => {
          html += '<div class="attachment-container">';
          html += `<img src="${attachment}" class="attachment-image" alt="Capture d'écran ${idx + 1}" />`;
          html += `<div class="attachment-caption"><span class="attachment-number">#${idx + 1}</span>Capture d'écran - ${findingLabel}</div>`;
          html += '</div>';
        });
        html += '</div>';
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    
    // Les emojis seront convertis globalement plus tard
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
      let html = template(templateData);
      logger.debug("✅ Template HTML rendu");

      // 3.5 Convertir toutes les images en base64 pour Puppeteer
      html = await this.convertImagesToBase64(html);
      logger.debug("✅ Images converties en base64");

      // 3.6 Convertir tous les emojis en images base64 Twemoji
      html = await this.convertEmojisToBase64Images(html);
      logger.debug("✅ Emojis convertis en images base64");

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
