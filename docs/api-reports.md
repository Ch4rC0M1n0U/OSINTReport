# API Rapports OSINT

Cette fiche décrit les endpoints REST exposés par le module « reports ». Toutes les routes sont protégées par l’authentification (`requireAuth`) et nécessitent des permissions RBAC spécifiques.

## Permissions

| Code | Description | Usage |
| --- | --- | --- |
| `REPORTS_READ` | Lecture des rapports OSINT | Requise pour `GET /reports` et `GET /reports/:id`. |
| `REPORTS_WRITE` | Création/modification des rapports OSINT | Requise pour `POST`, `PATCH`, `DELETE` et enregistrement de pièces jointes. |

## Schémas de validation

Les payloads sont validés via Zod dans `backend/src/modules/reports/report.validation.ts`.

- `createReportSchema`
- `updateReportSchema` (version partielle)
- `createModuleSchema`
- `updateModuleSchema`
- `registerAttachmentSchema`
- `listReportsQuerySchema`

Le tableau ci-dessous synthétise les champs principaux.

### Rapport (`POST /reports`)

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `title` | `string` (≥ 3, ≤ 255) | ✅ | Titre du rapport. |
| `caseNumber` | `string` (≤ 100) | ❌ | Numéro de dossier interne. |
| `reportNumber` | `string` (≤ 50) | ❌ | Numéro de rapport officiel. |
| `summary` | `string` | ❌ | Résumé des faits. |
| `purpose` | `string` | ❌ | Objet de la demande OSINT. |
| `relatedCases` | `string[]` | ❌ | Références de dossiers reliés. |
| `requestingService` | `string` (≤ 150) | ❌ | Service demandeur. |
| `reportingUnit` | `string` (≤ 150) | ❌ | Unité rédactrice. |
| `reportingOfficer` | `string` (≤ 150) | ❌ | Agent rédacteur. |
| `reportingRank` | `string` (≤ 100) | ❌ | Grade du rédacteur. |
| `issuedAt` | `string` ISO ou `Date` | ❌ | Date d’émission (UTC). |
| `dateRangeStart` | `string` ISO ou `Date` | ❌ | Début de la période analysée. |
| `dateRangeEnd` | `string` ISO ou `Date` | ❌ | Fin de la période analysée. |
| `objectives` | `string[]` | ❌ | Objectifs opérationnels. |
| `status` | `"DRAFT" | "PUBLISHED" | "ARCHIVED"` | ❌ (défaut `DRAFT`) | Statut courant du rapport. |

Réponse (201) : objet `Report` complet (avec métadonnées, propriétaire et modules initialement vides).

### Liste des rapports (`GET /reports`)

Paramètres de requête validés via `listReportsQuerySchema` :

| Paramètre | Type | Défault | Description |
| --- | --- | --- | --- |
| `status` | `ReportStatus` | — | Filtrer sur un statut précis. |
| `search` | `string` (min 2) | — | Recherche sur le titre, `caseNumber`, `reportNumber` ou `requestingService`. |
| `orderBy` | `"createdAt" | "updatedAt" | "issuedAt" | "title"` | `issuedAt` | Champ de tri. |
| `order` | `"asc" | "desc"` | `desc` | Direction du tri. |
| `limit` | `number` (1-100) | `20` | Taille de page. |
| `offset` | `number` ≥ 0 | `0` | Décalage de pagination. |

Réponse (200) :

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "…",
      "status": "DRAFT",
      "issuedAt": "2025-10-01T08:00:00.000Z",
      "owner": {
        "id": "…",
        "firstName": "…",
        "lastName": "…",
        "email": "…"
      }
      // autres champs Report
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### Récupération d’un rapport (`GET /reports/:reportId`)

Renvoie le rapport complet avec modules, entités, pièces jointes et recherches associées. En cas d’identifiant invalide, la réponse est `404` avec message « Rapport introuvable ».

### Mise à jour partielle (`PATCH /reports/:reportId`)

Payload validé via `updateReportSchema`. Tous les champs sont optionnels ; seuls ceux présents sont modifiés. Particularités :

- `objectives` et `relatedCases` : transmission d’un tableau non vide pour remplacer la valeur existante, `null` pour effacer, omis pour conserver.
- `issuedAt` : chaîne ISO 8601 ou `null`.

Réponses :

- `200` → rapport mis à jour.
- `404` → rapport introuvable.

### Modules de rapport

#### Création (`POST /reports/:reportId/modules`)

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `type` | `enum` (`REPORT_MODULE_TYPES`) | ✅ | Type fonctionnel du module (`entity_overview`, `platform_analysis`, etc.). |
| `slug` | `string` (≤ 120) | ❌ | Identifiant unique par rapport (utilisé pour le routage front). |
| `title` | `string` (≤ 255) | ❌ | Titre affiché. |
| `headline` | `string` (≤ 255) | ❌ | Résumé court. |
| `entityId` | `uuid` | ❌ | Référence à une entité existante. |
| `position` | `number` ≥ 0 | ❌ (défaut `0`) | Ordre d’affichage. |
| `payload` | `Record<string, any>` | ❌ | Données spécifiques au module (structure libre maîtrisée par le front). |

Contraintes supplémentaires :

- `slug` doit être unique par rapport ; renvoie `409` sinon.
- `entityId` doit exister ; renvoie `400` si introuvable.

#### Mise à jour (`PATCH /reports/:reportId/modules/:moduleId`)

Même structure que pour la création mais tous les champs sont optionnels. Le changement de `slug` respecte l’unicité. Réponses possibles : `200`, `404` (module/rapport introuvable), `409` (slug en conflit), `400` (entité absente).

#### Suppression (`DELETE /reports/:reportId/modules/:moduleId`)

Supprime le module ciblé ainsi que ses pièces jointes et `ResearchRecord` associés. Réponse `204` en cas de succès ; `404` si le module n’appartient pas au rapport.

### Pièces jointes (`POST /reports/:reportId/attachments`)

| Champ | Type | Obligatoire | Description |
| --- | --- | --- | --- |
| `moduleId` | `uuid` | ❌ | Module auquel rattacher la pièce jointe. Si fourni, doit appartenir au rapport. |
| `type` | `enum` (`REPORT_ATTACHMENT_TYPES`) | ❌ (défaut `image`) | Nature du média (`image`, `document`, etc.). |
| `storageKey` | `string` | ✅ | Clé de stockage (bucket chiffré / objet). |
| `fileName` | `string` | ✅ | Nom original du fichier. |
| `mimeType` | `string` | ✅ | Type MIME. |
| `fileSize` | `number` (> 0) | ✅ | Taille en octets. |
| `caption` | `string` | ❌ | Légende facultative. |
| `expiresAt` | `date` | ❌ | Date d’expiration pour la purge automatique. |

Réponse `201` avec l’objet `ReportAttachment`. Erreurs possibles : `400` si `moduleId` inconnu ou hors du rapport, `404` si le rapport est introuvable.

> ℹ️ **Chiffrement** : `storageKey` est renvoyé en clair dans la réponse, mais la base stocke un pointeur `vault:{id}` vers l’élément chiffré (`VaultItem`).

## Codes d’erreur communs

| Code | Signification |
| --- | --- |
| `400` | Payload ou relation invalide (ex. `moduleId` inexistant). |
| `401` | Authentification requise. |
| `403` | Permission insuffisante pour l’action. |
| `404` | Ressource introuvable (`Rapport introuvable`, `Module introuvable`). |
| `409` | Conflit de données (slug duplicate). |
| `500` | Erreur serveur (exceptions non gérées). |

## Bonnes pratiques

- Toujours appliquer `npm run prisma:migrate` avant d’utiliser l’API en développement afin que la structure des tables soit à jour.
- Utiliser les schémas Zod côté frontend pour garantir la cohérence des payloads envoyés.
- Conserver la logique de chiffrement/stockage sécurisé dans un service dédié avant de renseigner `storageKey`.
- Prévoir une politique de rétention pour les pièces jointes via `expiresAt`.

Pour la structure narrative complète d’un rapport (sections, modules types, etc.), consultez `docs/report-template.md`.
