# BUGFIX - Suppression des carrés □ et spans vides dans les PDF

## Problème identifié

Dans les PDF générés, des **carrés blancs (□)** apparaissent de manière aléatoire, causés par :

1. Des **spans vides** avec `role="presentation"` générés par TipTap ou Puppeteer
2. Des **caractères Unicode invisibles** (zero-width spaces, etc.) présents dans le HTML
3. Des **caractères de remplacement** (� U+FFFD, □ U+25A1) dans le contenu

Exemple de code HTML problématique trouvé dans les PDF :

```html
<span
  style="left: calc(var(--total-scale-factor) *63.75px); 
     top: calc(var(--total-scale-factor) *150.45px); 
     font-size: calc(var(--total-scale-factor) *9.00px); 
     font-family: Calibri, sans-serif;"
  role="presentation"
  dir="ltr"
></span>
```

## Solutions implémentées

### 1. Amélioration de `convertMarkdownToHtml()`

**Fichier** : `backend/src/modules/pdf/pdf.service.ts`

Ajout de nettoyages agressifs pour supprimer :

- Les spans vides avant et après nettoyage des attributs
- Les caractères invisibles (U+200B à U+200D, U+FEFF)
- Les caractères de remplacement (U+FFFD, U+25A1)

```typescript
private static convertMarkdownToHtml(content: string): string {
  if (!content) return "";

  let html = content
    // Convertir les entités AVANT de nettoyer
    .replace(/<span[^>]*data-entity-id="([^"]*)"[^>]*>([^<]*)<\/span>/gi,
             '<strong class="entity-mention">$2</strong>')
    // Nettoyer les attributs TipTap
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    .replace(/class="[^"]*ProseMirror[^"]*"/gi, '')
    // Supprimer TOUS les spans vides
    .replace(/<span[^>]*>\s*<\/span>/gi, '')
    .replace(/<span[^>]*>[\s\u200B-\u200D\uFEFF]*<\/span>/gi, '')
    // Supprimer les caractères invisibles
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Supprimer les caractères de remplacement (�, □)
    .replace(/[\uFFFD\u25A1]/g, '');

  return html;
}
```

#### Caractères Unicode nettoyés :

| Code   | Nom                       | Description                 |
| ------ | ------------------------- | --------------------------- |
| U+200B | ZERO WIDTH SPACE          | Espace de largeur nulle     |
| U+200C | ZERO WIDTH NON-JOINER     | Séparateur invisible        |
| U+200D | ZERO WIDTH JOINER         | Liaison invisible           |
| U+FEFF | ZERO WIDTH NO-BREAK SPACE | BOM (Byte Order Mark)       |
| U+FFFD | REPLACEMENT CHARACTER     | Caractère de remplacement � |
| U+25A1 | WHITE SQUARE              | Carré blanc □               |

### 2. Amélioration du helper Handlebars `markdown`

**Fichier** : `backend/src/modules/pdf/pdf.service.ts`

Ajout d'un **pré-nettoyage** avant la conversion Markdown :

```typescript
handlebars.registerHelper("markdown", function (text: string) {
  if (!text) return "";

  // Nettoyer les caractères problématiques AVANT la conversion
  text = text
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\uFFFD\u25A1]/g, "")
    .replace(/<span[^>]*>\s*<\/span>/gi, "")
    .replace(/<span[^>]*>[\s\u200B-\u200D\uFEFF]*<\/span>/gi, "");

  // ... conversion Markdown normale
});
```

### 3. CSS pour masquer les spans vides résiduels

**Fichier** : `backend/src/modules/pdf/templates/report-main.hbs`

Ajout d'une règle CSS pour **forcer le masquage** des spans vides :

```css
/* Masquer les spans vides et éléments de présentation */
span[role="presentation"]:empty,
span:empty {
  display: none !important;
  visibility: hidden !important;
}
```

Cette règle s'applique à :

- `span[role="presentation"]:empty` : Spans de présentation vides
- `span:empty` : Tous les spans sans contenu

## Pourquoi ces carrés apparaissent ?

### Source 1 : TipTap Editor

TipTap génère parfois des spans vides pour :

- Les positions de curseur
- Les marqueurs de sélection
- Les éléments de structure interne

### Source 2 : Conversion HTML → PDF (Puppeteer)

Puppeteer (Chromium) peut ajouter des spans pour :

- Le positionnement des caractères (`left`, `top`, `font-size`)
- Le rendu des polices custom
- Les éléments `role="presentation"` pour l'accessibilité

### Source 3 : Caractères Unicode problématiques

Certains caractères Unicode ne sont pas supportés par les polices PDF :

- Les zero-width spaces (utilisés par certains éditeurs)
- Les caractères de contrôle
- Les emojis (déjà traités dans BUGFIX-PDF-FORMATTING-V2.md)

## Ordre de nettoyage

**Important** : L'ordre des opérations est critique :

1. **Convertir les entity mentions** (avant de supprimer les data-\*)
2. **Supprimer les attributs TipTap** (data-\*, classes)
3. **Supprimer les spans vides résultants**
4. **Nettoyer les caractères invisibles**
5. **Nettoyer les caractères de remplacement**

Si l'ordre est inversé, on risque de :

- Perdre les entity mentions
- Laisser des spans avec attributs mais sans contenu
- Ne pas détecter les spans "vides" qui contiennent des espaces invisibles

## Test recommandé

```bash
# 1. Recompiler le backend
cd /workspaces/OSINTReport/backend
npm run build

# 2. Redémarrer le service
npm run dev

# 3. Générer un PDF avec du contenu riche
# - Texte avec entités (@mentions)
# - Tableaux TipTap
# - Listes à puces
# - Texte formaté (gras, italique)

# 4. Vérifier que le PDF ne contient plus de carrés □
```

## Cas particuliers

### Spans avec contenu valide

Les spans avec du contenu réel (texte visible) sont **préservés** :

```html
<span class="entity-mention">John Doe</span>
<!-- Préservé -->
<span></span>
<!-- Supprimé -->
<span> </span>
<!-- Supprimé -->
<span role="presentation"></span>
<!-- Supprimé -->
```

### Caractères valides vs invalides

```
✅ Caractères normaux : A-Z, a-z, 0-9, ponctuation
✅ Accents : é, è, à, ç, etc.
✅ Espaces normaux : " " (U+0020)
✅ Emojis supportés : ✓, ✗, ⚠ (déjà remplacés)
❌ Zero-width spaces : U+200B-200D
❌ BOM : U+FEFF
❌ Replacement char : U+FFFD
❌ White square : U+25A1
```

## Impact sur les performances

Ces nettoyages sont **très légers** :

- Regex simples sur des strings courtes
- Pas de parsing DOM complet
- Exécution en quelques millisecondes

Aucun impact notable sur le temps de génération PDF.

## Fichiers modifiés

1. ✅ `backend/src/modules/pdf/pdf.service.ts`

   - Fonction `convertMarkdownToHtml()` : +8 lignes de nettoyage
   - Helper Handlebars `markdown` : +4 lignes de pré-nettoyage

2. ✅ `backend/src/modules/pdf/templates/report-main.hbs`
   - Section `<style>` : +6 lignes de règles CSS

## Résultat attendu

**Avant** :

```
□ Profil - Josée
Description du profil □ avec des □ carrés aléatoires
```

**Après** :

```
Profil - Josée
Description du profil avec du texte propre
```

Les PDF ne devraient plus contenir :

- ❌ Carrés blancs □
- ❌ Carrés noirs ■
- ❌ Caractères de remplacement �
- ❌ Espaces bizarres
- ❌ Spans vides

## Compatibilité

Ces changements sont **100% rétrocompatibles** :

- Pas de changement de structure de données
- Pas de nouveau champ requis
- Nettoyage transparent pour l'utilisateur
- Les anciens PDF restent valides (pas régénérés automatiquement)

## Logs de debug (optionnel)

Pour diagnostiquer les spans vides, ajouter temporairement :

```typescript
// Dans convertMarkdownToHtml(), avant return
console.log("HTML avant nettoyage:", content);
console.log("HTML après nettoyage:", html);
console.log(
  "Caractères problématiques trouvés:",
  (content.match(/[\u200B-\u200D\uFEFF\uFFFD\u25A1]/g) || []).length
);
```

Puis vérifier les logs dans `docker-compose logs -f backend`.
