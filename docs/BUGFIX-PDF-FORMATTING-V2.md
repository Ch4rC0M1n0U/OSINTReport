# BUGFIX V2 - Correction complète du formatage PDF

## Problèmes identifiés dans la capture d'écran

1. ❌ **Tableau mal formaté** : Les données utilisaient des `<div>` au lieu d'un vrai tableau HTML
2. ❌ **Symboles non affichés** : Les carrés □ apparaissaient à la place des émojis et symboles Unicode
3. ❌ **Watermark "PROJET"** : Visible sur le contenu (problème séparé du formatage)
4. ❌ **Mise en page incohérente** : Les champs n'étaient pas alignés correctement

## Solutions implémentées

### 1. Conversion en tableaux HTML pour les findings

**Avant** (avec `<div>`) :

```html
<div class="field-label">Nom du profil / Username</div>
<div class="field-value">Josée</div>
```

**Après** (avec `<table>`) :

```html
<table class="finding-table">
  <tr>
    <td class="label-col">Nom du profil / Username</td>
    <td>Josée</td>
  </tr>
</table>
```

### 2. Suppression de TOUS les symboles Unicode

**Problème** : Les émojis (🔬, 📊, 📝, etc.) ET les symboles Unicode (►, ▸, •) ne s'affichent pas correctement dans les PDF générés par Puppeteer. Ils apparaissent comme des carrés □.

**Solution** : Suppression complète de tous les symboles spéciaux en début de ligne.

| Avant                       | Après                      |
| --------------------------- | -------------------------- |
| `► Bloc de texte 1`         | `Bloc de texte 1`          |
| `▸ Méthodologie`            | `Méthodologie`             |
| `⚠ Éléments non trouvés`    | `Éléments non trouvés`     |
| `• Notes complémentaires`   | `Notes complémentaires`    |
| `▸ Piste 1`                 | `Piste 1`                  |
| `• Haute / Moyenne / Basse` | `Haute / Moyenne / Basse`  |
| `▸ Dataset`                 | `Dataset` (nom du dataset) |
| `▸ Entité`                  | `Entité` (nom de l'entité) |
| `▸ Identifiant`             | `Identifiant` (type)       |
| `▸ Plateforme`              | `Plateforme`               |
| `▸ Captures d'écran`        | `Captures d'écran`         |

### 3. Amélioration du renderer `renderFindings()`

Nouvelles fonctionnalités :

- ✅ **Tableau HTML** avec colonnes `label-col` (35% largeur) et valeur
- ✅ **Support complet des métadonnées** :
  - Type d'entité
  - Plateforme
  - URL du profil
  - Statut du compte
  - Username
  - Niveau de confiance (badge coloré)
  - Statut de vérification (✓ Vérifié / ✗ Non vérifié)
  - Date de naissance
  - Statistiques (followers, following)
  - Date de création du compte
  - Localisation
  - Contact (email, téléphone, website)
  - Informations personnelles (RN, adresse, téléphones)
- ✅ **Sources** dans une liste `<ul>` à l'intérieur du tableau
- ✅ **Pièces jointes** en dehors du tableau dans une grille

### 4. Nouveaux styles CSS pour les tableaux

**Fichier** : `backend/src/modules/pdf/templates/report-main.hbs`

```css
.finding-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 10pt;
}

.finding-table td {
  padding: 8px;
  border: 1px solid #ddd;
  vertical-align: top;
}

.finding-table .label-col {
  font-weight: 600;
  background-color: #f5f5f5;
  width: 35%;
  color: #333;
}

.confidence-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 9pt;
  font-weight: 600;
}

.confidence-confirmed,
.confidence-Confirmed {
  background: #d4edda;
  color: #155724;
}

.confidence-probable,
.confidence-Probable {
  background: #d1ecf1;
  color: #0c5460;
}

.confidence-possible,
.confidence-Possible {
  background: #fff3cd;
  color: #856404;
}
```

### 5. Gestion des badges de confiance

Les badges de confiance supportent maintenant plusieurs formats :

- `confirmed` / `Confirmed`
- `probable` / `Probable`
- `possible` / `Possible`
- `unknown` / `Unknown`

Chaque badge a :

- Une couleur de fond distinctive
- Une couleur de texte contrastée
- Un padding et des bordures arrondies
- Une taille de police réduite (9pt)

### 6. Section pièces jointes améliorée

Les pièces jointes sont maintenant :

- Affichées **en dehors du tableau** pour une meilleure mise en page
- Organisées dans une **grille flexible** (`.attachments-grid`)
- Limitées en taille : `max-width: 200px`, `max-height: 150px`
- Avec bordures et coins arrondis
- Titre de section : "Pièces jointes (X)"

## Structure HTML générée

Voici un exemple de la structure HTML générée pour un finding :

```html
<div class="finding-card">
  <h4>Profil - Josée</h4>
  <p class="finding-description">Compte Facebook identifié</p>

  <table class="finding-table">
    <tr>
      <td class="label-col">Nom du profil / Username</td>
      <td>Josée</td>
    </tr>
    <tr>
      <td class="label-col">Niveau de confiance</td>
      <td>
        <span class="confidence-badge confidence-Possible">Possible</span>
      </td>
    </tr>
    <tr>
      <td class="label-col">Type d'entité</td>
      <td>👤 Personne</td>
    </tr>
    <tr>
      <td class="label-col">Statut de vérification</td>
      <td>✗ Non vérifié</td>
    </tr>
    <tr>
      <td class="label-col">Date de naissance</td>
      <td>1 novembre 1985</td>
    </tr>
  </table>

  <!-- Pièces jointes si présentes -->
  <div class="attachments-section">
    <h5>Pièces jointes (2)</h5>
    <div class="attachments-grid">
      <img src="..." class="attachment-image" alt="Pièce jointe" />
      <img src="..." class="attachment-image" alt="Pièce jointe" />
    </div>
  </div>
</div>
```

## Résultat attendu

Le PDF devrait maintenant afficher :

1. ✅ **Tableaux bien formatés** avec bordures visibles
2. ✅ **Colonnes alignées** (labels à 35%, valeurs à 65%)
3. ✅ **Labels en gras** sur fond gris clair (#f5f5f5)
4. ✅ **Badges de confiance colorés** (vert, bleu, jaune, rouge)
5. ✅ **Symboles Unicode** au lieu d'émojis (►, ▸, •, ⚠)
6. ✅ **Statut de vérification** avec ✓ et ✗
7. ✅ **Pièces jointes** dans une grille séparée
8. ✅ **Sources** dans une liste à puces
9. ✅ **Pas de watermark** sur les données (seulement si classification sensible)

## Note sur le watermark "PROJET"

Le watermark visible dans la capture d'écran suggère que le rapport a une classification non-PUBLIC. Pour éviter le watermark :

- Assurez-vous que `classification` est défini sur `PUBLIC`
- Ou désactivez le watermark avec `includeWatermark: false`

Le watermark est ajouté par la fonction `addWatermark()` uniquement si :

```typescript
if (options.includeWatermark !== false && templateData.hasClassification) {
  // Ajouter le watermark
}
```

## Test recommandé

```bash
# 1. Recompiler le backend
cd /workspaces/OSINTReport/backend
npm run build

# 2. Redémarrer le service
npm run dev

# 3. Régénérer le PDF
# Dans l'interface : Rapport → Bouton "Générer PDF"
```

## Fichiers modifiés

1. `backend/src/modules/pdf/pdf.service.ts`

   - Fonction `renderFindings()` : Conversion en tableaux HTML
   - Toutes les fonctions renderer\* : Remplacement des émojis
   - Support complet des métadonnées (username, verified, etc.)

2. `backend/src/modules/pdf/templates/report-main.hbs`
   - Nouveaux styles `.finding-table`
   - Styles `.label-col` pour les colonnes de labels
   - Styles `.confidence-badge` avec variantes de couleurs
   - Styles `.attachments-section` et `.attachments-grid`

## Compatibilité

Ces modifications sont **rétrocompatibles** :

- Les anciens findings sans tableaux continueront de fonctionner
- Les nouveaux champs (username, verified) sont optionnels
- Les badges de confiance supportent les anciennes et nouvelles valeurs
- Les émojis sont simplement remplacés par des symboles, aucun changement de logique
