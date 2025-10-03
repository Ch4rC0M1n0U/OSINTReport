export const REPORT_MODULE_TYPES = [
  "summary",
  "entities",
  "objectives",
  "research_summary",
  "entity_overview",
  "identifier_lookup",
  "platform_analysis",
  "media_gallery",
  "data_retention",
  "conclusions",
  "investigation_leads",
  "sign_off",
] as const;

export type ReportModuleType = (typeof REPORT_MODULE_TYPES)[number];

/**
 * Métadonnées pour chaque type de module
 * Utilisé pour l'affichage et l'ordre dans l'interface
 */
export const MODULE_TYPE_METADATA: Record<
  ReportModuleType,
  {
    label: string;
    icon: string;
    description: string;
    order: number;
  }
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

export const REPORT_ATTACHMENT_TYPES = ["image", "document", "link"] as const;
export type ReportAttachmentType = (typeof REPORT_ATTACHMENT_TYPES)[number];

export const REPORT_ORDERABLE_FIELDS = ["issuedAt", "createdAt", "updatedAt"] as const;
export type ReportOrderField = (typeof REPORT_ORDERABLE_FIELDS)[number];
