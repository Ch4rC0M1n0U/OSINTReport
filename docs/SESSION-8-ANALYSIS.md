# Phase 8 - Export PDF : Analyse et Choix Technologique

## 🎯 Objectif

Générer des rapports OSINT au format PDF avec :
- Logo et en-tête Police Belge
- Sections structurées (résumé, entités, modules, conclusions)
- Images et captures d'écran intégrées
- Watermarks selon classification
- Métadonnées (auteur, date, classification)
- Graphe de corrélations visuel

---

## 🔧 Options Technologiques

### Option 1 : Puppeteer (Headless Chrome)

**✅ Avantages :**
- Rendu HTML/CSS → PDF très fidèle
- Support complet CSS (flexbox, grid, media queries)
- Graphiques SVG/Canvas natifs
- Facilité de templating (Handlebars, EJS)
- Watermarks CSS natifs
- Bonne gestion des images base64

**❌ Inconvénients :**
- Lourd (Chrome headless ~200MB)
- Consommation mémoire importante
- Plus lent (500-2000ms par PDF)
- Nécessite Docker si déploiement cloud

**📦 Installation :**
```bash
npm install puppeteer handlebars
```

**💾 Taille bundle :** ~250MB

---

### Option 2 : PDFKit (Bibliothèque native Node.js)

**✅ Avantages :**
- Léger (~10MB)
- Très rapide (50-200ms par PDF)
- Contrôle total sur la mise en page
- Faible consommation mémoire
- Pas de dépendances système

**❌ Inconvénients :**
- Pas de support HTML/CSS
- Layout programmatique (complexe)
- Graphiques manuels (difficile)
- Watermarks manuels
- Pas de flexbox/grid

**📦 Installation :**
```bash
npm install pdfkit
```

**💾 Taille bundle :** ~3MB

---

### Option 3 : pdf-lib (Manipulation PDF moderne)

**✅ Avantages :**
- Léger (~500KB)
- Manipulation PDF existants
- Ajout de watermarks facile
- Signatures numériques
- Métadonnées complètes

**❌ Inconvénients :**
- Pas de création from scratch
- Nécessite un PDF base
- Complexe pour layouts

**📦 Installation :**
```bash
npm install pdf-lib
```

---

### Option 4 : Approche Hybride (Recommandée ✨)

**🎯 Stratégie :**
1. **Puppeteer** pour le rendu principal (HTML → PDF)
2. **pdf-lib** pour les watermarks et métadonnées post-génération

**✅ Avantages combinés :**
- Facilité de templating HTML
- Watermarks professionnels
- Métadonnées complètes
- Contrôle total

**📦 Installation :**
```bash
npm install puppeteer handlebars pdf-lib
```

---

## 🏆 Décision : Approche Hybride

### Justification

1. **Templates HTML** : Facile à maintenir et modifier
2. **CSS Moderne** : Design professionnel avec peu d'effort
3. **Watermarks** : pdf-lib offre le meilleur contrôle
4. **Performance acceptable** : 1-2s par rapport (usage sporadique)
5. **Maintenabilité** : HTML plus accessible que PDFKit programmatique

---

## 📐 Architecture Proposée

```
┌─────────────────────────────────────────────────┐
│              Report Controller                   │
│    GET /api/reports/:id/export/pdf              │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│               PDF Service                        │
│  1. Fetch report data (Prisma)                  │
│  2. Render HTML template (Handlebars)           │
│  3. Generate PDF (Puppeteer)                    │
│  4. Add watermark (pdf-lib)                     │
│  5. Add metadata (pdf-lib)                      │
│  6. Return buffer/stream                        │
└─────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│            HTML Templates                        │
│  - templates/pdf/header.hbs                     │
│  - templates/pdf/report.hbs                     │
│  - templates/pdf/footer.hbs                     │
│  - templates/pdf/styles.css                     │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Structure du Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* Styles Police Belge */
    @page {
      size: A4;
      margin: 2cm;
    }
    
    .header {
      border-bottom: 3px solid #003f87;
      padding-bottom: 10px;
    }
    
    .logo {
      width: 120px;
    }
    
    .classification-banner {
      background: red;
      color: white;
      text-align: center;
      padding: 5px;
      font-weight: bold;
    }
    
    .watermark {
      position: fixed;
      opacity: 0.1;
      font-size: 80px;
      transform: rotate(-45deg);
    }
  </style>
</head>
<body>
  <!-- Header avec logo -->
  <div class="header">
    <img src="{{logoBase64}}" class="logo" />
    <h1>Rapport OSINT</h1>
    <p>Dossier {{caseNumber}} – Rapport n° {{reportNumber}}</p>
  </div>
  
  <!-- Classification banner -->
  {{#if classification}}
    <div class="classification-banner">
      {{classification}}
    </div>
  {{/if}}
  
  <!-- Sections -->
  <section class="summary">
    <h2>Résumé</h2>
    {{{summary}}}
  </section>
  
  <!-- Modules dynamiques -->
  {{#each modules}}
    <section class="module">
      <h3>{{this.title}}</h3>
      {{{this.content}}}
    </section>
  {{/each}}
  
  <!-- Footer -->
  <footer>
    <p>Généré le {{generatedDate}} par {{officer}}</p>
  </footer>
</body>
</html>
```

---

## 🔐 Watermarks par Classification

| Classification | Watermark | Couleur | Opacité |
|----------------|-----------|---------|---------|
| PUBLIC | AUCUN | - | - |
| RESTRICTED | RESTREINT | Bleu | 0.3 |
| CONFIDENTIAL | CONFIDENTIEL | Orange | 0.4 |
| SECRET | SECRET | Rouge | 0.5 |

---

## 📊 Métadonnées PDF

```javascript
{
  Title: "Rapport OSINT - Dossier 2025-001",
  Author: "Inspector John Doe - PJF Bruxelles",
  Subject: "Rapport d'investigation OSINT",
  Keywords: "OSINT, Investigation, Police Belge",
  Creator: "OSINTReport v1.0",
  Producer: "OSINTReport PDF Generator",
  CreationDate: new Date(),
  ModDate: new Date(),
  Classification: "CONFIDENTIAL" // Custom metadata
}
```

---

## 🚀 Plan d'Implémentation

### Étape 1 : Installation des dépendances
```bash
cd backend
npm install puppeteer handlebars pdf-lib
npm install --save-dev @types/puppeteer
```

### Étape 2 : Structure des fichiers
```
backend/
  src/
    modules/
      pdf/
        pdf.service.ts         # Service principal
        pdf.controller.ts      # Contrôleur HTTP
        pdf.router.ts          # Routes
        templates/
          report-main.hbs      # Template principal
          styles.css           # Styles CSS
          logo-police.png      # Logo (base64)
```

### Étape 3 : Implémentation service
- [ ] Fetch report avec modules et entités
- [ ] Render HTML avec Handlebars
- [ ] Generate PDF avec Puppeteer
- [ ] Add watermark avec pdf-lib
- [ ] Add metadata

### Étape 4 : Routes API
- [ ] `GET /api/reports/:id/export/pdf`
- [ ] `POST /api/reports/:id/export/email` (optionnel)

### Étape 5 : Frontend
- [ ] Bouton "Exporter PDF" sur detail page
- [ ] Indicateur de téléchargement
- [ ] Gestion erreurs

---

## ⏱️ Estimation

- **Installation et setup** : 15 min
- **Service PDF** : 1h30
- **Templates HTML/CSS** : 1h
- **Routes et contrôleur** : 30 min
- **Frontend** : 30 min
- **Tests** : 30 min
- **Documentation** : 20 min

**Total : ~4 heures**

---

## ✅ Critères d'Acceptation

- [ ] PDF généré en < 3 secondes
- [ ] Logo police belge présent
- [ ] Toutes les sections du rapport
- [ ] Watermark selon classification
- [ ] Métadonnées correctes
- [ ] Téléchargement automatique
- [ ] Nom de fichier : `OSINT_[CaseNumber]_[Date].pdf`

---

**Prêt à démarrer l'implémentation !** 🚀
