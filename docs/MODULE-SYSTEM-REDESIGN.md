# Refonte du Système de Modules - Alignement avec le Template

**Date**: 3 octobre 2025  
**Status**: � EN COURS - Phase 3 COMPLÈTE + UX Améliorations

## 📊 Progression Globale

| Phase | Description | Status | Date |
|-------|-------------|--------|------|
| **Phase 1** | Types & Validation | ✅ COMPLET | 3 oct 2025 |
| **Phase 2** | Frontend Types | ✅ COMPLET | 3 oct 2025 |
| **Phase 3** | Composants Simples | ✅ COMPLET | 3 oct 2025 |
| **Phase 3.1** | WYSIWYG Editor | ✅ COMPLET | 3 oct 2025 |
| **Phase 3.2** | Fixes Validation | ✅ COMPLET | 3 oct 2025 |
| **Phase 3.3** | Rendu Markdown | ✅ COMPLET | 3 oct 2025 |
| **Phase 3.4** | Drag & Drop | ✅ COMPLET | 3 oct 2025 |
| **Phase 4** | Composants Avancés | ⏳ EN ATTENTE | - |
| **Phase 5** | Tests & Migration | ⏳ EN ATTENTE | - |

---

## 🆕 Dernières Améliorations UX

### ✅ Phase 3.3 & 3.4 (3 octobre 2025)

**Fonctionnalités ajoutées** :
1. **Rendu Markdown** : Affichage correct du formatage en mode lecture
2. **Drag & Drop** : Réorganisation des modules par glisser-déposer

**Détails** : Voir `docs/DRAG-DROP-MARKDOWN.md`

**Changements** :
- ✅ Nouveau composant `MarkdownRenderer.vue` (utilise `marked`)
- ✅ Intégration dans SummaryModule, ObjectivesModule, ConclusionsModule
- ✅ Drag & Drop avec `vuedraggable` dans ReportDetailPage
- ✅ Poignée de drag (icône hamburger ☰)
- ✅ Sauvegarde automatique de l'ordre via `reportsApi.reorderModules()`

**Tests** : Voir `docs/TEST-DRAG-DROP-MARKDOWN.md`

---

## 🎯 Objectif

Réaligner le système de modules avec la structure documentée dans `report-template.md` pour correspondre aux vrais besoins opérationnels de la Police Belge.

## 📊 Analyse - État Actuel vs État Souhaité

### ❌ État Actuel (Problématique)

**Types de modules actuels** (non conformes) :
```typescript
"summary", "entities", "objectives", "research-summary", 
"research-detail", "identifier-lookup", "media-gallery", 
"data-retention", "conclusions", "investigation", "sign-off"
```

**Problèmes** :
- Types trop génériques et abstraits
- Pas de structure de données claire pour les `findings`
- Payload JSONB libre sans schéma
- Ne correspond pas aux besoins opérationnels réels

### ✅ État Souhaité (Selon Template)

**Nouveaux types de modules** :

| Type | Label | Description | Payload Structure |
|------|-------|-------------|-------------------|
| `summary` | Résumé des faits | Bloc texte riche contexte | `{ content: string }` |
| `entities` | Entités concernées | Liste d'entités liées | `{ entities: EntityRef[] }` |
| `objectives` | Objectifs OSINT | Liste objectifs opérationnels | `{ objectives: string[] }` |
| `research_summary` | Résumé recherches | Résultats globaux + non trouvés | `{ summary: string, notFound: string[], notes: string }` |
| `entity_overview` | Vue d'ensemble entité | Recherches sur une personne/org | `{ entityId: string, context: string, findings: Finding[] }` |
| `identifier_lookup` | Recherche identifiant | Tél/alias/username/email | `{ identifierType: string, identifierValue: string, findings: Finding[] }` |
| `platform_analysis` | Analyse plateforme | Facebook/Instagram/X/WhatsApp | `{ platform: string, findings: Finding[], screenshots: string[] }` |
| `media_gallery` | Galerie média | Collection images avec légendes | `{ items: MediaItem[] }` |
| `data_retention` | Données sauvegardées | Archives connexions/groupes/etc | `{ datasets: Dataset[] }` |
| `conclusions` | Conclusions | Conclusions opérationnelles | `{ statements: string[] }` |
| `investigation_leads` | Pistes d'enquête | Requisitions, plateformes à solliciter | `{ leads: InvestigationLead[] }` |
| `sign_off` | Signature | Date, rédacteur, grade, unité | `{ date: string, officer: Officer }` |

### 🔍 Structure `Finding` (Élément de Résultat)

```typescript
interface Finding {
  label: string;                // Ex: "Profil Facebook"
  description: string;          // Détails du résultat
  confidence?: "confirmed" | "probable" | "possible" | "unknown";
  sources: Source[];            // Références URLs, documents, etc.
  attachments?: string[];       // IDs d'attachements (captures d'écran)
  relatedEntities?: string[];   // IDs d'entités liées
  metadata?: Record<string, any>; // Données supplémentaires
}

interface Source {
  type: "url" | "document" | "database" | "testimony";
  value: string;
  note?: string;                // Ex: "Publication du 30/12/2021"
  accessedAt?: string;          // Date d'accès
}

interface MediaItem {
  attachmentId: string;
  caption: string;
  date?: string;
  source?: string;
}

interface Dataset {
  label: string;
  description: string;
  retentionPolicy: string;      // Ex: "90 jours", "Permanent"
  location?: string;            // Référence stockage
}

interface InvestigationLead {
  type: "requisition" | "platform_contact" | "follow_up";
  platform?: string;
  legalBasis?: string;          // Article de loi
  dataTargeted?: string[];
  priority?: "low" | "medium" | "high";
  notes?: string;
}

interface Officer {
  name: string;
  rank: string;
  unit: string;
  badgeNumber?: string;
}
```

## 🗄️ Modifications Base de Données

### 1. Mise à Jour de l'Enum Prisma

**Fichier** : `backend/prisma/schema.prisma`

```prisma
enum ReportModuleType {
  SUMMARY                 // Résumé des faits
  ENTITIES                // Entités concernées
  OBJECTIVES              // Objectifs OSINT
  RESEARCH_SUMMARY        // Résumé recherches
  ENTITY_OVERVIEW         // Vue d'ensemble entité
  IDENTIFIER_LOOKUP       // Recherche identifiant
  PLATFORM_ANALYSIS       // Analyse plateforme
  MEDIA_GALLERY           // Galerie média
  DATA_RETENTION          // Données sauvegardées
  CONCLUSIONS             // Conclusions
  INVESTIGATION_LEADS     // Pistes d'enquête
  SIGN_OFF                // Signature
}
```

### 2. Pas de Changement Structurel

Le champ `payload` JSONB actuel est parfait pour stocker les structures complexes. On va juste :
- Typer correctement les payloads en TypeScript
- Ajouter validation Zod pour chaque type

## 🔧 Modifications Backend

### 1. Types TypeScript (`backend/src/modules/reports/report.types.ts`)

**NOUVEAU FICHIER** :

```typescript
// Types de base
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
  attachments?: string[];
  relatedEntities?: string[];
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

// Payloads par type de module
export interface SummaryPayload {
  content: string; // Markdown/HTML
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
}

export interface ResearchSummaryPayload {
  summary: string;
  notFound: string[];
  methodology?: string;
  notes?: string;
}

export interface EntityOverviewPayload {
  entityId: string;
  context: string;
  findings: Finding[];
  notes?: string;
}

export interface IdentifierLookupPayload {
  identifierType: "phone" | "email" | "username" | "rrn" | "alias" | "other";
  identifierValue: string;
  findings: Finding[];
  notes?: string;
}

export interface PlatformAnalysisPayload {
  platform: "facebook" | "instagram" | "x" | "whatsapp" | "telegram" | "linkedin" | "tiktok" | "snapchat" | "other";
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
}

export interface ConclusionsPayload {
  statements: string[];
}

export interface InvestigationLeadsPayload {
  leads: InvestigationLead[];
}

export interface SignOffPayload {
  date: string;
  officer: Officer;
  additionalNotes?: string;
}

// Union type pour tous les payloads
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
```

### 2. Validation Zod (`backend/src/modules/reports/report.validation.ts`)

**AJOUTS** :

```typescript
import { z } from "zod";

// Schémas de base
const sourceSchema = z.object({
  type: z.enum(["url", "document", "database", "testimony"]),
  value: z.string().min(1),
  note: z.string().optional(),
  accessedAt: z.string().optional(),
});

const findingSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  confidence: z.enum(["confirmed", "probable", "possible", "unknown"]).optional(),
  sources: z.array(sourceSchema).min(1),
  attachments: z.array(z.string().uuid()).optional(),
  relatedEntities: z.array(z.string().uuid()).optional(),
  metadata: z.record(z.any()).optional(),
});

const mediaItemSchema = z.object({
  attachmentId: z.string().uuid(),
  caption: z.string(),
  date: z.string().optional(),
  source: z.string().optional(),
});

const datasetSchema = z.object({
  label: z.string().min(1),
  description: z.string().min(1),
  retentionPolicy: z.string().min(1),
  location: z.string().optional(),
});

const investigationLeadSchema = z.object({
  type: z.enum(["requisition", "platform_contact", "follow_up"]),
  platform: z.string().optional(),
  legalBasis: z.string().optional(),
  dataTargeted: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  notes: z.string().optional(),
});

const officerSchema = z.object({
  name: z.string().min(1),
  rank: z.string().min(1),
  unit: z.string().min(1),
  badgeNumber: z.string().optional(),
});

// Schémas de payloads par type de module
export const payloadSchemas = {
  summary: z.object({
    content: z.string().min(1),
  }),

  entities: z.object({
    entities: z.array(z.object({
      entityId: z.string().uuid(),
      role: z.string().optional(),
      notes: z.string().optional(),
    })).min(1),
  }),

  objectives: z.object({
    objectives: z.array(z.string().min(1)).min(1),
  }),

  research_summary: z.object({
    summary: z.string().min(1),
    notFound: z.array(z.string()).default([]),
    methodology: z.string().optional(),
    notes: z.string().optional(),
  }),

  entity_overview: z.object({
    entityId: z.string().uuid(),
    context: z.string().min(1),
    findings: z.array(findingSchema).min(1),
    notes: z.string().optional(),
  }),

  identifier_lookup: z.object({
    identifierType: z.enum(["phone", "email", "username", "rrn", "alias", "other"]),
    identifierValue: z.string().min(1),
    findings: z.array(findingSchema).min(1),
    notes: z.string().optional(),
  }),

  platform_analysis: z.object({
    platform: z.enum(["facebook", "instagram", "x", "whatsapp", "telegram", "linkedin", "tiktok", "snapchat", "other"]),
    platformUrl: z.string().url().optional(),
    findings: z.array(findingSchema).min(1),
    screenshots: z.array(z.string().uuid()).optional(),
    notes: z.string().optional(),
  }),

  media_gallery: z.object({
    items: z.array(mediaItemSchema).min(1),
    description: z.string().optional(),
  }),

  data_retention: z.object({
    datasets: z.array(datasetSchema).min(1),
  }),

  conclusions: z.object({
    statements: z.array(z.string().min(1)).min(1),
  }),

  investigation_leads: z.object({
    leads: z.array(investigationLeadSchema).min(1),
  }),

  sign_off: z.object({
    date: z.string(),
    officer: officerSchema,
    additionalNotes: z.string().optional(),
  }),
};

// Validation dynamique selon le type
export function validateModulePayload(type: string, payload: unknown) {
  const schema = payloadSchemas[type as keyof typeof payloadSchemas];
  if (!schema) {
    throw new Error(`Unknown module type: ${type}`);
  }
  return schema.parse(payload);
}
```

### 3. Constantes (`backend/src/modules/reports/report.constants.ts`)

**REMPLACER** :

```typescript
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

// Métadonnées pour chaque type
export const MODULE_TYPE_METADATA = {
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
} as const;
```

## 🎨 Modifications Frontend

### 1. Types (`frontend/src/services/api/reports.ts`)

**SYNCHRONISER avec backend** (même structure que `report.types.ts`).

### 2. Composants de Modules

**NOUVEAUX composants** dans `frontend/src/components/reports/modules/` :

- `SummaryModule.vue`
- `EntitiesModule.vue`
- `ObjectivesModule.vue`
- `ResearchSummaryModule.vue`
- `EntityOverviewModule.vue`
- `IdentifierLookupModule.vue`
- `PlatformAnalysisModule.vue`
- `MediaGalleryModule.vue`
- `DataRetentionModule.vue`
- `ConclusionsModule.vue`
- `InvestigationLeadsModule.vue`
- `SignOffModule.vue`

Chaque composant aura :
- Vue en lecture (affichage formaté)
- Formulaire d'édition structuré

### 3. Formulaires de Création

**REMPLACER le dropdown simple** par un **assistant par type** :

1. Sélection du type de module
2. Formulaire adapté au type
3. Preview en temps réel
4. Validation avant création

## 📋 Migration de Données

### Script de Migration

**Fichier** : `backend/src/scripts/migrate-module-types.ts`

```typescript
// Convertir les anciens types vers les nouveaux
const TYPE_MAPPING = {
  "research-detail": "entity_overview",
  "research-summary": "research_summary",
  "identifier-lookup": "identifier_lookup",
  "media-gallery": "media_gallery",
  "data-retention": "data_retention",
  "sign-off": "sign_off",
  // Les autres restent identiques
};
```

## 🧪 Plan de Tests

1. Tests unitaires pour chaque schéma de validation
2. Tests d'intégration pour création de chaque type de module
3. Tests E2E pour le workflow complet
4. Validation des payloads existants

## 📅 Roadmap d'Implémentation

### Phase 1 : Types et Validation (2h)
- [ ] Créer `report.types.ts` avec toutes les interfaces
- [ ] Mettre à jour `report.validation.ts` avec schémas Zod
- [ ] Mettre à jour `report.constants.ts`
- [ ] Synchroniser types frontend

### Phase 2 : Backend (3h)
- [ ] Mettre à jour `report.controller.ts` pour validation
- [ ] Adapter `report.service.ts` pour nouveaux types
- [ ] Créer helpers de transformation payload
- [ ] Tests unitaires validation

### Phase 3 : Frontend - Composants de Base (4h)
- [ ] Créer structure `components/reports/modules/`
- [ ] Implémenter 3 composants simples (summary, objectives, conclusions)
- [ ] Créer composant `FindingEditor.vue` réutilisable
- [ ] Créer composant `SourceEditor.vue`

### Phase 4 : Frontend - Composants Avancés (6h)
- [ ] Implémenter composants complexes (entity_overview, platform_analysis)
- [ ] Intégrer gestionnaire d'attachements
- [ ] Créer wizard de création de module
- [ ] Preview en temps réel

### Phase 5 : Migration et Tests (2h)
- [ ] Script de migration des données existantes
- [ ] Tests E2E complets
- [ ] Documentation utilisateur

### Phase 6 : Template PDF (2h)
- [ ] Adapter `report-main.hbs` pour nouveaux types
- [ ] Composants Handlebars par type de module
- [ ] Tests génération PDF

**TOTAL ESTIMÉ** : ~19 heures de développement

## 🚀 Priorités

1. **CRITIQUE** : Types et validation (Phase 1)
2. **HAUTE** : Composants de base (summary, objectives, conclusions)
3. **MOYENNE** : Composants avancés
4. **BASSE** : Migration données existantes

---

**QUESTION POUR VALIDATION** :  
Souhaitez-vous que je commence par implémenter cette refonte complète, ou préférez-vous une approche incrémentale (garder les anciens types + ajouter progressivement les nouveaux) ?
