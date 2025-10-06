# 📄 Session 9 - Améliorations Export PDF

## 🎯 Objectif

Améliorer le système d'export PDF pour supporter **tous les types de modules** avec leur payload structuré, conformément au canevas original du rapport OSINT.

---

## 📋 Modules supportés

Le système PDF supporte maintenant **12 types de modules** avec rendering spécifique :

| Type | Label | Icône | Renderer |
|------|-------|-------|----------|
| `summary` | Résumé des faits | 📋 | `renderSummary()` |
| `entities` | Entités concernées | 👥 | `renderEntities()` |
| `objectives` | Objectifs OSINT | 🎯 | `renderObjectives()` |
| `research_summary` | Résumé des recherches | 📊 | `renderResearchSummary()` |
| `entity_overview` | Vue d'ensemble entité | 🔍 | `renderEntityOverview()` |
| `identifier_lookup` | Recherche d'identifiant | 🔎 | `renderIdentifierLookup()` |
| `platform_analysis` | Analyse de plateforme | 🌐 | `renderPlatformAnalysis()` |
| `media_gallery` | Galerie média | 🖼️ | `renderMediaGallery()` |
| `data_retention` | Données sauvegardées | 💾 | `renderDataRetention()` |
| `conclusions` | Conclusions | ✅ | `renderConclusions()` |
| `investigation_leads` | Pistes d'enquête | 🕵️ | `renderInvestigationLeads()` |
| `sign_off` | Signature | ✍️ | `renderSignOff()` |

---

## 🔧 Modifications apportées

### 1. Backend - `pdf.service.ts`

#### A. Méthode `renderModuleContent()` refactorisée

**Avant** : Rendering générique basique
```typescript
private static renderModuleContent(module: any): string {
  // Traitement minimal avec headline et research items seulement
  // Payload non structuré
}
```

**Après** : Switch case avec renderers spécialisés
```typescript
private static renderModuleContent(module: any): string {
  const type = module.type;
  const payload = module.payload || {};

  switch (type) {
    case "summary": return this.renderSummary(payload);
    case "entities": return this.renderEntities(payload, module.entity);
    case "objectives": return this.renderObjectives(payload);
    // ... 12 types au total
    default: return this.renderGeneric(payload);
  }
}
```

#### B. Renderers spécialisés (12 fonctions)

##### 1. `renderSummary(payload)`
- Affiche le contenu texte riche

```typescript
private static renderSummary(payload: any): string {
  return payload.content 
    ? `<div class="content">${payload.content}</div>` 
    : "";
}
```

##### 2. `renderEntities(payload, linkedEntity)`
- Liste des entités avec cartes détaillées
- Support PersonDetails et CompanyDetails
- Affiche : type, aliases, dates de naissance, RRN, adresse, téléphones, BCE, siège social, site web

```typescript
private static renderEntities(payload: any, linkedEntity: any): string {
  // Boucle sur entities[]
  // Affichage conditionnel de personDetails et companyDetails
  // Format: entity-card avec métadonnées enrichies
}
```

##### 3. `renderObjectives(payload)`
- Liste à puces des objectifs

```typescript
private static renderObjectives(payload: any): string {
  // <ul class="objectives-list">
  //   <li>Objectif 1</li>
  // </ul>
}
```

##### 4. `renderResearchSummary(payload)`
- Résumé global
- Liste "Éléments non trouvés"
- Section méthodologie
- Notes complémentaires

```typescript
private static renderResearchSummary(payload: any): string {
  // summary-text + not-found-section + methodology + notes
}
```

##### 5. `renderEntityOverview(payload, entity)`
- Header avec nom de l'entité
- Contexte
- Findings détaillés
- Notes

##### 6. `renderIdentifierLookup(payload)`
- Type + valeur de l'identifiant (phone, email, RRN, etc.)
- Findings associés
- Notes

##### 7. `renderPlatformAnalysis(payload)`
- Nom de la plateforme (Facebook, Instagram, X, etc.)
- URL du profil
- Findings
- Nombre de screenshots
- Notes

##### 8. `renderMediaGallery(payload)`
- Description générale
- Grid 2 colonnes avec items[]
- Chaque item : caption, date, source

##### 9. `renderDataRetention(payload)`
- Liste des datasets[]
- Chaque dataset : label, description, retentionPolicy, location

##### 10. `renderConclusions(payload)`
- Liste à puces des statements[]

##### 11. `renderInvestigationLeads(payload)`
- Liste des pistes (leads[])
- Chaque lead : type, platform, legalBasis, dataTargeted[], priority, notes
- Badge de priorité (high/medium/low)

##### 12. `renderSignOff(payload)`
- Date
- Officier : name, rank, unit, badgeNumber
- Notes additionnelles

#### C. Renderer de Findings (partagé)

```typescript
private static renderFindings(findings: any[]): string {
  // Boucle sur findings[]
  // Affiche : label, description, confidence badge, sources[]
}
```

#### D. Helpers Handlebars

Ajout de 5 helpers personnalisés :

```typescript
private static registerHelpers() {
  // eq - Comparaison égalité
  handlebars.registerHelper("eq", (a, b) => a === b);

  // formatDate - Format long français
  handlebars.registerHelper("formatDate", (date) => {
    return new Date(date).toLocaleDateString("fr-BE", {
      year: "numeric", month: "long", day: "numeric"
    });
  });

  // formatDateTime - Format avec heure
  handlebars.registerHelper("formatDateTime", (date) => {
    return new Date(date).toLocaleDateString("fr-BE", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  });

  // upper - Uppercase
  handlebars.registerHelper("upper", (str) => str.toUpperCase());

  // hasItems - Vérifier tableau non vide
  handlebars.registerHelper("hasItems", (arr) => {
    return arr && Array.isArray(arr) && arr.length > 0;
  });
}
```

---

### 2. Template Handlebars - `report-main.hbs`

#### A. Styles CSS ajoutés

##### Entities
```css
.entities-list { display: flex; flex-direction: column; gap: 10px; }
.entity-card {
  background: white;
  padding: 12px;
  border-left: 3px solid #0066cc;
}
```

##### Objectives & Conclusions
```css
.objectives-list, .conclusions-list {
  margin-left: 20px;
  line-height: 1.8;
}
```

##### Research Summary
```css
.summary-text { line-height: 1.8; }
.not-found-section {
  background: #fff3cd;
  border-left: 3px solid #ffc107;
}
.methodology {
  background: #e7f3ff;
  border-left: 3px solid #0066cc;
}
```

##### Findings
```css
.findings-section { margin-top: 15px; }
.finding-card {
  background: white;
  padding: 12px;
  border-left: 3px solid #28a745;
}
.confidence { /* badges colorés */ }
.confidence-confirmed { background: #d4edda; color: #155724; }
.confidence-probable { background: #d1ecf1; color: #0c5460; }
.confidence-possible { background: #fff3cd; color: #856404; }
.confidence-unknown { background: #f8d7da; color: #721c24; }
```

##### Platform Analysis
```css
.screenshots {
  background: #f0f8ff;
  border-left: 3px solid #0066cc;
}
```

##### Media Gallery
```css
.media-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.media-item { background: white; border: 1px solid #ddd; }
```

##### Data Retention
```css
.datasets-list { display: flex; flex-direction: column; gap: 10px; }
.dataset-card { border-left: 3px solid #6c757d; }
.retention-policy { font-size: 9pt; color: #666; }
```

##### Investigation Leads
```css
.leads-list { display: flex; flex-direction: column; gap: 10px; }
.lead-card { border-left: 3px solid #ffc107; }
.priority { /* badges */ }
.priority-high { background: #f8d7da; color: #721c24; }
.priority-medium { background: #fff3cd; color: #856404; }
.priority-low { background: #d4edda; color: #155724; }
```

##### Sign Off
```css
.sign-off-block {
  background: #f5f5f5;
  border-left: 4px solid #003f87;
  margin-top: 20px;
}
.officer-info { margin-top: 10px; }
```

##### Fallback
```css
.payload-dump {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  font-size: 9pt;
  overflow-x: auto;
}
```

---

## 📊 Exemples de rendu

### Exemple 1 : Module Entities

**Payload** :
```json
{
  "entities": [
    {
      "entityId": "ent-123",
      "entity": {
        "name": "John Doe",
        "metadata": {
          "entityType": "person",
          "aliases": ["Johnny", "JD"],
          "personDetails": {
            "dateOfBirth": "1985-03-15",
            "nationalRegistryNumber": "85.03.15-123.45",
            "physicalAddress": "Rue de la Loi 16, 1000 Bruxelles",
            "phoneNumbers": ["+32475123456", "+3225551234"]
          }
        }
      },
      "role": "Suspect principal",
      "notes": "Identifié via analyse CDR"
    }
  ]
}
```

**Rendu PDF** :
```
┌─────────────────────────────────────────┐
│ John Doe                                │
│ Type: person                            │
│ Alias: Johnny, JD                       │
│ Date de naissance: 1985-03-15           │
│ RRN: 85.03.15-123.45                    │
│ Adresse: Rue de la Loi 16, 1000 Bxl    │
│ Téléphones: +32475123456, +3225551234  │
│ Rôle: Suspect principal                 │
│ Identifié via analyse CDR               │
└─────────────────────────────────────────┘
```

---

### Exemple 2 : Module Research Summary

**Payload** :
```json
{
  "summary": "Les recherches ont permis d'identifier 3 profils Facebook et 2 numéros de téléphone actifs.",
  "notFound": [
    "Compte Instagram lié",
    "Adresse email professionnelle",
    "Compte LinkedIn"
  ],
  "methodology": "Recherches effectuées via Google, Facebook Graph Search, et bases de données publiques.",
  "notes": "Volumétrie d'Internet importante, résultats non exhaustifs."
}
```

**Rendu PDF** :
```
Les recherches ont permis d'identifier 3 profils Facebook et 2 numéros de téléphone actifs.

┌── Éléments non trouvés ─────────────────┐
│ • Compte Instagram lié                  │
│ • Adresse email professionnelle         │
│ • Compte LinkedIn                       │
└─────────────────────────────────────────┘

┌── Méthodologie ─────────────────────────┐
│ Recherches effectuées via Google,       │
│ Facebook Graph Search, et bases de      │
│ données publiques.                      │
└─────────────────────────────────────────┘

Volumétrie d'Internet importante, résultats non exhaustifs.
```

---

### Exemple 3 : Module Investigation Leads

**Payload** :
```json
{
  "leads": [
    {
      "type": "requisition",
      "platform": "Meta (Facebook/Instagram)",
      "legalBasis": "Art. 46bis Code d'instruction criminelle",
      "dataTargeted": ["Données de connexion", "Messages privés", "Liste d'amis"],
      "priority": "high",
      "notes": "Urgence : suspect en fuite"
    },
    {
      "type": "platform_contact",
      "platform": "WhatsApp (Meta)",
      "legalBasis": "Art. 88bis Code d'instruction criminelle",
      "dataTargeted": ["Métadonnées", "Groupes"],
      "priority": "medium"
    }
  ]
}
```

**Rendu PDF** :
```
┌── requisition ───────────────────────────┐
│ Plateforme: Meta (Facebook/Instagram)   │
│ Base légale: Art. 46bis CIC              │
│ Données visées: Données de connexion,   │
│                 Messages privés,         │
│                 Liste d'amis             │
│ Priorité: HIGH                           │
│ Urgence : suspect en fuite               │
└──────────────────────────────────────────┘

┌── platform_contact ──────────────────────┐
│ Plateforme: WhatsApp (Meta)             │
│ Base légale: Art. 88bis CIC              │
│ Données visées: Métadonnées, Groupes    │
│ Priorité: MEDIUM                         │
└──────────────────────────────────────────┘
```

---

## ✅ Conformité au canevas

Le template PDF est maintenant **100% conforme** au canevas original :

| Section canevas | Implémenté | Module(s) correspondant(s) |
|-----------------|------------|---------------------------|
| ✅ En-tête institutionnel | Oui | Header template |
| ✅ Résumé des faits | Oui | `summary` |
| ✅ Entités concernées | Oui | `entities` |
| ✅ Objectifs OSINT | Oui | `objectives` |
| ✅ Résumé des recherches | Oui | `research_summary` |
| ✅ Modules détaillés | Oui | `entity_overview`, `identifier_lookup`, `platform_analysis` |
| ✅ Galerie média | Oui | `media_gallery` |
| ✅ Données sauvegardées | Oui | `data_retention` |
| ✅ Conclusions | Oui | `conclusions` |
| ✅ Pistes d'enquête | Oui | `investigation_leads` |
| ✅ Signature | Oui | `sign_off` |

---

## 🎨 Améliorations visuelles

### Avant
- Rendering basique
- Pas de styles spécifiques par module
- Payload affiché en JSON brut
- Pas de badges de confiance/priorité
- Pas de grille média

### Après
- 12 renderers spécialisés
- CSS adapté à chaque type de contenu
- Payload structuré et formaté
- Badges colorés (confidence, priority)
- Grid 2 colonnes pour médias
- Sections avec bordures colorées
- Typographie hiérarchisée

---

## 🧪 Tests

### Test manuel

```bash
cd /workspaces/OSINTReport/backend
npx ts-node --require tsconfig-paths/register test-pdf-generation.ts
```

### Vérifications

- [x] Tous les modules s'affichent correctement
- [x] PersonDetails et CompanyDetails visibles
- [x] Badges de confiance colorés
- [x] Priorités des pistes affichées
- [x] Méthodologie et éléments non trouvés distincts
- [x] Datasets avec retention policy
- [x] Sign-off avec officier complet
- [x] Watermarks selon classification
- [x] Métadonnées PDF complètes

---

## 📝 Documentation technique

### Fichiers modifiés

1. **`backend/src/modules/pdf/pdf.service.ts`** (+450 lignes)
   - Refactorisation `renderModuleContent()`
   - 12 renderers spécialisés
   - `renderFindings()` partagé
   - `registerHelpers()` avec 5 helpers Handlebars

2. **`backend/src/modules/pdf/templates/report-main.hbs`** (+200 lignes CSS)
   - Styles pour entities, objectives, conclusions
   - Styles pour research_summary (not-found, methodology)
   - Styles pour findings (badges confidence)
   - Styles pour media_gallery (grid 2 colonnes)
   - Styles pour data_retention (datasets)
   - Styles pour investigation_leads (badges priority)
   - Styles pour sign_off

### Structure des renderers

Chaque renderer suit le pattern :

```typescript
private static render[ModuleName](payload: any, ...extraData): string {
  let html = "";
  
  // 1. Extraction des données du payload
  // 2. Construction HTML avec classes CSS spécifiques
  // 3. Formatage conditionnel
  // 4. Retour HTML string
  
  return html;
}
```

### Hiérarchie CSS

```
.module                          # Container principal
  ├── .module-title              # Titre du module
  └── [type-specific-class]      # Classe spécifique au type
      ├── .entity-card           # Pour entities
      ├── .finding-card          # Pour findings
      ├── .lead-card             # Pour investigation_leads
      ├── .dataset-card          # Pour data_retention
      ├── .media-item            # Pour media_gallery
      └── ...
```

---

## 🚀 Utilisation

### API

```typescript
// Générer un PDF complet
const pdfBuffer = await PDFService.generatePDF({
  reportId: "report-uuid",
  includeWatermark: true,
  officerName: "Insp. Jean Dupont",
  officerRank: "Inspecteur Principal"
});

// Générer le nom de fichier
const filename = PDFService.generateFilename({
  caseNumber: "PV-2025-001234",
  reportNumber: "OSINT-2025-0042"
});
// => "OSINT_PV-2025-001234_OSINT-2025-0042_2025-10-06.pdf"
```

### Frontend

```typescript
// Bouton d'export (déjà implémenté)
async function handleExportPDF() {
  const response = await fetch(`/api/reports/${reportId}/export/pdf`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `OSINT_${report.caseNumber}_${report.reportNumber}.pdf`;
  a.click();
}
```

---

## 🎯 Prochaines étapes (optionnel)

### Améliorations futures

1. **Images dans PDF**
   - Intégrer les screenshots en base64
   - Résolution optimale (300 DPI)
   - Compression intelligente

2. **Table des matières**
   - Génération automatique avec numéros de page
   - Liens cliquables vers sections

3. **Graphiques**
   - Timeline des événements
   - Graphes de corrélations
   - Statistiques visuelles

4. **Export Word/Excel**
   - Format DOCX pour édition
   - Export données structurées en XLSX

5. **Templates personnalisables**
   - Choix du style (couleurs, logos)
   - Templates par service/unité

---

## 📚 Références

- [Handlebars Documentation](https://handlebarsjs.com/)
- [Puppeteer PDF Options](https://pptr.dev/api/puppeteer.pdfoptions)
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [EXIF Timezone Spec](http://www.cipa.jp/std/documents/e/DC-008-Translation-2019-E.pdf)

---

**Dernière mise à jour** : 6 octobre 2025  
**Session** : 9  
**Status** : ✅ COMPLET

