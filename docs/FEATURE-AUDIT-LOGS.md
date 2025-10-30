# 📋 Système de Logs d'Audit - Documentation

## Vue d'ensemble

Le système de logs d'audit permet de tracer et surveiller toutes les actions importantes effectuées sur la plateforme OSINTReport. Il enregistre automatiquement les actions des utilisateurs avec des détails contextuels complets.

## Architecture

### Backend

#### Composants principaux

1. **Service d'audit** (`backend/src/modules/audit/audit.service.ts`)

   - `AuditService.log()` - Créer un log d'audit
   - `AuditService.logFromRequest()` - Logger depuis une requête Express
   - `AuditService.getLogs()` - Récupérer les logs avec filtres
   - `AuditService.getStats()` - Obtenir des statistiques
   - `AuditService.cleanOldLogs()` - Nettoyer les anciens logs

2. **Contrôleur d'audit** (`backend/src/modules/audit/audit.controller.ts`)

   - Gère les requêtes HTTP pour consulter les logs
   - Vérifie les permissions (`system:admin` ou `audit:read`)

3. **Router d'audit** (`backend/src/modules/audit/audit.router.ts`)

   - `GET /api/audit-logs` - Liste des logs
   - `GET /api/audit-logs/stats` - Statistiques
   - `GET /api/audit-logs/actions` - Actions disponibles
   - `GET /api/audit-logs/resources` - Ressources disponibles

4. **Middleware** (`auditLog()`)
   - Fonction helper pour logger automatiquement les actions réussies

#### Enums disponibles

**Actions** (`AuditAction`)

```typescript
// Authentification
LOGIN, LOGOUT, LOGIN_FAILED;
PASSWORD_RESET_REQUEST, PASSWORD_RESET_COMPLETE;
TWO_FACTOR_ENABLE, TWO_FACTOR_DISABLE, TWO_FACTOR_VERIFY;

// Utilisateurs
USER_CREATE, USER_UPDATE, USER_DELETE;
USER_SUSPEND, USER_ACTIVATE, USER_VIEW;

// Rapports
REPORT_CREATE, REPORT_UPDATE, REPORT_DELETE;
REPORT_PUBLISH, REPORT_ARCHIVE, REPORT_VIEW;
REPORT_EXPORT_PDF, REPORT_VALIDATE;

// Modules, Entités, Recherches, etc.
MODULE_CREATE, MODULE_UPDATE, MODULE_DELETE;
ENTITY_CREATE, ENTITY_UPDATE, ENTITY_DELETE;
RESEARCH_CREATE, RESEARCH_UPDATE, RESEARCH_DELETE;

// Fichiers
FILE_UPLOAD, FILE_DELETE;

// Système
SETTINGS_UPDATE, SMTP_SETTINGS_UPDATE, AI_SETTINGS_UPDATE;
MAINTENANCE_ENABLE, MAINTENANCE_DISABLE;

// IA
AI_GENERATE_TEXT, AI_ANALYZE_IMAGE;

// Recherche
SEARCH_EXECUTE, SEARCH_REINDEX;
```

**Ressources** (`AuditResource`)

```typescript
AUTH, USER, REPORT, MODULE, ENTITY, RESEARCH;
FILE, CORRELATION, SETTINGS, AI, SEARCH;
```

### Frontend

#### Composants principaux

1. **Service API** (`frontend/src/services/api/audit.ts`)

   - `auditApi.getLogs()` - Récupérer les logs
   - `auditApi.getStats()` - Récupérer les statistiques
   - `auditApi.getActions()` - Liste des actions
   - `auditApi.getResources()` - Liste des ressources

2. **Page d'administration** (`frontend/src/pages/admin/AuditLogsPage.vue`)
   - Interface complète de consultation des logs
   - Filtres avancés (date, action, ressource, utilisateur, recherche)
   - Statistiques en temps réel
   - Modal de détails pour chaque log

## Utilisation

### Logger une action manuellement

```typescript
import {
  AuditService,
  AuditAction,
  AuditResource,
} from "@/modules/audit/audit.service";

// Dans un contrôleur
await AuditService.logFromRequest(
  req,
  AuditAction.REPORT_CREATE,
  AuditResource.REPORT,
  reportId,
  {
    title: report.title,
    caseNumber: report.caseNumber,
  }
);
```

### Utiliser le middleware automatique

```typescript
import { auditLog } from "@/modules/audit/audit.service";
import { AuditAction, AuditResource } from "@/modules/audit/audit.service";

// Dans un router
router.post(
  "/reports",
  requireAuth,
  requirePermissions(PermissionCode.REPORTS_WRITE),
  auditLog(AuditAction.REPORT_CREATE, AuditResource.REPORT, {
    getResourceId: (req) => req.body.reportId,
    getDetails: (req) => ({
      title: req.body.title,
      caseNumber: req.body.caseNumber,
    }),
  }),
  ReportController.create
);
```

### Logger sans requête HTTP

```typescript
await AuditService.log({
  userId: user.id,
  action: AuditAction.SEARCH_REINDEX,
  resource: AuditResource.SEARCH,
  details: {
    indexedCount: 1523,
    duration: "45s",
  },
  ipAddress: "127.0.0.1",
  userAgent: "CRON Job",
});
```

## Structure de la base de données

```prisma
model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String   // Action effectuée (enum)
  resource   String   // Type de ressource (enum)
  resourceId String?  // ID de la ressource concernée
  details    Json?    // Détails additionnels
  ipAddress  String?  // Adresse IP de l'utilisateur
  userAgent  String?  // User agent du navigateur
  timestamp  DateTime @default(now())

  user User? @relation("AuditLogActor", fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([timestamp])
}
```

## Filtres disponibles

La page d'administration permet de filtrer les logs selon :

- **Recherche textuelle** : Action, ressource, IP
- **Action** : Type d'action spécifique
- **Ressource** : Type de ressource
- **Plage de dates** : Date de début et de fin
- **Pagination** : 50 logs par page (configurable)

## Statistiques

Le tableau de bord des logs affiche :

- **Total de logs** enregistrés
- **Actions les plus fréquentes** (top 10)
- **Ressources les plus modifiées** (toutes)
- **Utilisateurs les plus actifs** (top 10)

Les statistiques peuvent être filtrées par période.

## Sécurité et permissions

### Permissions requises

Pour accéder aux logs d'audit, l'utilisateur doit avoir :

- `system:admin` (administrateur système)
- **OU** `audit:read` (lecture des audits uniquement)

### Données sensibles

Les logs peuvent contenir des informations sensibles dans le champ `details`. Il est recommandé de :

- Ne jamais logger de mots de passe
- Anonymiser les données personnelles si nécessaire
- Limiter les détails aux informations essentielles

## Maintenance

### Nettoyage automatique

Pour éviter une croissance excessive de la table, vous pouvez nettoyer les anciens logs :

```typescript
// Supprimer les logs de plus de 90 jours
const deletedCount = await AuditService.cleanOldLogs(90);
console.log(`${deletedCount} logs supprimés`);
```

**Recommandation** : Configurer un CRON job pour nettoyer automatiquement les logs anciens.

### Archivage

Pour des raisons légales ou de conformité, vous pouvez archiver les logs avant de les supprimer :

1. Exporter les logs vers un fichier/base externe
2. Supprimer les logs de la base principale
3. Stocker les archives de manière sécurisée

## Exemples d'utilisation

### Tracer une connexion réussie

```typescript
await AuditService.logFromRequest(
  req,
  AuditAction.LOGIN,
  AuditResource.AUTH,
  user.id,
  {
    email: user.email,
    matricule: user.matricule,
  }
);
```

### Tracer une tentative de connexion échouée

```typescript
await AuditService.log({
  userId: null, // Pas d'utilisateur connecté
  action: AuditAction.LOGIN_FAILED,
  resource: AuditResource.AUTH,
  details: {
    email: attemptedEmail,
    reason: "Invalid credentials",
  },
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
});
```

### Tracer une modification de paramètres

```typescript
await AuditService.logFromRequest(
  req,
  AuditAction.SETTINGS_UPDATE,
  AuditResource.SETTINGS,
  undefined,
  {
    changedFields: ["maintenanceEnabled", "maintenanceMessage"],
    oldValues: { maintenanceEnabled: false },
    newValues: { maintenanceEnabled: true },
  }
);
```

### Tracer une génération de PDF

```typescript
await AuditService.logFromRequest(
  req,
  AuditAction.REPORT_EXPORT_PDF,
  AuditResource.REPORT,
  reportId,
  {
    reportTitle: report.title,
    caseNumber: report.caseNumber,
  }
);
```

## Interface utilisateur

### Page d'administration

Accessible via : **Administration > Logs d'audit**

**Fonctionnalités** :

- 📊 Statistiques en temps réel
- 🔍 Filtres multiples et recherche
- 📋 Tableau détaillé avec pagination
- 👁️ Modal de détails pour chaque log
- 🎨 Badges colorés par type d'action

### Affichage des logs

Chaque log affiche :

- Date et heure précise
- Utilisateur (nom, matricule, unité)
- Action effectuée (avec badge coloré)
- Ressource concernée
- Adresse IP
- Bouton pour voir les détails complets

### Modal de détails

Affiche :

- Informations complètes de l'utilisateur
- User agent du navigateur
- Détails techniques au format JSON
- Toutes les métadonnées disponibles

## Performance

### Indexation

La table `AuditLog` est indexée sur :

- `userId` - Recherche par utilisateur
- `action` - Filtre par action
- `resource` - Filtre par ressource
- `timestamp` - Tri chronologique et plages de dates

### Requêtes optimisées

Le service utilise :

- Pagination pour limiter les résultats
- `Promise.all()` pour paralléliser les requêtes
- `groupBy` pour les statistiques
- Inclusion sélective des relations (user)

## Conformité et juridique

### RGPD

Les logs d'audit contiennent des données personnelles :

- Nom et prénom de l'utilisateur
- Adresse email
- Adresse IP
- Actions effectuées

**Obligations** :

- Informer les utilisateurs du logging
- Limiter la durée de conservation
- Permettre l'accès et l'effacement (droit à l'oubli)

### Conservation

**Recommandations** :

- **90 jours** pour les logs standards
- **1 an** pour les actions critiques (connexions, suppressions)
- **Archivage** pour conformité légale si nécessaire

## Évolutions futures

### Améliorations possibles

1. **Notifications** : Alertes en temps réel pour actions critiques
2. **Tableaux de bord** : Graphiques et visualisations
3. **Export** : Téléchargement des logs (CSV, JSON)
4. **Recherche avancée** : Requêtes complexes avec opérateurs
5. **Rétention configurable** : Paramètres de conservation par type d'action
6. **Webhooks** : Notifications externes pour événements importants

### Intégrations

- **SIEM** (Security Information and Event Management)
- **Elasticsearch** pour recherche avancée
- **Monitoring** (Grafana, Prometheus)
- **Alerting** (PagerDuty, Opsgenie)

## Support

Pour toute question ou problème :

- Consulter la documentation technique
- Vérifier les permissions de l'utilisateur
- Examiner les logs d'erreur du backend

---

**Version** : 1.0  
**Dernière mise à jour** : Octobre 2025  
**Auteur** : GitHub Copilot
