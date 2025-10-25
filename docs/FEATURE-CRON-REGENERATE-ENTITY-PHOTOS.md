# 🔄 Régénération Automatique des URLs d'Images dans les Entités

> **Date** : 2025-10-25  
> **Feature** : Extension du CRON de régénération des URLs pour inclure Finding.attachments  
> **Statut** : ✅ **IMPLÉMENTÉ**

---

## 🎯 Objectif

Étendre le système de régénération automatique des URLs signées pour **inclure les photos des entités** stockées dans `Finding.attachments[]`.

**Problème** : Les URLs signées dans `Finding.attachments` expirent après 48h/6 mois, rendant les photos invisibles dans les rapports archivés.

**Solution** : Ajouter une fonction `regenerateFindingAttachmentUrls()` au CRON existant qui parcourt tous les modules et régénère les URLs.

---

## 🔧 Implémentation

### Fichier Modifié

**Fichier** : `backend/src/modules/cron/screenshot-url.cron.ts`

#### 1. Import de Prisma

```typescript
import { prisma } from "@/shared/prisma";
```

#### 2. Nouvelle Fonction de Régénération

```typescript
/**
 * Régénère les URLs signées dans les Finding.attachments (entités avec photos)
 * Parcourt tous les modules de type 'entities' et met à jour les URLs expirées
 */
async function regenerateFindingAttachmentUrls(): Promise<void> {
  console.log(
    "🔄 [CRON] Démarrage régénération URLs dans Finding.attachments..."
  );

  const startTime = Date.now();
  let modulesUpdated = 0;
  let urlsRegenerated = 0;
  let errorsCount = 0;

  try {
    // Récupérer tous les modules qui peuvent contenir des Finding avec attachments
    const modules = await prisma.reportModule.findMany({
      where: {
        type: {
          in: [
            "entities",
            "entity_overview",
            "identifier_lookup",
            "platform_analysis",
          ],
        },
      },
      include: {
        report: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    console.log(`📊 [CRON] ${modules.length} module(s) à analyser`);

    for (const module of modules) {
      const payload = module.payload as any;

      // Vérifier si le module a des findings avec attachments
      if (!payload || !payload.findings || !Array.isArray(payload.findings)) {
        continue;
      }

      let moduleModified = false;

      for (const finding of payload.findings) {
        if (!finding.attachments || finding.attachments.length === 0) {
          continue;
        }

        const updatedAttachments: string[] = [];

        for (const attachmentUrl of finding.attachments) {
          try {
            // Extraire le filename de l'URL signée
            const urlObj = new URL(attachmentUrl);
            const pathParts = urlObj.pathname.split("/");
            const filename = pathParts[pathParts.length - 1];

            // Vérifier si le fichier existe
            const filePath = path.join(uploadsDir, filename);
            if (await fileExists(filePath)) {
              // Générer nouvelle URL signée (6 mois)
              const newUrl = await generateSignedUrl(
                filename,
                NEW_EXPIRATION_DAYS * 24 * 60 * 60
              );
              updatedAttachments.push(newUrl);
              urlsRegenerated++;

              console.log(`  ✅ URL régénérée: ${filename} (${finding.label})`);
            } else {
              console.warn(`  ⚠️ Fichier absent: ${filename}`);
              updatedAttachments.push(attachmentUrl); // Garder l'ancienne URL
            }
          } catch (urlError: any) {
            console.error(`  ❌ Erreur parsing URL:`, urlError.message);
            updatedAttachments.push(attachmentUrl); // Garder l'ancienne URL
            errorsCount++;
          }
        }

        // Mettre à jour les attachments
        finding.attachments = updatedAttachments;
        moduleModified = true;
      }

      // Sauvegarder le module si modifié
      if (moduleModified) {
        await prisma.reportModule.update({
          where: { id: module.id },
          data: { payload: payload },
        });

        modulesUpdated++;
        console.log(`✅ [CRON] Module "${module.title}" mis à jour`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `✅ [CRON] Régénération Finding.attachments terminée en ${duration}s`
    );
    console.log(
      `📊 [CRON] Modules: ${modulesUpdated}, URLs: ${urlsRegenerated}, Erreurs: ${errorsCount}`
    );
  } catch (error: any) {
    console.error("❌ [CRON] Erreur fatale:", error.message);
  }
}
```

#### 3. Intégration dans la Fonction Manuelle

```typescript
export async function manuallyRegenerateUrls(): Promise<void> {
  console.log("🔧 [MANUAL] Régénération manuelle démarrée");
  await regenerateExpiringUrls(); // Screenshots
  await regenerateFindingAttachmentUrls(); // ✅ Photos d'entités
}
```

---

## 🚀 Utilisation

### Déclenchement Automatique

Le CRON s'exécute **automatiquement tous les jours à 3h00** (Europe/Brussels) et régénère :

1. ✅ Les URLs de screenshots qui expirent dans moins de 30 jours
2. ✅ **Les URLs dans Finding.attachments** (photos d'entités)

### Déclenchement Manuel (Admin)

#### Via l'API

**Endpoint** : `POST /api/cron/screenshot-urls/regenerate`

**Permissions** : Administrateur système uniquement

**Requête** :

```bash
curl -X POST https://your-domain.com/api/cron/screenshot-urls/regenerate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Réponse** :

```json
{
  "message": "Régénération des URLs démarrée",
  "info": "Le processus s'exécute en arrière-plan. Consultez les logs serveur pour le suivi."
}
```

#### Via le Menu Admin (Frontend)

1. Se connecter en tant qu'**administrateur**
2. Aller dans **Admin** > **Tâches CRON**
3. Cliquer sur **"Régénérer les URLs de screenshots"**
4. Le système régénère :
   - Les URLs de screenshots expirés
   - **Les URLs des photos dans les entités** ✅

---

## 📊 Logs Attendus

### Lors de l'Exécution Manuelle

```
🔧 [MANUAL] Régénération manuelle démarrée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 [CRON] Démarrage régénération URLs de screenshots...
📅 Seuil: 30 jours
⏱️  Nouvelle durée: 180 jours (6 mois)
📊 [CRON] 5 screenshot(s) à régénérer
✅ [CRON] abc123.png - Metadata mis à jour (case: case-001)
✅ [CRON] def456.jpg - Metadata mis à jour (case: case-002)
✅ [CRON] Régénération terminée en 1.23s
📊 [CRON] Succès: 5, Erreurs: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 [CRON] Démarrage régénération URLs dans Finding.attachments...
📊 [CRON] 12 module(s) à analyser
  ✅ URL régénérée: robert-redford.png (Robert Redford)
  ✅ URL régénérée: acme-logo.jpg (ACME Corporation)
  ✅ URL régénérée: john-doe-profile.jpg (John Doe)
✅ [CRON] Module "Entités Identifiées" mis à jour (rapport: Enquête XYZ)
✅ [CRON] Régénération Finding.attachments terminée en 0.87s
📊 [CRON] Modules: 3, URLs: 3, Erreurs: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🧪 Tests

### Test 1 : Régénération Manuelle

1. Ouvrir un rapport avec des entités ayant des photos
2. Vérifier que les photos s'affichent
3. Aller dans **Admin** > **Tâches CRON**
4. Cliquer sur **"Régénérer les URLs de screenshots"**
5. Vérifier les logs serveur :
   ```bash
   docker logs osintreport-backend -f | grep CRON
   ```
6. Rafraîchir le rapport
7. ✅ Les photos doivent toujours s'afficher (URLs régénérées)

### Test 2 : Module avec Plusieurs Entités

1. Créer un module "Entités Identifiées" avec 3 entités :
   - Robert Redford (1 photo)
   - ACME Corp (2 logos)
   - John Doe (0 photos)
2. Déclencher la régénération manuelle
3. Vérifier les logs :
   ```
   ✅ URL régénérée: robert-redford.png (Robert Redford)
   ✅ URL régénérée: acme-logo-1.jpg (ACME Corporation)
   ✅ URL régénérée: acme-logo-2.png (ACME Corporation)
   ✅ Module "Entités Identifiées" mis à jour
   📊 URLs: 3
   ```

### Test 3 : Fichier Manquant

1. Uploader une photo pour une entité
2. Supprimer manuellement le fichier du disque (simulation)
3. Déclencher la régénération
4. Vérifier les logs :
   ```
   ⚠️ Fichier absent: deleted-photo.png (conservé URL originale)
   ```
5. ✅ Le système ne crashe pas, garde l'ancienne URL

---

## 📋 Types de Modules Traités

La fonction parcourt les modules suivants :

1. **`entities`** (Entités Identifiées)
   - Entités avec photos (Robert Redford, logos d'entreprises, etc.)
2. **`entity_overview`** (Vue d'ensemble d'une entité)
   - Profils détaillés avec photos
3. **`identifier_lookup`** (Recherche d'identifiant)
   - Résultats de recherche avec captures d'écran
4. **`platform_analysis`** (Analyse de plateforme)
   - Profils sociaux avec avatars/photos

---

## 🔒 Sécurité

### Permissions

**Endpoint** : `/api/cron/screenshot-urls/regenerate`

**Permission requise** : `SYSTEM_SETTINGS` (Administrateur système)

**Code** :

```typescript
router.post(
  '/screenshot-urls/regenerate',
  requireAuth,
  requirePermissions(PermissionCode.SYSTEM_SETTINGS),
  async (req, res) => { ... }
);
```

### URLs Signées

- **Nouvelle durée** : 180 jours (6 mois)
- **Algorithme** : HMAC-SHA256
- **Paramètres** : `?signature=...&expires=...`
- **Validation** : Backend vérifie signature + expiration

---

## ⚙️ Configuration

### Variables d'Environnement

Aucune nouvelle variable nécessaire. Utilise la configuration existante :

```env
# Déjà présent dans .env
JWT_SECRET=your-secret-key  # Utilisé pour signer les URLs
```

### Paramètres CRON

Dans `screenshot-url.cron.ts` :

```typescript
const REGENERATION_THRESHOLD_DAYS = 30; // Régénérer si expire < 30 jours
const NEW_EXPIRATION_DAYS = 180; // Nouvelle durée = 6 mois
```

**Schedule** : `'0 3 * * *'` (Tous les jours à 3h00)

---

## 🐛 Dépannage

### Problème : "Aucun module à analyser"

**Cause** : Aucun module de type `entities`, `entity_overview`, etc.

**Solution** : Vérifier que vous avez bien créé des modules avec des Finding

### Problème : "Erreur parsing URL"

**Cause** : Format d'URL invalide dans `Finding.attachments`

**Logs** :

```
❌ Erreur parsing URL: invalid-url
```

**Solution** : Vérifier que les URLs sont bien formées (format `https://...`)

### Problème : "Fichier absent"

**Cause** : Fichier supprimé du disque mais référencé dans la DB

**Logs** :

```
⚠️ Fichier absent: deleted-photo.png (conservé URL originale)
```

**Solution** : Le système conserve l'ancienne URL. Ré-uploader le fichier ou supprimer la référence.

---

## 📝 Frontend : Logs de Debug

### Ajouts dans EntityInsertModal.vue

Pour déboguer pourquoi les photos ne s'affichent pas, des logs ont été ajoutés :

```typescript
function selectEntity(entity: Entity) {
  console.log("⚠️ Pas de notes sur cette entité");
  console.log("📝 Metadata parsed:", metadata);
  console.log("📎 Attachments trouvés:", attachments);
  console.log(
    `🎯 selectEntity: ${entity.label}, attachments=${attachments.length}`
  );
}

function selectFinding(finding: Finding) {
  console.log("🔍 selectFinding:", finding.label);
  console.log("📎 Attachments dans finding:", finding.attachments);
}
```

### Comment Utiliser

1. Ouvrir la console du navigateur (F12)
2. Insérer une entité depuis le modal
3. Regarder les logs pour voir :
   - Si l'entité a des `notes` (JSON avec metadata)
   - Si les `attachments` sont trouvés
   - Combien d'attachments sont passés à `generateEntityTable()`

**Exemple de logs attendus** :

```
📝 Metadata parsed: { entityType: "person", attachments: ["https://..."] }
📎 Attachments trouvés: ["https://api.example.com/media/screenshot/robert.png?signature=..."]
🎯 selectEntity: Robert Redford, needsTable=true, attachments=1
```

---

## 🎯 Prochaines Étapes

1. **Tester en production** :

   - Déclencher la régénération manuelle via l'admin
   - Vérifier les logs serveur
   - Confirmer que les photos s'affichent

2. **Debug frontend** :

   - Ouvrir la console du navigateur
   - Insérer Robert Redford dans un bloc de texte
   - Vérifier les logs pour voir si `attachments` est vide ou contient des URLs

3. **Vérifier la DB** :
   - Ouvrir Prisma Studio ou psql
   - Vérifier que `ReportModule.payload.findings[].attachments` contient bien des URLs complètes

---

## 👤 Auteur

**GitHub Copilot** - Implémentation assistée pour OSINTReport

---

## 📝 Changelog

| Date       | Version | Description                                        |
| ---------- | ------- | -------------------------------------------------- |
| 2025-10-25 | 1.0.0   | Ajout de regenerateFindingAttachmentUrls() au CRON |
| 2025-10-25 | 1.1.0   | Ajout de logs de debug dans EntityInsertModal.vue  |
