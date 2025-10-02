# API OSINT Report - Documentation Complète

## Vue d'ensemble

Cette API fournit un système complet de gestion de rapports OSINT avec détection automatique de corrélations, gestion d'entités, et recherche avancée.

**Base URL:** `http://localhost:4000/api`

**Authentification:** Toutes les routes (sauf `/auth/login` et `/auth/register`) requièrent un cookie `access_token` valide.

---

## 📊 Endpoints Rapports

### Liste des rapports
```http
GET /reports
```

**Query params:**
- `status` (optional): `DRAFT` | `PUBLISHED` | `ARCHIVED`
- `search` (optional): Recherche dans titre, caseNumber, reportNumber, requestingService
- `orderBy` (optional): Champ de tri
- `order` (optional): `asc` | `desc` (défaut: `desc`)
- `limit` (optional): Nombre de résultats (1-100, défaut: 20)
- `offset` (optional): Pagination (défaut: 0)

**Réponse:**
```json
{
  "items": [...],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

### Dashboard / Statistiques globales
```http
GET /reports/dashboard
```

**Réponse:**
```json
{
  "generatedAt": "2025-10-02T01:00:00Z",
  "totals": {
    "all": 156,
    "draft": 45,
    "published": 98,
    "archived": 13
  },
  "statusDistribution": [...],
  "recentReports": [...],
  "timeline": [...]
}
```

### Créer un rapport
```http
POST /reports
```

**Body:**
```json
{
  "title": "Enquête Fraude Bancaire #2024-001",
  "caseNumber": "RD-2024-001",
  "reportNumber": "PJ-2024-0123",
  "summary": "Enquête sur fraude bancaire organisée",
  "purpose": "Identifier les auteurs et récupérer les fonds",
  "requestingService": "Brigade Financière",
  "reportingUnit": "Section OSINT",
  "reportingOfficer": "Insp. Dupont",
  "reportingRank": "Inspecteur Principal",
  "investigationContext": "Plainte déposée le 15/09/2024",
  "legalBasis": "Articles 496-505 du Code Pénal",
  "urgencyLevel": "URGENT",
  "classification": "CONFIDENTIAL",
  "keywords": ["fraude", "bancaire", "phishing"],
  "status": "DRAFT",
  "dateRangeStart": "2024-09-01T00:00:00Z",
  "dateRangeEnd": "2024-09-30T23:59:59Z"
}
```

### Détails d'un rapport
```http
GET /reports/:reportId
```

**Réponse:**
```json
{
  "report": {
    "id": "uuid",
    "title": "...",
    "modules": [...],
    "attachments": [...],
    "owner": {...}
  }
}
```

### Mettre à jour un rapport
```http
PATCH /reports/:reportId
```

**Body:** Mêmes champs que création (tous optionnels)

### Changer le statut
```http
PATCH /reports/:reportId/status
```

**Body:**
```json
{
  "status": "PUBLISHED"
}
```

### Dupliquer un rapport
```http
POST /reports/:reportId/duplicate
```

Crée une copie en DRAFT avec l'utilisateur actuel comme propriétaire.

### Statistiques d'un rapport
```http
GET /reports/:reportId/stats
```

**Réponse:**
```json
{
  "stats": {
    "modules": 5,
    "entities": 12,
    "researchRecords": 28,
    "attachments": 3,
    "correlations": 2
  }
}
```

---

## 📦 Endpoints Modules

### Créer un module
```http
POST /reports/:reportId/modules
```

**Body:**
```json
{
  "type": "phone_analysis",
  "slug": "analyse-tel-suspect",
  "title": "Analyse téléphonique",
  "headline": "Numéro principal identifié",
  "entityId": "uuid-entity",
  "position": 0,
  "payload": {
    "phoneNumber": "+32475123456",
    "operator": "Proximus",
    "type": "prepaid"
  }
}
```

**Types de modules disponibles:** Voir `REPORT_MODULE_TYPES` dans constants

### Mettre à jour un module
```http
PATCH /reports/:reportId/modules/:moduleId
```

### Supprimer un module
```http
DELETE /reports/:reportId/modules/:moduleId
```

### Réorganiser les modules
```http
POST /reports/:reportId/modules/reorder
```

**Body:**
```json
{
  "moduleIds": ["uuid1", "uuid2", "uuid3"]
}
```

L'ordre du tableau définit la nouvelle position (0, 1, 2, ...)

---

## 🔍 Endpoints Research Records

### Créer un enregistrement de recherche
```http
POST /reports/modules/:moduleId/research-records
```

**Body:**
```json
{
  "researchTypeId": "uuid-type",
  "entityId": "uuid-entity",
  "subtitle": "Analyse CDR",
  "details": {
    "callsCount": 42,
    "duration": 1247,
    "mostCalledNumber": "+32475987654"
  },
  "sensitiveDataRef": "uuid-vault-item"
}
```

### Lister les enregistrements d'un module
```http
GET /reports/modules/:moduleId/research-records
```

### Détails d'un enregistrement
```http
GET /reports/research-records/:recordId
```

### Mettre à jour
```http
PATCH /reports/research-records/:recordId
```

### Supprimer
```http
DELETE /reports/research-records/:recordId
```

### Lister les types de recherche
```http
GET /reports/research-types
```

**Réponse:**
```json
{
  "types": [
    {
      "id": "uuid",
      "code": "whois",
      "label": "Recherche WHOIS"
    },
    {
      "id": "uuid",
      "code": "social_media",
      "label": "Réseaux sociaux"
    }
  ]
}
```

---

## 👤 Endpoints Entités

### Créer une entité
```http
POST /entities
```

**Body:**
```json
{
  "label": "Jean Dupont",
  "type": "PERSON",
  "notes": "Suspect principal"
}
```

**Types d'entités:** `PERSON`, `ORGANIZATION`, `TELEPHONE`, `EMAIL`, `ACCOUNT`, `ADDRESS`, `OTHER`

### Lister les entités
```http
GET /entities
```

**Query params:**
- `type` (optional): Type d'entité
- `search` (optional): Recherche dans label et notes
- `limit` (optional): Nombre de résultats (défaut: 50)
- `offset` (optional): Pagination (défaut: 0)

**Réponse:**
```json
{
  "entities": [...],
  "total": 125,
  "limit": 50,
  "offset": 0
}
```

### Recherche d'entités (autocomplétion)
```http
GET /entities/search?q=dupont&type=PERSON&limit=10
```

**Réponse:**
```json
{
  "entities": [
    {
      "id": "uuid",
      "label": "Jean Dupont",
      "type": "PERSON"
    }
  ]
}
```

### Détails d'une entité
```http
GET /entities/:entityId
```

**Réponse:**
```json
{
  "entity": {
    "id": "uuid",
    "label": "Jean Dupont",
    "type": "PERSON",
    "notes": "...",
    "modules": [...],
    "researchRecords": [...]
  }
}
```

### Mettre à jour une entité
```http
PATCH /entities/:entityId
```

### Supprimer une entité
```http
DELETE /entities/:entityId
```

---

## 🔗 Endpoints Corrélations

### Vérifier une corrélation en temps réel
```http
POST /correlations/check
```

**Body:**
```json
{
  "reportId": "current-report-uuid",
  "value": "+32475123456",
  "type": "PHONE"
}
```

**Types:** `PHONE`, `EMAIL`, `ADDRESS`, `NAME`, `ACCOUNT`, `ORGANIZATION`

**Réponse:**
```json
{
  "success": true,
  "data": {
    "found": true,
    "matches": [
      {
        "reportId": "other-report-uuid",
        "reportTitle": "Enquête précédente",
        "reportNumber": "PJ-2024-0001",
        "correlationType": "PHONE",
        "confidence": 1.0,
        "correlationData": {
          "value": "+32475123456",
          "context": "Module: Analyse téléphonique"
        }
      }
    ],
    "totalMatches": 1
  }
}
```

### Lancer la détection automatique
```http
POST /correlations/reports/:reportId/detect
```

Analyse tout le rapport et crée automatiquement les corrélations.

### Récupérer les corrélations d'un rapport
```http
GET /correlations/reports/:reportId
```

**Query params:**
- `type` (optional): Filtrer par type de corrélation
- `minConfidence` (optional): Score minimum (0-1)
- `verified` (optional): `true` | `false`

### Créer une corrélation manuelle
```http
POST /correlations
```

**Body:**
```json
{
  "sourceReportId": "uuid-rapport-1",
  "relatedReportId": "uuid-rapport-2",
  "correlationType": "PHONE",
  "correlationData": {
    "value": "+32475123456",
    "context": "Même numéro trouvé",
    "extractedFrom": "module.payload"
  },
  "confidence": 1.0,
  "notes": "Corrélation confirmée manuellement"
}
```

### Vérifier/valider une corrélation
```http
PATCH /correlations/:correlationId/verify
```

**Body:**
```json
{
  "notes": "Corrélation confirmée après analyse"
}
```

Marque la corrélation comme vérifiée par l'enquêteur actuel.

### Supprimer une corrélation
```http
DELETE /correlations/:correlationId
```

---

## 📎 Endpoints Pièces jointes

### Enregistrer une pièce jointe
```http
POST /reports/:reportId/attachments
```

**Body:**
```json
{
  "moduleId": "uuid-module",
  "type": "image",
  "storageKey": "s3://bucket/path/to/file.jpg",
  "fileName": "screenshot.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 524288,
  "caption": "Capture d'écran du profil Facebook",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Types:** Voir `REPORT_ATTACHMENT_TYPES` dans constants

---

## 👥 Endpoints Utilisateurs

### Liste des utilisateurs
```http
GET /users
```

**Permissions:** `users:read`

### Créer un utilisateur
```http
POST /users
```

**Permissions:** `users:write`

### Détails d'un utilisateur
```http
GET /users/:userId
```

### Mettre à jour un utilisateur
```http
PATCH /users/:userId
```

### Profil de l'utilisateur connecté
```http
GET /users/me
```

### Mettre à jour son profil
```http
PATCH /users/me
```

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

---

## 🔐 Endpoints Authentification

### Connexion
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "gaetan.minnekeer@police.belgium.eu",
  "password": "votre_mot_de_passe"
}
```

**Réponse:**
```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "firstName": "Gaetan",
    "lastName": "Minnekeer",
    "roleName": "admin",
    "permissions": ["reports:read", "reports:write", "users:read", "users:write", "system:admin"]
  }
}
```

Cookie `access_token` défini automatiquement.

### Inscription
```http
POST /auth/register
```

**Body:**
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "matricule": "P123456",
  "email": "jean.dupont@police.belgium.eu",
  "password": "MotDePasse123!"
}
```

### Déconnexion
```http
POST /auth/logout
```

### Mot de passe oublié
```http
POST /auth/forgot-password
```

**Body:**
```json
{
  "email": "user@police.belgium.eu"
}
```

### Réinitialisation du mot de passe
```http
POST /auth/reset-password
```

**Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NouveauMotDePasse123!"
}
```

---

## ⚙️ Endpoints SMTP Configuration (Admin)

### Lister les configurations SMTP
```http
GET /smtp
```

**Permissions:** `system:admin`

### Créer une configuration
```http
POST /smtp
```

**Body:**
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false,
  "username": "noreply@police.belgium.eu",
  "password": "app_password",
  "fromEmail": "noreply@police.belgium.eu",
  "fromName": "Police Belge - OSINT",
  "active": true
}
```

### Mettre à jour
```http
PATCH /smtp/:configId
```

### Supprimer
```http
DELETE /smtp/:configId
```

### Activer/désactiver
```http
PATCH /smtp/:configId/toggle
```

---

## 📋 Codes de statut HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Ressource créée |
| 204 | Succès sans contenu (DELETE) |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 403 | Non autorisé (permissions insuffisantes) |
| 404 | Ressource introuvable |
| 409 | Conflit (ex: slug déjà utilisé) |
| 500 | Erreur serveur |

---

## 🔑 Permissions requises

| Permission | Description |
|------------|-------------|
| `reports:read` | Lecture des rapports |
| `reports:write` | Création et modification des rapports |
| `users:read` | Lecture des utilisateurs |
| `users:write` | Gestion des utilisateurs |
| `system:admin` | Administration complète |

**Rôles prédéfinis:**
- **admin**: Toutes les permissions
- **editor**: `reports:read` + `reports:write`
- **reader**: `reports:read` uniquement

---

## 🧪 Exemples d'utilisation

### Créer un rapport complet

```bash
# 1. Connexion
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@police.belgium.eu",
    "password": "Admin123!"
  }'

# 2. Créer le rapport
curl -X POST http://localhost:4000/api/reports \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Enquête Test",
    "status": "DRAFT"
  }' | jq .

# 3. Créer une entité
curl -X POST http://localhost:4000/api/entities \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "label": "Suspect A",
    "type": "PERSON"
  }' | jq .

# 4. Ajouter un module au rapport
curl -X POST http://localhost:4000/api/reports/{reportId}/modules \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "phone_analysis",
    "title": "Analyse téléphonique",
    "payload": {
      "phoneNumber": "+32475123456"
    }
  }' | jq .

# 5. Vérifier les corrélations
curl -X POST http://localhost:4000/api/correlations/check \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "reportId": "{reportId}",
    "value": "+32475123456",
    "type": "PHONE"
  }' | jq .
```

---

## 📊 Flux de travail typique

1. **Création du rapport** → `POST /reports` (DRAFT)
2. **Ajout d'entités** → `POST /entities`
3. **Création des modules** → `POST /reports/:id/modules`
4. **Ajout de recherches** → `POST /reports/modules/:id/research-records`
5. **Vérification de corrélations** → `POST /correlations/check` (temps réel)
6. **Détection automatique** → `POST /correlations/reports/:id/detect`
7. **Publication** → `PATCH /reports/:id/status` (PUBLISHED)
8. **Export PDF** → (À venir dans Phase 5)

---

## 🚀 Métriques de performance

- Temps de réponse moyen: **< 100ms**
- Liste rapports (20 items): **~50ms**
- Détection corrélations: **100-500ms** (selon nb rapports)
- Recherche entités: **< 20ms**

---

**Version:** 1.0  
**Dernière mise à jour:** 2 octobre 2025  
**Base de données:** PostgreSQL 16  
**Moteur de recherche:** Meilisearch 1.5
