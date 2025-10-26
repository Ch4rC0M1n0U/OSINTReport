# Feature: Suppression de rapport (Admin uniquement)

## Contexte

L'utilisateur a demandé l'ajout d'une fonctionnalité de suppression de rapport avec une restriction d'accès : **seuls les administrateurs** peuvent supprimer des rapports.

**Citation originale** : _"C'est bon ça fonctionne, ajoute également une fonction De Suppression d'un Rapport mais l'option ne doit exister que pour l'admin"_

## Implémentation

### Backend

#### 1. Service Layer (`backend/src/modules/reports/report.service.ts`)

Ajout de la méthode `deleteReport()` :

```typescript
static async deleteReport(reportId: string): Promise<void> {
  const report = await this.ensureReportExists(reportId);

  logger.info("Deleting report", { reportId, title: report.title });

  // Cascade delete will handle modules and attachments
  await prisma.report.delete({
    where: { id: reportId },
  });

  // Remove from search index
  await SearchService.deleteReport(reportId);

  logger.info("Report deleted successfully", { reportId });
}
```

**Fonctionnalités** :

- ✅ Validation de l'existence du rapport
- ✅ Suppression en cascade (modules, attachements)
- ✅ Suppression de l'index Meilisearch
- ✅ Logging des opérations

#### 2. Controller Layer (`backend/src/modules/reports/report.controller.ts`)

Ajout du handler HTTP `delete()` :

```typescript
static async delete(req: Request, res: Response, next: NextFunction) {
  try {
    const { reportId } = req.params;
    await ReportService.deleteReport(reportId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
```

**Retour** : `204 No Content` en cas de succès

#### 3. Router Layer (`backend/src/modules/reports/report.router.ts`)

Ajout de la route DELETE avec protection admin :

```typescript
router.delete(
  "/:reportId",
  requirePermissions(PermissionCode.ADMIN),
  ReportController.delete
);
```

**Protection** : `PermissionCode.ADMIN` - Seuls les administrateurs peuvent accéder

### Frontend

#### 1. API Client (`frontend/src/services/api/reports.ts`)

La méthode `delete()` existe déjà dans le client API :

```typescript
async delete(id: string): Promise<void> {
  await api.delete(`/reports/${id}`);
}
```

✅ Aucune modification nécessaire

#### 2. Interface utilisateur (`frontend/src/pages/reports/ReportDetailPage.vue`)

**Import du store d'authentification** :

```typescript
import { useAuthStore } from "@/stores/auth";
```

**Initialisation du store et computed pour vérifier le rôle** :

```typescript
const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.roleName === "admin");
```

**Fonction de suppression avec confirmation** :

```typescript
async function handleDeleteReport() {
  const confirmed = await modal.showConfirm(
    "⚠️ Cette action est irréversible. Le rapport et tous ses modules seront définitivement supprimés.",
    "Supprimer le rapport",
    "Supprimer",
    "Annuler"
  );
  if (!confirmed) return;

  try {
    await reportsApi.delete(reportId.value);
    await modal.showSuccess(
      "Le rapport a été supprimé avec succès.",
      "Rapport supprimé"
    );
    router.push({ name: "reports.list" });
  } catch (err) {
    await modal.showError(
      "Une erreur est survenue lors de la suppression du rapport.",
      "Erreur de suppression"
    );
    console.error(err);
  }
}
```

**Bouton dans le menu Actions** (visible uniquement pour les admins) :

```vue
<li v-if="isAdmin" class="divider"></li>
<li v-if="isAdmin">
  <a @click="handleDeleteReport" class="text-error">
    🗑️ Supprimer le rapport
  </a>
</li>
```

## Sécurité

### Défense en profondeur (Defense in Depth)

1. **Backend** : Route protégée par `requirePermissions(PermissionCode.ADMIN)`

   - Empêche tout appel API non autorisé
   - Validation côté serveur obligatoire

2. **Frontend** : Bouton conditionnel avec `v-if="isAdmin"`
   - Masque l'option pour les non-admins
   - Améliore l'expérience utilisateur

### Cascade de suppression

La suppression en cascade est configurée dans Prisma (`schema.prisma`) :

- Les **modules** du rapport sont automatiquement supprimés
- Les **attachements** sont automatiquement supprimés
- L'**index de recherche** Meilisearch est mis à jour

## UX (Expérience utilisateur)

### Confirmation obligatoire

- Modal de confirmation avec message d'avertissement
- Texte explicite : "Cette action est irréversible"
- Boutons clairs : "Supprimer" (danger) vs "Annuler"

### Messages de feedback

- ✅ **Succès** : "Le rapport a été supprimé avec succès"
- ❌ **Erreur** : "Une erreur est survenue lors de la suppression"
- 🔄 **Redirection** : Retour automatique à la liste des rapports

### Visibilité

- Bouton visible **uniquement pour les administrateurs**
- Icône 🗑️ et texte en rouge (`text-error`) pour indiquer une action destructive
- Séparé des autres actions par un divider

## Tests recommandés

### Tests manuels

1. **En tant qu'administrateur** :

   - ✅ Le bouton "Supprimer le rapport" doit être visible
   - ✅ Cliquer affiche la modal de confirmation
   - ✅ Annuler ferme la modal sans rien supprimer
   - ✅ Confirmer supprime le rapport et redirige vers la liste
   - ✅ Les modules et attachements sont supprimés
   - ✅ Le rapport disparaît de la recherche Meilisearch

2. **En tant que non-admin** (éditeur/lecteur) :
   - ✅ Le bouton "Supprimer le rapport" ne doit PAS être visible
   - ✅ Tentative d'appel API direct retourne `403 Forbidden`

### Tests backend (optionnels)

```typescript
describe("DELETE /reports/:reportId", () => {
  it("should delete report as admin", async () => {
    const response = await request(app)
      .delete(`/reports/${reportId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(204);
  });

  it("should return 403 for non-admin users", async () => {
    const response = await request(app)
      .delete(`/reports/${reportId}`)
      .set("Authorization", `Bearer ${editorToken}`);

    expect(response.status).toBe(403);
  });
});
```

## Fichiers modifiés

### Backend

1. **`backend/src/modules/reports/report.service.ts`**

   - Ligne ~357-368 : Ajout de `deleteReport()`

2. **`backend/src/modules/reports/report.controller.ts`**

   - Ligne ~73-80 : Ajout de `delete()`

3. **`backend/src/modules/reports/report.router.ts`**
   - Ligne ~45-49 : Ajout route `DELETE /:reportId`

### Frontend

4. **`frontend/src/pages/reports/ReportDetailPage.vue`**
   - Ligne 13 : Import `useAuthStore`
   - Ligne ~41-42 : Initialisation store et computed `isAdmin`
   - Ligne ~379-398 : Fonction `handleDeleteReport()`
   - Ligne ~607-613 : Bouton de suppression dans le dropdown

## Améliorations futures (optionnelles)

1. **Soft delete** : Au lieu de supprimer définitivement, marquer comme `deleted`

   - Permet de restaurer des rapports supprimés par erreur
   - Ajouter un champ `deletedAt` dans le schéma Prisma

2. **Audit log** : Enregistrer qui a supprimé quoi et quand

   - Traçabilité des suppressions
   - Table `AuditLog` dans la base de données

3. **Bulk delete** : Permettre la suppression multiple

   - Sélection de plusieurs rapports dans la liste
   - Endpoint `POST /reports/bulk-delete`

4. **Corbeille** : Zone de stockage temporaire avant suppression définitive
   - Rétention de 30 jours
   - Cron job pour purger automatiquement

## Conclusion

✅ Fonctionnalité de suppression complète et sécurisée  
✅ Restriction admin respectée (backend + frontend)  
✅ Confirmation obligatoire pour éviter les erreurs  
✅ Suppression en cascade (modules, attachements, index)  
✅ Messages de feedback appropriés  
✅ Redirection automatique après suppression

**Statut** : ✅ Prêt pour les tests
