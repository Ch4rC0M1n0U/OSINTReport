# 🎯 Guide de Test Rapide - Sélecteur de Base Légale

## Accès rapide

### URL de test
```
Création: http://localhost:5173/reports/new
Modification: http://localhost:5173/reports/{id}
```

---

## ⚡ Test Express (2 minutes)

### Test 1 : Création avec base légale

**Temps estimé : 1 minute**

1. Aller sur **Créer un rapport**
2. Remplir **Étape 1** (titre, dossier, service)
3. Cliquer **Suivant**
4. Dans **Étape 2**, cliquer sur le champ **Base légale**

**✅ Vérification attendue :**
```
Le dropdown s'ouvre avec 15 articles organisés :
- Barre de recherche en haut
- 5 filtres de catégorie (Tous, MPR, Surveillance, etc.)
- Liste d'articles avec checkboxes
- Footer avec compteur et bouton "Fermer"
```

5. Sélectionner **Art. 46bis §2 CIC** (Observation via Internet)
6. Sélectionner **Art. 88bis CIC** (Enquête proactive)
7. Cliquer **Fermer**

**✅ Vérification attendue :**
```
2 badges s'affichent dans le champ :
[ Art. 46bis §2 CIC ✕ ]  [ Art. 88bis CIC ✕ ]
```

8. Remplir le reste (contexte, urgence, classification)
9. Cliquer **Suivant** → **Créer le rapport**

**✅ Vérification attendue :**
```
- Redirection vers la page du rapport
- Aucune erreur HTTP 500
- Base légale affichée dans la section "Informations du rapport"
```

---

### Test 2 : Modification de la base légale

**Temps estimé : 30 secondes**

1. Ouvrir un rapport (celui créé au Test 1 par exemple)
2. Menu **Actions** → **Modifier les informations**
3. Dans la modal, repérer le champ **Base légale**

**✅ Vérification attendue :**
```
Les 2 badges sélectionnés apparaissent :
[ Art. 46bis §2 CIC ✕ ]  [ Art. 88bis CIC ✕ ]
```

4. Cliquer sur le champ pour ouvrir le dropdown
5. Cocher un 3ème article : **Art. 39bis CIC** (Réquisition télécoms)
6. Cliquer **Fermer**

**✅ Vérification attendue :**
```
3 badges maintenant affichés :
[ Art. 46bis §2 CIC ✕ ]  [ Art. 88bis CIC ✕ ]  [ Art. 39bis CIC ✕ ]
```

7. Cliquer **Enregistrer**

**✅ Vérification attendue :**
```
- Modal de succès "✅ Modifications enregistrées"
- Section info actualisée sans reload
- 3 badges affichés dans "Base légale"
```

---

## 🔍 Tests Avancés (5 minutes)

### Test 3 : Recherche

1. Ouvrir le sélecteur
2. Taper **"observation"** dans la recherche

**✅ Résultat attendu :**
```
2 articles filtrés :
- Art. 46bis CIC (Observation)
- Art. 46bis §2 CIC (Observation via Internet)
```

3. Effacer la recherche
4. Taper **"90"**

**✅ Résultat attendu :**
```
2 articles filtrés :
- Art. 90ter CIC (Mesures de surveillance)
- Art. 90quater CIC (Surveillance par moyens techniques)
```

---

### Test 4 : Filtres par catégorie

1. Ouvrir le sélecteur
2. Cliquer sur le filtre **MPR**

**✅ Résultat attendu :**
```
5 articles affichés :
- Art. 28bis CIC
- Art. 46bis CIC
- Art. 47ter CIC
- Art. 47sexies CIC
```

3. Cliquer sur **Données**

**✅ Résultat attendu :**
```
3 articles affichés :
- Art. 39bis CIC
- Art. 46bis §2 CIC
- Art. 88sexies CIC
```

4. Cliquer sur **Tous (15)**

**✅ Résultat attendu :**
```
Retour à la liste complète (15 articles)
```

---

### Test 5 : Suppression d'articles

1. Sélectionner 3 articles
2. Cliquer sur le **✕** d'un badge dans le champ

**✅ Résultat attendu :**
```
Badge supprimé immédiatement
Compteur mis à jour : "2 article(s) sélectionné(s)"
```

3. Ouvrir le dropdown
4. Vérifier que la checkbox de l'article supprimé est décochée

**✅ Résultat attendu :**
```
Checkbox décochée ☐
Fond blanc (pas de highlight)
```

---

### Test 6 : "Tout effacer"

1. Sélectionner 5 articles
2. Dans le dropdown, cliquer **Tout effacer**

**✅ Résultat attendu :**
```
- Tous les badges disparaissent
- Toutes les checkboxes décochées
- Compteur : "0 article(s) sélectionné(s)"
- Placeholder réapparaît : "Sélectionnez un ou plusieurs articles..."
```

---

## 🗄️ Test Base de Données

### Vérification PostgreSQL

```bash
# Se connecter à PostgreSQL
docker exec -it osintreport-postgres-1 psql -U osint -d osintdb

# Vérifier les derniers rapports
SELECT 
  id, 
  title, 
  "legalBasis",
  "createdAt"
FROM "Report" 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

**✅ Résultat attendu :**
```
 id | title                    | legalBasis                                        | createdAt
----+--------------------------+---------------------------------------------------+-------------------------
 42 | Investigation fraude...  | Art. 46bis §2 CIC • Art. 88bis CIC • Art. 39bis... | 2025-10-03 14:32:15
```

Format stocké : `Art. X • Art. Y • Art. Z`

---

## 📊 Test Réseau (DevTools)

### 1. Création de rapport

**Ouvrir DevTools** → **Network** → **XHR**

**POST** `/api/reports`

**Request Payload :**
```json
{
  "title": "Test investigation",
  "caseNumber": "2025/TEST/001",
  "requestingService": "Brigade Test",
  "investigationContext": "Test context",
  "legalBasis": "Art. 46bis §2 CIC • Art. 88bis CIC",
  "urgencyLevel": "ROUTINE",
  "classification": "CONFIDENTIAL"
}
```

**✅ Vérification :**
- Status : `201 Created`
- Response contient `id`, `legalBasis`

---

### 2. Modification de rapport

**PATCH** `/api/reports/{id}`

**Request Payload :**
```json
{
  "legalBasis": "Art. 28bis CIC • Art. 46bis CIC • Art. 90ter CIC"
}
```

**✅ Vérification :**
- Status : `200 OK`
- Response contient le `legalBasis` mis à jour

---

## 🐛 Debugging

### Erreur : Dropdown ne s'ouvre pas

**Vérification :**
```javascript
// Console DevTools
console.log(isOpen.value) // Should be true when clicked
```

**Solution :**
- Vérifier que `@click="toggleDropdown"` est présent
- Vérifier pas de `z-index` conflict

---

### Erreur : Articles non sauvegardés

**Vérification backend :**
```bash
# Logs backend
cd /workspaces/OSINTReport/backend && npm run dev
```

**Rechercher :**
```
POST /api/reports
PATCH /api/reports/:id
```

**Vérifier :**
- Pas d'erreur Zod validation
- `legalBasis` bien envoyé dans le payload

---

### Erreur : Badges ne s'affichent pas

**Vérification :**
```vue
<!-- ReportDetailPage.vue, ligne ~550 -->
<div v-if="report.legalBasis" class="flex flex-wrap gap-2">
  <span
    v-for="article in parseLegalBasis(report.legalBasis)"
    :key="article"
    class="badge badge-primary badge-sm font-mono"
  >
    {{ article }}
  </span>
</div>
```

**Vérifier import :**
```typescript
import { parseLegalBasis } from "@/data/legal-basis";
```

---

## ✅ Checklist de validation

### Fonctionnalités
- [ ] Dropdown s'ouvre au clic
- [ ] Recherche filtre correctement
- [ ] Filtres par catégorie fonctionnent
- [ ] Sélection multiple avec checkboxes
- [ ] Badges affichés dans le champ
- [ ] Suppression via ✕ fonctionne
- [ ] "Tout effacer" retire tous les articles
- [ ] Fermeture au clic extérieur
- [ ] Sauvegarde en BDD (format `Art. X • Art. Y`)
- [ ] Affichage badges dans rapport

### UX/UI
- [ ] Animations fluides (200ms)
- [ ] Scrollbar si > 15 articles
- [ ] Responsive (mobile OK)
- [ ] Hover states corrects
- [ ] Focus visible (keyboard navigation)
- [ ] Placeholder affiché si vide

### Performance
- [ ] Pas de lag à la frappe (recherche)
- [ ] Rendu < 16ms (60 FPS)
- [ ] Pas de fuite mémoire

---

## 🎓 Scénarios d'utilisation réels

### Scénario 1 : Investigation fraude en ligne

**Articles recommandés :**
```
[ Art. 46bis §2 CIC ]  (Observation réseaux sociaux)
[ Art. 39bis CIC ]     (Réquisition IP address)
[ Art. 88bis CIC ]     (Enquête proactive)
```

---

### Scénario 2 : Trafic de drogue sur Telegram

**Articles recommandés :**
```
[ Art. 28bis CIC ]   (MPR)
[ Art. 46bis CIC ]   (Observation)
[ Art. 47ter CIC ]   (Infiltration via faux acheteur)
[ Art. 90ter CIC ]   (Surveillance téléphonique)
[ Art. 127 CIC ]     (Information juge)
```

---

### Scénario 3 : Personne disparue (mineure)

**Articles recommandés :**
```
[ Art. 46bis §2 CIC ]  (Recherche Facebook/Instagram)
[ Art. 39bis CIC ]     (Géolocalisation smartphone)
[ Art. 88sexies CIC ]  (Analyse CDR triangulation)
```

---

## 📞 Support

### Documentation
- **Technique** : `docs/legal-basis-selector.md`
- **Guide pratique** : `docs/legal-basis-practical-guide.md`
- **Tests complets** : `docs/TEST-LEGAL-BASIS-SELECTOR.md`
- **UI Preview** : `docs/legal-basis-ui-preview.md`

### Code source
- **Composant** : `/frontend/src/components/shared/LegalBasisSelector.vue`
- **Données** : `/frontend/src/data/legal-basis.ts`

---

**Temps total de test : 7-10 minutes**  
**Date : 3 octobre 2025**
