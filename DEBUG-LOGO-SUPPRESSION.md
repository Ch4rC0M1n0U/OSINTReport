# Debug - Suppression du logo

## Modifications apportées

### 1. Ajout de logs de débogage dans `handleRemoveLogo()`
```typescript
async function handleRemoveLogo() {
  console.log("handleRemoveLogo appelé");
  
  const confirmed = await modal.showConfirm(...);
  console.log("Confirmation:", confirmed);
  
  if (!confirmed) return;

  uploading.value = true;

  try {
    console.log("Appel de settingsApi.removeLogo()");
    const updated = await settingsApi.removeLogo();
    console.log("Logo supprimé, updated:", updated);
    settings.value = updated;
    modal.showSuccess("Logo supprimé avec succès !");
  } catch (err: any) {
    console.error("Erreur suppression logo:", err);
    // ...
  } finally {
    uploading.value = false;
  }
}
```

### 2. Ajout d'un spinner sur le bouton de suppression
Le bouton affiche maintenant un spinner pendant le chargement.

### 3. Ajout d'un message "Aucun logo défini"
Pour vérifier que la condition `v-if="logoUrl"` fonctionne correctement.

## Procédure de test

1. **Ouvrir la console du navigateur** (F12 → onglet Console)

2. **Accéder à la page** `/admin/system`

3. **Vérifier l'état initial**
   - Est-ce qu'un logo s'affiche ?
   - Est-ce que le bouton "🗑️ Supprimer" est visible ?
   - Ou est-ce que le message "Aucun logo défini" s'affiche ?

4. **Si un logo est affiché, cliquer sur "🗑️ Supprimer"**

5. **Observer les logs dans la console** :
   - `handleRemoveLogo appelé` ➡️ Le clic fonctionne
   - Une modale de confirmation devrait apparaître
   
6. **Cliquer sur "Confirmer"** dans la modale

7. **Observer les logs suivants** :
   - `Confirmation: true` ➡️ La modale a retourné true
   - `Appel de settingsApi.removeLogo()` ➡️ L'API est appelée
   - `Logo supprimé, updated: {...}` ➡️ L'API a répondu avec succès
   - Vérifier le contenu de l'objet `updated` : `logoUrl` devrait être `null`

8. **Observer le résultat** :
   - Le logo devrait disparaître
   - Le message "Aucun logo défini" devrait apparaître
   - Une modale "Logo supprimé avec succès !" devrait s'afficher

## Problèmes possibles et solutions

### Problème 1 : "handleRemoveLogo appelé" n'apparaît pas
**Cause** : Le click handler n'est pas lié ou le bouton n'est pas cliquable
**Solution** : Vérifier que le bouton n'est pas dans un formulaire qui empêche l'événement

### Problème 2 : La modale de confirmation n'apparaît pas
**Cause** : Problème avec le composable `useModal`
**Solution** : Vérifier que `ModalRoot` est bien monté dans l'application

### Problème 3 : "Confirmation: false" apparaît alors qu'on a cliqué sur "Confirmer"
**Cause** : Bug dans la modale de confirmation
**Solution** : Inspecter le code de `useModal.ts` → fonction `showConfirm()`

### Problème 4 : Erreur lors de `settingsApi.removeLogo()`
**Cause** : Erreur réseau ou problème d'authentification
**Solution** : Vérifier la réponse dans l'onglet Network (F12)
- Status code 401 ➡️ Token JWT expiré, se reconnecter
- Status code 403 ➡️ Permission manquante
- Status code 500 ➡️ Erreur serveur, vérifier les logs backend

### Problème 5 : Le logo ne disparaît pas après la suppression
**Cause** : `settings.value` n'est pas mis à jour ou la computed property ne se rafraîchit pas
**Solution** : 
1. Vérifier dans la console que `updated.logoUrl === null`
2. Vérifier que `settings.value = updated;` est exécuté
3. Forcer un refresh avec `window.location.reload()` pour voir si le logo a vraiment été supprimé côté serveur

## Vérification backend

Pour vérifier que la suppression fonctionne côté serveur :

```bash
# Vérifier les logs du backend
# Devrait afficher : "Logo supprimé"

# Vérifier la base de données
docker exec -it osintreport-postgres psql -U osintuser -d osintreport -c "SELECT id, \"logoUrl\" FROM \"SystemSettings\";"
```

## État attendu après suppression

**Base de données :**
```sql
id | logoUrl
---+---------
...| null
```

**Réponse API (`GET /api/settings`) :**
```json
{
  "id": "...",
  "serviceName": "OSINT",
  "logoUrl": null,
  ...
}
```

**Frontend :**
- `settings.value.logoUrl` = `null`
- `logoUrl` (computed) = `null`
- Affichage : Message "Aucun logo défini"
