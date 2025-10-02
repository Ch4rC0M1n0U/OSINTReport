# Plan de développement - Système de rapports OSINT complet

## 📋 État actuel de l'architecture

### ✅ Déjà implémenté

**Base de données (Prisma + PostgreSQL)**
- ✅ Système d'authentification complet avec JWT
- ✅ Gestion des utilisateurs (User, Role, Permission)
- ✅ Récupération de mot de passe par email
- ✅ Configuration SMTP dans le panel admin
- ✅ Modèle de base pour Report avec statuts (DRAFT, PUBLISHED, ARCHIVED)
- ✅ ReportModule pour structurer les rapports
- ✅ Entity avec types (PERSON, ORGANIZATION, TELEPHONE, EMAIL, etc.)
- ✅ ResearchRecord pour les recherches OSINT
- ✅ VaultItem pour stocker les données sensibles chiffrées
- ✅ AuditLog pour traçabilité
- ✅ ReportAttachment pour fichiers joints
- ✅ ReportVersion pour historique

**Backend API**
- ✅ Modules : auth, users, reports (basique), email, smtp
- ✅ Middleware d'authentification
- ✅ Gestion des permissions

**Frontend (Vue 3 + DaisyUI)**
- ✅ Pages : Login, Register, Dashboard, Profile
- ✅ Menu d'administration
- ✅ Liste des rapports (basique)
- ✅ Configuration SMTP

### 🔧 À développer

**Nouveau dans le schéma de données**
- 🔄 Enrichir Report avec champs spécifiques police belge
- 🆕 Table de corrélation (ReportCorrelation)
- 🆕 Métadonnées pour Meilisearch (SearchableContent)

**Backend**
- 🆕 API complète de création/édition de rapports
- 🆕 Service de détection de corrélations
- 🆕 Service Meilisearch
- 🆕 Service d'export PDF

**Frontend**
- 🆕 Interface de création de rapport (multi-étapes)
- 🆕 Interface de recherche Meilisearch
- 🆕 Visualisation des corrélations
- 🆕 Prévisualisation et export PDF

## 🎯 Phase 1 : Extension du modèle de données

### 1.1 Enrichissement du modèle Report

Le modèle Report actuel a déjà beaucoup de champs. On va ajouter :

```prisma
model Report {
  // ... champs existants ...
  
  // Nouveaux champs spécifiques
  investigationContext String?       // Contexte de l'enquête
  legalBasis          String?        // Base légale
  urgencyLevel        String?        // Niveau d'urgence
  classification      String?        // Classification du rapport
  keywords            String[]       // Mots-clés pour recherche
  
  // Relations nouvelles
  correlations        ReportCorrelation[] @relation("SourceReport")
  correlatedBy        ReportCorrelation[] @relation("RelatedReport")
  searchableContent   SearchableContent?
}
```

### 1.2 Table de corrélation

Détecter automatiquement les liens entre rapports :

```prisma
model ReportCorrelation {
  id              String   @id @default(uuid())
  sourceReportId  String
  relatedReportId String
  correlationType String   // "PHONE", "EMAIL", "ADDRESS", "NAME", "CASE_NUMBER"
  correlationData String   // La donnée qui lie (ex: "+32123456789")
  confidence      Float    @default(1.0) // Score de confiance
  createdAt       DateTime @default(now())
  
  sourceReport  Report @relation("SourceReport", fields: [sourceReportId], references: [id])
  relatedReport Report @relation("RelatedReport", fields: [relatedReportId], references: [id])
  
  @@unique([sourceReportId, relatedReportId, correlationType, correlationData])
  @@index([correlationData])
  @@index([correlationType])
}
```

### 1.3 Contenu indexable pour Meilisearch

```prisma
model SearchableContent {
  id            String   @id @default(uuid())
  reportId      String   @unique
  contentHash   String   // Hash du contenu pour détecter les changements
  indexedAt     DateTime @default(now())
  
  // Contenu dénormalisé pour Meilisearch
  fullText      String   // Tout le texte du rapport
  entities      Json     // Liste des entités extraites
  metadata      Json     // Métadonnées pour filtres
  
  report Report @relation(fields: [reportId], references: [id], onDelete: Cascade)
  
  @@index([indexedAt])
}
```

## 🎯 Phase 2 : Backend - API de rapports enrichie

### 2.1 Structure des endpoints

```
POST   /api/reports                    # Créer un rapport
GET    /api/reports                    # Lister avec filtres/recherche
GET    /api/reports/:id                # Détails d'un rapport
PUT    /api/reports/:id                # Modifier un rapport
DELETE /api/reports/:id                # Supprimer (soft delete)
POST   /api/reports/:id/publish        # Publier un rapport
POST   /api/reports/:id/archive        # Archiver un rapport

# Modules du rapport
POST   /api/reports/:id/modules        # Ajouter un module
PUT    /api/reports/:id/modules/:moduleId  # Modifier un module
DELETE /api/reports/:id/modules/:moduleId  # Supprimer un module
POST   /api/reports/:id/modules/reorder    # Réorganiser les modules

# Entités
POST   /api/entities                   # Créer une entité
GET    /api/entities                   # Rechercher des entités
GET    /api/entities/:id               # Détails d'une entité

# Recherches OSINT
POST   /api/reports/:id/modules/:moduleId/research  # Ajouter une recherche
PUT    /api/research/:id               # Modifier une recherche
DELETE /api/research/:id               # Supprimer une recherche

# Corrélations
GET    /api/reports/:id/correlations   # Obtenir les rapports liés
POST   /api/correlations/detect        # Détecter les corrélations manuellement
GET    /api/correlations/search        # Rechercher par donnée (téléphone, email, etc.)

# Export
POST   /api/reports/:id/export/pdf     # Générer le PDF
GET    /api/reports/:id/export/pdf/:exportId  # Télécharger le PDF

# Recherche globale
GET    /api/search                     # Recherche Meilisearch
GET    /api/search/suggestions         # Suggestions de recherche
```

### 2.2 Service de corrélation automatique

```typescript
// backend/src/modules/correlations/correlation.service.ts

class CorrelationService {
  // Extraire les données corrélables d'un rapport
  static async extractCorrelationData(reportId: string) {
    // Extraire : téléphones, emails, adresses, noms, numéros de dossier
    // Retourner une liste de données à corréler
  }
  
  // Détecter les corrélations avec d'autres rapports
  static async detectCorrelations(reportId: string) {
    const data = await this.extractCorrelationData(reportId);
    
    // Pour chaque donnée, chercher dans les autres rapports
    // Créer des ReportCorrelation si trouvé
    // Retourner la liste des corrélations détectées
  }
  
  // Rechercher tous les rapports contenant une donnée spécifique
  static async searchByData(data: string, type: CorrelationType) {
    // Rechercher dans ResearchRecord, Entity, etc.
  }
  
  // Obtenir le graphe de corrélations d'un rapport
  static async getCorrelationGraph(reportId: string, depth: number = 2) {
    // Graphe de corrélations (rapport central + rapports liés + rapports liés aux liés)
  }
}
```

## 🎯 Phase 3 : Intégration Meilisearch

### 3.1 Configuration Docker

Ajouter dans `docker-compose.yml` :

```yaml
services:
  meilisearch:
    image: getmeili/meilisearch:v1.5
    container_name: osintreport-meilisearch
    ports:
      - "7700:7700"
    environment:
      MEILI_ENV: development
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - meilisearch_data:/meili_data
    restart: unless-stopped
    networks:
      - osintreport_network

volumes:
  meilisearch_data:
```

### 3.2 Service d'indexation

```typescript
// backend/src/modules/search/meilisearch.service.ts

import { MeiliSearch } from 'meilisearch';

class MeilisearchService {
  private static client = new MeiliSearch({
    host: process.env.MEILI_HOST,
    apiKey: process.env.MEILI_MASTER_KEY,
  });
  
  // Indexer un rapport
  static async indexReport(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        owner: true,
        modules: {
          include: {
            entity: true,
            researchItems: true,
          },
        },
      },
    });
    
    // Préparer le document pour Meilisearch
    const document = {
      id: report.id,
      title: report.title,
      caseNumber: report.caseNumber,
      reportNumber: report.reportNumber,
      purpose: report.purpose,
      summary: report.summary,
      status: report.status,
      owner: {
        id: report.owner.id,
        name: `${report.owner.firstName} ${report.owner.lastName}`,
      },
      issuedAt: report.issuedAt?.getTime(),
      createdAt: report.createdAt.getTime(),
      updatedAt: report.updatedAt.getTime(),
      
      // Contenu fulltext
      fullText: this.buildFullText(report),
      
      // Entités extraites
      entities: report.modules
        .filter(m => m.entity)
        .map(m => ({
          label: m.entity!.label,
          type: m.entity!.type,
        })),
      
      // Mots-clés
      keywords: report.keywords || [],
      
      // Métadonnées filtrables
      requestingService: report.requestingService,
      reportingUnit: report.reportingUnit,
    };
    
    // Indexer dans Meilisearch
    const index = this.client.index('reports');
    await index.addDocuments([document]);
    
    // Sauvegarder dans SearchableContent
    await prisma.searchableContent.upsert({
      where: { reportId: report.id },
      create: {
        reportId: report.id,
        contentHash: this.hashContent(document),
        fullText: document.fullText,
        entities: document.entities,
        metadata: { /* ... */ },
      },
      update: {
        contentHash: this.hashContent(document),
        fullText: document.fullText,
        entities: document.entities,
        metadata: { /* ... */ },
        indexedAt: new Date(),
      },
    });
  }
  
  // Rechercher
  static async search(query: string, filters?: any) {
    const index = this.client.index('reports');
    return await index.search(query, {
      filter: filters,
      attributesToHighlight: ['title', 'purpose', 'summary'],
      attributesToCrop: ['summary'],
      cropLength: 200,
    });
  }
  
  // Suggestions
  static async getSuggestions(query: string) {
    const index = this.client.index('reports');
    return await index.search(query, {
      limit: 5,
      attributesToRetrieve: ['title', 'caseNumber', 'reportNumber'],
    });
  }
}
```

### 3.3 Configuration de l'index Meilisearch

```typescript
// Configuration à lancer au démarrage de l'app
await client.index('reports').updateSettings({
  searchableAttributes: [
    'title',
    'purpose',
    'summary',
    'fullText',
    'caseNumber',
    'reportNumber',
  ],
  filterableAttributes: [
    'status',
    'owner.id',
    'requestingService',
    'reportingUnit',
    'issuedAt',
    'createdAt',
    'entities.type',
  ],
  sortableAttributes: [
    'issuedAt',
    'createdAt',
    'updatedAt',
  ],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
  ],
});
```

## 🎯 Phase 4 : Frontend - Interface de création de rapport

### 4.1 Structure de l'interface (multi-étapes)

```
Page: /reports/new ou /reports/:id/edit

┌─────────────────────────────────────────────────────────────┐
│  Création de rapport OSINT                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ [1. Informations générales] → 2. Entités → 3. Modules │  │
│  │ → 4. Recherches → 5. Révision                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  Étape 1 : Informations générales                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Titre *          [_________________________________]│   │
│  │ N° dossier       [_________________________________]│   │
│  │ N° rapport       [_________________________________]│   │
│  │ Service demandeur [___________] ▼                   │   │
│  │ Unité rapportante [___________] ▼                   │   │
│  │ Période          [__/__/____] - [__/__/____]        │   │
│  │ But de recherche                                     │   │
│  │ [____________________________________________]       │   │
│  │ [____________________________________________]       │   │
│  │ Objectifs (liste)                                    │   │
│  │ • [_______________________________________] [−]      │   │
│  │ • [_______________________________________] [−]      │   │
│  │ [+ Ajouter un objectif]                              │   │
│  │ Dossiers connexes                                    │   │
│  │ [Rechercher un dossier...              ] [🔍]       │   │
│  │ • Dossier #12345 - Vol aggravé       [×]            │   │
│  │ • Dossier #67890 - Fraude            [×]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                    [Suivant →]              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Composants Vue.js à créer

```
frontend/src/pages/reports/
├── ReportCreatePage.vue          # Page principale
├── ReportEditPage.vue            # Édition
├── ReportViewPage.vue            # Visualisation
└── components/
    ├── ReportWizard.vue          # Wizard multi-étapes
    ├── steps/
    │   ├── GeneralInfoStep.vue   # Étape 1
    │   ├── EntitiesStep.vue      # Étape 2
    │   ├── ModulesStep.vue       # Étape 3
    │   ├── ResearchStep.vue      # Étape 4
    │   └── ReviewStep.vue        # Étape 5
    ├── EntitySelector.vue        # Sélecteur d'entité
    ├── ModuleEditor.vue          # Éditeur de module
    ├── ResearchForm.vue          # Formulaire de recherche
    ├── CorrelationAlert.vue      # Alerte de corrélation
    └── RelatedReportsPanel.vue   # Panneau des rapports liés
```

### 4.3 Détection de corrélations en temps réel

Lors de la saisie d'un numéro de téléphone, email, etc. :

```vue
<template>
  <div class="form-control">
    <label class="label">
      <span class="label-text">Numéro de téléphone</span>
    </label>
    <input
      v-model="phoneNumber"
      @input="checkCorrelations"
      type="tel"
      class="input input-bordered"
      :class="{ 'input-warning': hasCorrelations }"
    />
    
    <!-- Alerte de corrélation -->
    <CorrelationAlert
      v-if="correlations.length > 0"
      :correlations="correlations"
      :data="phoneNumber"
      type="PHONE"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { debounce } from 'lodash-es';
import { api } from '@/services/http';

const phoneNumber = ref('');
const correlations = ref([]);
const hasCorrelations = computed(() => correlations.value.length > 0);

const checkCorrelations = debounce(async () => {
  if (phoneNumber.value.length < 8) return;
  
  try {
    const response = await api.get('/correlations/search', {
      params: {
        data: phoneNumber.value,
        type: 'PHONE',
      },
    });
    
    correlations.value = response.data.reports;
  } catch (error) {
    console.error('Erreur de vérification des corrélations', error);
  }
}, 500);
</script>
```

## 🎯 Phase 5 : Export PDF

### 5.1 Service backend

```typescript
// backend/src/modules/export/pdf.service.ts

import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';

class PdfExportService {
  static async generateReportPdf(reportId: string): Promise<string> {
    const report = await this.fetchReportData(reportId);
    
    // Créer le PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: report.title,
        Author: `${report.owner.firstName} ${report.owner.lastName}`,
        Subject: 'Rapport OSINT',
        Keywords: report.keywords?.join(', '),
      },
    });
    
    const pdfPath = `/tmp/report-${reportId}-${Date.now()}.pdf`;
    doc.pipe(createWriteStream(pdfPath));
    
    // En-tête officiel
    this.addOfficialHeader(doc, report);
    
    // Contenu
    this.addGeneralInfo(doc, report);
    this.addObjectives(doc, report);
    this.addModules(doc, report);
    this.addSignature(doc, report);
    
    // Pied de page
    this.addPageNumbers(doc);
    
    doc.end();
    
    return pdfPath;
  }
  
  private static addOfficialHeader(doc: PDFKit.PDFDocument, report: any) {
    doc.image('assets/logo-police-belge.png', 50, 50, { width: 100 });
    
    doc.fontSize(16).text('POLICE FÉDÉRALE', { align: 'center' });
    doc.fontSize(14).text('RAPPORT D\'ENQUÊTE OSINT', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(10).text(`Rapport N° ${report.reportNumber || 'N/A'}`, { align: 'right' });
    doc.text(`Date : ${new Date(report.issuedAt).toLocaleDateString('fr-BE')}`, { align: 'right' });
    doc.moveDown(2);
  }
  
  private static addGeneralInfo(doc: PDFKit.PDFDocument, report: any) {
    doc.fontSize(12).text('INFORMATIONS GÉNÉRALES', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    doc.text(`Dossier : ${report.caseNumber || 'N/A'}`);
    doc.text(`Service demandeur : ${report.requestingService || 'N/A'}`);
    doc.text(`Unité rapportante : ${report.reportingUnit || 'N/A'}`);
    
    if (report.dateRangeStart && report.dateRangeEnd) {
      doc.text(`Période : ${new Date(report.dateRangeStart).toLocaleDateString('fr-BE')} - ${new Date(report.dateRangeEnd).toLocaleDateString('fr-BE')}`);
    }
    
    doc.moveDown();
    doc.text('But de la recherche :', { underline: true });
    doc.text(report.purpose || 'Non spécifié');
    doc.moveDown(2);
  }
  
  // ... autres méthodes
}
```

### 5.2 Template PDF professionnel

Structure du PDF généré :

```
┌─────────────────────────────────────────────────────┐
│  [LOGO]              POLICE FÉDÉRALE                │
│              RAPPORT D'ENQUÊTE OSINT                │
│                                      N° XXXX/2025   │
│─────────────────────────────────────────────────────│
│                                                     │
│  INFORMATIONS GÉNÉRALES                             │
│  Dossier : RN.12.3456.789                          │
│  Service demandeur : Judiciaire Bruxelles          │
│  Unité rapportante : OSINT Unit                    │
│  Période : 01/01/2025 - 31/01/2025                 │
│                                                     │
│  But de la recherche :                              │
│  Identifier les personnes impliquées dans...        │
│                                                     │
│  OBJECTIFS DE LA RECHERCHE                          │
│  1. Identifier les numéros de téléphone associés   │
│  2. Établir les liens avec d'autres suspects       │
│  3. Cartographier le réseau social                 │
│                                                     │
│  ENTITÉS CONCERNÉES                                 │
│  • DUPONT Jean (Personne) - Suspect principal      │
│  • +32 123 456 789 (Téléphone) - Contact suspect  │
│  • jean.dupont@email.be (Email) - Adresse suspecte│
│                                                     │
│  MODULE 1 : RECHERCHE TÉLÉPHONE                     │
│  Entité : +32 123 456 789                          │
│                                                     │
│  Recherches déployées :                             │
│  • Base de données opérateur (Proximus)            │
│    Résultat : Abonné identifié, adresse confirmée │
│  • Réseaux sociaux (Facebook, Instagram)           │
│    Résultat : Profil actif trouvé, photos...      │
│                                                     │
│  [Suite des modules...]                             │
│                                                     │
│─────────────────────────────────────────────────────│
│  Fait à Bruxelles, le 02/10/2025                   │
│  L'officier rapporteur,                             │
│  [Signature]                                        │
│  Inspecteur principal MARTIN Pierre                 │
│                                              Page 1 │
└─────────────────────────────────────────────────────┘
```

## 🎯 Phase 6 : Interface de recherche globale

### 6.1 Page de recherche

```vue
<!-- frontend/src/pages/search/GlobalSearchPage.vue -->
<template>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-6">Recherche globale</h1>
    
    <!-- Barre de recherche -->
    <div class="form-control mb-6">
      <div class="input-group">
        <input
          v-model="searchQuery"
          @input="search"
          type="text"
          placeholder="Rechercher dans les rapports..."
          class="input input-bordered input-lg flex-1"
        />
        <button class="btn btn-square btn-lg btn-primary">
          <span class="material-symbols-rounded">search</span>
        </button>
      </div>
      
      <!-- Suggestions -->
      <div v-if="suggestions.length > 0" class="menu bg-base-200 rounded-box mt-2">
        <li v-for="suggestion in suggestions" :key="suggestion.id">
          <a @click="selectSuggestion(suggestion)">
            {{ suggestion.title }} - {{ suggestion.caseNumber }}
          </a>
        </li>
      </div>
    </div>
    
    <!-- Filtres -->
    <div class="collapse bg-base-200 mb-4">
      <input type="checkbox" />
      <div class="collapse-title font-medium">
        Filtres avancés
      </div>
      <div class="collapse-content">
        <div class="grid grid-cols-3 gap-4">
          <select v-model="filters.status" class="select select-bordered">
            <option value="">Tous les statuts</option>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
          
          <input
            v-model="filters.service"
            type="text"
            placeholder="Service demandeur"
            class="input input-bordered"
          />
          
          <input
            v-model="filters.dateFrom"
            type="date"
            class="input input-bordered"
          />
        </div>
      </div>
    </div>
    
    <!-- Résultats -->
    <div v-if="loading" class="flex justify-center p-8">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else-if="results.length > 0" class="space-y-4">
      <div
        v-for="result in results"
        :key="result.id"
        class="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer"
        @click="viewReport(result.id)"
      >
        <div class="card-body">
          <h2 class="card-title">
            {{ result.title }}
            <div class="badge badge-primary">{{ result.status }}</div>
          </h2>
          
          <div class="text-sm text-base-content/70">
            <span v-if="result.caseNumber">Dossier : {{ result.caseNumber }}</span>
            <span v-if="result.reportNumber"> • Rapport : {{ result.reportNumber }}</span>
          </div>
          
          <p v-html="result._formatted?.summary" class="line-clamp-3"></p>
          
          <div class="card-actions justify-end items-center mt-2">
            <div class="text-xs text-base-content/60">
              {{ new Date(result.createdAt).toLocaleDateString('fr-BE') }}
            </div>
            <div class="flex gap-1">
              <div
                v-for="entity in result.entities?.slice(0, 3)"
                :key="entity.label"
                class="badge badge-sm badge-ghost"
              >
                {{ entity.label }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="searchQuery" class="text-center p-8 text-base-content/60">
      Aucun résultat trouvé pour "{{ searchQuery }}"
    </div>
  </div>
</template>
```

## 📅 Planning de développement

### Sprint 1 (5 jours) : Fondations
- [ ] Extension du schéma Prisma (Report, Correlation, SearchableContent)
- [ ] Migrations de base de données
- [ ] Configuration Meilisearch dans Docker
- [ ] API basique de création de rapport

### Sprint 2 (5 jours) : Corrélations
- [ ] Service de détection de corrélations
- [ ] API de recherche de corrélations
- [ ] Tests de corrélation automatique
- [ ] Documentation API

### Sprint 3 (7 jours) : Interface de création
- [ ] Composant wizard multi-étapes
- [ ] Formulaires de chaque étape
- [ ] Gestion des entités et modules
- [ ] Intégration API

### Sprint 4 (5 jours) : Meilisearch
- [ ] Service d'indexation backend
- [ ] Hooks d'indexation automatique
- [ ] API de recherche
- [ ] Interface de recherche frontend

### Sprint 5 (5 jours) : Export PDF
- [ ] Service d'export PDF
- [ ] Template professionnel police belge
- [ ] Prévisualisation frontend
- [ ] Download sécurisé

### Sprint 6 (3 jours) : Polish & Tests
- [ ] Tests end-to-end
- [ ] Correction de bugs
- [ ] Documentation utilisateur
- [ ] Déploiement

## 🚀 Technologies utilisées

**Backend**
- Node.js + TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Meilisearch client
- PDFKit ou Puppeteer
- Nodemailer

**Frontend**
- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Pinia (state management)
- DaisyUI + Tailwind CSS
- Vite

**Infrastructure**
- Docker + Docker Compose
- PostgreSQL 16
- Meilisearch 1.5

## 📝 Notes importantes

1. **Sécurité** : Les données sensibles (téléphones, emails) doivent être chiffrées via VaultItem
2. **RGPD** : Prévoir l'anonymisation et la suppression des données
3. **Performance** : Index PostgreSQL sur les champs de corrélation
4. **Audit** : Logger toutes les actions importantes dans AuditLog
5. **Versionning** : Utiliser ReportVersion pour l'historique

---

**Date de création** : 2 octobre 2025  
**Version** : 1.0.0  
**Auteur** : GitHub Copilot
