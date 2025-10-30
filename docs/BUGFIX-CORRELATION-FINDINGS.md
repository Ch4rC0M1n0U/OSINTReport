# 🔧 Correction : Détection de corrélation dans les "Entités identifiées"

**Date** : 30 octobre 2025  
**Type** : Bugfix  
**Criticité** : Élevée  
**Composant** : Système de corrélation

## 📋 Problème identifié

Le système de détection de corrélation ne trouvait **PAS** les correspondances dans les "Entités identifiées" (module EntityOverview).

### Exemple du problème

- **Situation** : Rapport dupliqué 2 fois avec "Robert Redford" dans les Entités identifiées
- **Comportement attendu** : La détection de corrélation devrait trouver "Robert Redford" dans les 3 rapports
- **Comportement observé** : Aucune corrélation détectée ❌

## 🔍 Analyse de la cause

### Structure des données

Les "Entités identifiées" sont stockées dans `ReportModule.payload.findings[]` avec cette structure :

```typescript
{
  findings: [
    {
      label: "Robert Redford",
      description: "...",
      metadata: {
        entityType: "person",
        personDetails: {
          firstName: "Robert",
          lastName: "Redford",
          phoneNumbers: [...],
          emails: [...],
          addresses: [...]
        }
      }
    }
  ]
}
```

### Code problématique

Le service `correlation.service.ts` ne cherchait que dans :

1. ❌ `payload.firstName` + `payload.lastName` (structure ancienne)
2. ✅ `researchItems.details`
3. ❌ **IGNORAIT** `payload.findings[]`

## ✅ Solution implémentée

### Modification 1 : `extractCorrelatableData()`

Ajout de l'extraction depuis `payload.findings[]` :

```typescript
// Extraire aussi depuis les "Entités identifiées" (findings)
if (payload.findings && Array.isArray(payload.findings)) {
  for (const finding of payload.findings) {
    if (finding.metadata) {
      const meta = finding.metadata;

      // Noms de personnes
      if (meta.entityType === "person" && meta.personDetails) {
        const firstName = meta.personDetails.firstName || "";
        const lastName = meta.personDetails.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();

        if (fullName) {
          correlatableData.push({
            type: CorrelationType.NAME,
            value: fullName,
            context: `Entité identifiée: ${finding.label}`,
          });
        }
      }

      // Organisations
      if (
        (meta.entityType === "organization" || meta.entityType === "company") &&
        meta.companyDetails
      ) {
        if (meta.companyDetails.legalName) {
          correlatableData.push({
            type: CorrelationType.ORGANIZATION,
            value: meta.companyDetails.legalName,
            context: `Entité identifiée: ${finding.label}`,
          });
        }
      }

      // Téléphones, emails, adresses...
      // (extraction depuis personDetails et companyDetails)
    }
  }
}
```

### Modification 2 : `checkCorrelation()`

Ajout de la recherche dans `payload.findings[]` lors de la comparaison avec d'autres rapports :

```typescript
// Chercher aussi dans les "Entités identifiées" (findings)
if (!found && module.payload && typeof module.payload === "object") {
  const payload: any = module.payload;

  if (payload.findings && Array.isArray(payload.findings)) {
    for (const finding of payload.findings) {
      if (finding.metadata) {
        const meta = finding.metadata;

        switch (type) {
          case CorrelationType.NAME:
            if (meta.entityType === "person" && meta.personDetails) {
              const fullName = `${meta.personDetails.firstName || ""} ${
                meta.personDetails.lastName || ""
              }`.trim();

              if (fullName === value) {
                found = true;
                foundContext = `Entité identifiée: ${finding.label}`;
              }
            }
            break;
          // ... autres types de corrélation
        }
      }
    }
  }
}
```

## 📊 Types de données extraites

Le système extrait maintenant depuis `findings[]` :

| Type             | Source                                  | Exemple              |
| ---------------- | --------------------------------------- | -------------------- |
| **NAME**         | `personDetails.firstName + lastName`    | "Robert Redford"     |
| **ORGANIZATION** | `companyDetails.legalName`              | "ACME Corporation"   |
| **PHONE**        | `personDetails.phoneNumbers[].number`   | "+33612345678"       |
| **EMAIL**        | `personDetails.emails[].address`        | "robert@example.com" |
| **ADDRESS**      | `personDetails.addresses[].fullAddress` | "123 Main St, Paris" |

## 🧪 Tests

### Scénario de test

1. Créer un rapport avec "Robert Redford" dans Entités identifiées
2. Dupliquer le rapport 2 fois
3. Lancer "Détecter corrélations" sur l'un des rapports
4. **Résultat attendu** : 2 corrélations de type NAME détectées ✅

### Vérification

```bash
# Vérifier dans les logs
# Devrait afficher : "X éléments analysés"
# avec au moins le nom de la personne

# Vérifier dans la base de données
SELECT * FROM "ReportCorrelation"
WHERE "correlationType" = 'NAME'
AND "correlationData"->>'value' = 'Robert Redford';
```

## 📝 Impact

### Portée

- ✅ Améliore la détection de corrélations pour tous les modules EntityOverview
- ✅ Couvre les noms, organisations, téléphones, emails et adresses
- ✅ Gère la correspondance exacte et partielle pour les noms
- ✅ Contextualise avec le label de l'entité identifiée

### Rétrocompatibilité

- ✅ Conserve la recherche dans les structures anciennes (`payload.firstName`, etc.)
- ✅ Conserve la recherche dans `researchItems`
- ✅ Aucune migration de données nécessaire

## 🔗 Fichiers modifiés

- `backend/src/modules/correlations/correlation.service.ts`
  - Fonction `extractCorrelatableData()` : +115 lignes
  - Fonction `checkCorrelation()` : +120 lignes

## 📚 Documentation associée

- [Guide d'implémentation des corrélations](./correlation-implementation-guide.md)
- [Résumé Phase 1 - Corrélations](./correlation-system-phase1-summary.md)

---

**Livré par** : GitHub Copilot 🤖  
**Testé** : ⚠️ À valider par l'utilisateur
