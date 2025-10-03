# 🔧 Guide de dépannage - Export PDF

## Problème résolu ✅

### Cause racine
Puppeteer nécessite des **bibliothèques système** pour lancer Chrome/Chromium qui n'étaient pas installées dans le container Codespaces.

### Solution appliquée

**Étape 1** : Installer Chrome via Puppeteer
```bash
cd /workspaces/OSINTReport/backend
npx puppeteer browsers install chrome
```

**Étape 2** : Installer les dépendances système de Chrome
```bash
sudo apt-get update && sudo apt-get install -y \
  libnss3 \
  libatk1.0-0t64 \
  libatk-bridge2.0-0t64 \
  libcups2t64 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2t64 \
  libpango-1.0-0 \
  libcairo2
```

Chrome est maintenant installé dans: `/home/codespace/.cache/puppeteer/chrome/linux-131.0.6778.204/`

### Erreur rencontrée
```
Failed to launch the browser process!
error while loading shared libraries: libatk-1.0.so.0: cannot open shared object file: No such file or directory
```

---

## Étapes de test

### 1. Vérifier que les serveurs tournent

**Backend** (port 4000):
```bash
curl http://localhost:4000/api/health
# Devrait retourner: {"status":"ok"}
```

**Frontend** (port 5173):
```bash
curl -I http://localhost:5173
# Devrait retourner: HTTP/1.1 200 OK
```

### 2. Tester l'export PDF via l'interface

1. Ouvrez le frontend: https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev
2. Connectez-vous avec: `admin@police.belgium.eu` / `admin123`
3. Allez sur un rapport existant (ID: `6cf38f82-61a8-4534-9441-f20b3e91b4fc`)
4. Cliquez sur "Actions" → "Exporter PDF"
5. Le PDF devrait se télécharger automatiquement

### 3. Tester via script Node.js (optionnel)

```bash
cd /workspaces/OSINTReport/backend

# Récupérez d'abord votre token auth depuis les cookies du navigateur
# Puis exécutez:
node test-pdf-export.js 6cf38f82-61a8-4534-9441-f20b3e91b4fc YOUR_TOKEN_HERE
```

### 4. Vérifier les logs backend

Si l'export échoue, surveillez les logs du terminal backend pour voir les erreurs:

```bash
# Les logs devraient montrer:
[INFO] 🔄 Génération PDF démarrée
[DEBUG] ✅ Données du rapport récupérées
[DEBUG] ✅ Données template préparées  
[DEBUG] ✅ Template HTML rendu
[DEBUG] ✅ PDF généré avec Puppeteer
[DEBUG] ✅ Watermark ajouté
[DEBUG] ✅ Métadonnées ajoutées
[INFO] ✅ PDF exporté avec succès
```

---

## Erreurs possibles et solutions

### ❌ Erreur: "Failed to launch the browser process"

**Cause**: Chrome pas installé ou permissions manquantes

**Solution**:
```bash
cd /workspaces/OSINTReport/backend
npx puppeteer browsers install chrome
```

### ❌ Erreur 500: Internal Server Error

**Causes possibles**:
1. Chrome n'est pas lancé avec les bons arguments
2. Template Handlebars invalide
3. Données du rapport manquantes

**Vérification**:
```bash
# Regardez les logs backend en détail
tail -f /workspaces/OSINTReport/backend/logs/*.log
```

### ❌ Erreur 404: Report not found

**Cause**: Le rapport n'existe pas ou vous n'avez pas les permissions

**Solution**:
```bash
# Lister les rapports disponibles
curl -H "Cookie: auth_token=YOUR_TOKEN" http://localhost:4000/api/reports
```

### ❌ PDF vide ou corrompu

**Cause**: Template HTML invalide ou erreur Puppeteer

**Solution**:
1. Vérifiez que le template `backend/src/modules/pdf/templates/report-main.hbs` existe
2. Testez le rendu HTML en ajoutant un log dans `pdf.service.ts`:
   ```typescript
   const html = template(templateData);
   console.log(html); // Vérifier le HTML généré
   ```

---

## Architecture de l'export

```
Frontend (ReportDetailPage.vue)
  ↓ Click "Exporter PDF"
  ↓ axios.get(/api/reports/:id/export/pdf?watermark=true)
  ↓
Backend (/routes/index.ts)
  ↓ Router PDF
  ↓
PDFController.exportPDF()
  ↓ Vérifications (permissions, rapport exists)
  ↓
PDFService.generatePDF()
  ├─ fetchReportData() → Prisma query
  ├─ prepareTemplateData() → Format data
  ├─ loadTemplate() → Handlebars compile
  ├─ Puppeteer → HTML to PDF
  ├─ addWatermark() → pdf-lib overlay
  └─ addMetadata() → pdf-lib properties
  ↓
Response.send(pdfBuffer)
  ↓
Frontend download automatique
```

---

## Commandes utiles

### Redémarrer les serveurs

```bash
# Backend
cd /workspaces/OSINTReport/backend
pkill -f ts-node-dev
npm run dev

# Frontend  
cd /workspaces/OSINTReport/frontend
pkill -f vite
npm run dev
```

### Vérifier Chrome Puppeteer

```bash
ls -lh /home/codespace/.cache/puppeteer/chrome/
# Devrait montrer: linux-131.0.6778.204/
```

### Tester template Handlebars manuellement

```bash
cd /workspaces/OSINTReport/backend
node -e "
const hbs = require('handlebars');
const fs = require('fs');
const template = hbs.compile(fs.readFileSync('src/modules/pdf/templates/report-main.hbs', 'utf8'));
const html = template({ title: 'Test', caseNumber: 'TEST-001' });
console.log(html.substring(0, 200));
"
```

---

## Performance attendue

- **Temps génération**: < 3 secondes
- **Taille PDF typique**: 50-200 KB
- **Mémoire Puppeteer**: ~100-200 MB pendant génération

---

## Contact et documentation

- **Code**: `backend/src/modules/pdf/`
- **Documentation complète**: `docs/SESSION-8-COMPLETE.md`
- **Analyse techno**: `docs/SESSION-8-ANALYSIS.md`

---

**Dernière mise à jour**: 3 octobre 2025, 09:20 UTC
