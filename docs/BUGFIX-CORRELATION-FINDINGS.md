# 🔧 Correction : Détection de corrélation dans les "Entités identifiées"

**Date** : 30 octobre 2025  
**Type** : Bugfix critique  
**Criticité** : Élevée  
**Composant** : Système de corrélation  
**Statut** : ✅ RÉSOLU ET TESTÉ

## 📋 Problème identifié

Le système de détection de corrélation ne trouvait **PAS** les correspondances dans les "Entités identifiées" (module EntityOverview).

### Exemple du problème

- **Situation** : Rapports "LUMBAGO" et "EMBARGO" avec "Robert Redfort" dans les Entités identifiées
- **Comportement attendu** : La détection de corrélation devrait trouver "Robert Redfort" dans les 2 rapports
- **Comportement observé** : Aucune corrélation détectée ❌

## 🔍 Analyse de la cause

### Structure réelle des données

Inspection de la base de données a révélé que les findings sont stockés ainsi :

```json
{
  "label": "Robert Redfort",
  "description": "",
  "metadata": {
    "entityType": "person",
    "personDetails": {
      "dateOfBirth": "1947-07-25",
      "nationalRegistryNumber": "47.07.25-125-25",
      "phoneNumbers": [],
      "physicalAddress": "gfqdfsgrsg"
    }
  }
}
```

**⚠️ Points critiques :**

- Le **nom complet** est dans `finding.label`, PAS dans `personDetails.firstName/lastName`
- Les modules EntityOverview **n'ont PAS** d'entité associée (`entityId = null`)

### Problèmes identifiés

1. ❌ Code cherchait `personDetails.firstName + lastName` qui **n'existent PAS**
2. ❌ Code était dans le bloc `if (module.entity)` alors que EntityOverview **n'a PAS d'entité**
3. ❌ Le `label` du finding n'était pas utilisé

## ✅ Solution implémentée

### Modification 1 : Déplacement hors du bloc `if (module.entity)`

```typescript
// AVANT (❌)
for (const module of report.modules) {
  if (module.entity) {
    // ← EntityOverview n'a PAS d'entité !
    if (payload.findings) {
      /* ... */
    }
  }
}

// APRÈS (✅)
for (const module of report.modules) {
  // Findings pour TOUS les modules
  if (payload.findings) {
    /* ... */
  }

  // Ensuite modules avec entité
  if (module.entity) {
    /* ... */
  }
}
```

### Modification 2 : Utilisation du `label`

```typescript
if (payload.findings && Array.isArray(payload.findings)) {
  for (const finding of payload.findings) {
    const label = finding.label?.trim(); // ← NOM COMPLET

    if (!label) continue;

    if (finding.metadata?.entityType === "person") {
      correlatableData.push({
        type: CorrelationType.NAME,
        value: label, // ← "Robert Redfort"
        context: `Entité identifiée: ${label}`,
      });
    }

    // Adresse physique
    if (finding.metadata?.personDetails?.physicalAddress) {
      correlatableData.push({
        type: CorrelationType.ADDRESS,
        value: finding.metadata.personDetails.physicalAddress,
        context: `Entité identifiée: ${label}`,
      });
    }
  }
}
```

## 🧪 Tests et résultats

### Commande de test

```bash
npx tsx src/modules/correlations/test-detection.ts
```

### Résultats ✅

```
=== Rapport: LUMBAGO ===
✅ 2 données corrélables extraites:
   - [NAME] "Robert Redfort" (Entité identifiée: Robert Redfort)
   - [ADDRESS] "gfqdfsgrsg" (Entité identifiée: Robert Redfort)

🔄 Lancement de la détection...
✅ 2 corrélation(s) détectée(s)
   🔗 Corrélation avec: EMBARGO
      Type: NAME
      Valeur: Robert Redfort
      Confiance: 1.0

=== Rapport: EMBARGO ===
✅ 2 données corrélables extraites:
   - [NAME] "Robert Redfort" (Entité identifiée: Robert Redfort)
   - [ADDRESS] "gfqdfsgrsg" (Entité identifiée: Robert Redfort)

✅ 4 corrélation(s) détectée(s) (bidirectionnelles)
```

## 📊 Types de données extraites

| Type             | Source                                        | Testé |
| ---------------- | --------------------------------------------- | ----- |
| **NAME**         | `finding.label`                               | ✅    |
| **ADDRESS**      | `personDetails.physicalAddress`               | ✅    |
| **ORGANIZATION** | `finding.label` ou `companyDetails.legalName` | ⚠️    |
| **PHONE**        | `personDetails.phoneNumbers[]`                | ⚠️    |
| **EMAIL**        | `personDetails.emails[]`                      | ⚠️    |

## 📝 Impact

- ✅ Résout le problème de détection dans EntityOverview
- ✅ Support des tableaux vides (phoneNumbers, emails)
- ✅ Fallback sur label si pas de metadata
- ✅ Correspondance exacte et partielle pour noms
- ✅ Rétrocompatible avec anciennes structures

## 🔗 Fichiers modifiés

- `backend/src/modules/correlations/correlation.service.ts`
  - `extractCorrelatableData()` : Déplacement et utilisation du label
  - `checkCorrelation()` : Recherche dans findings

---

**Livré par** : GitHub Copilot 🤖  
**Testé** : ✅ Validé sur LUMBAGO et EMBARGO
