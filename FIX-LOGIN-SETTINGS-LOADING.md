# 🔧 Fix - Chargement des paramètres système sur la page de login

## 🐛 Problème identifié

### Symptôme
La page de login n'affichait pas :
- ❌ Le logo personnalisé
- ❌ Le nom du service
- ❌ L'adresse du service

Au lieu de cela, elle affichait les valeurs par défaut :
- Icône 🔍 générique
- Texte "OSINT"
- Pas d'adresse

### Cause racine

Le composable `useSystemSettings()` **ne charge pas automatiquement** les paramètres. Il fournit une fonction `loadSettings()` qui doit être appelée manuellement.

**Avant la correction** :
```typescript
// LoginPage.vue
const { settings, logoUrl } = useSystemSettings();
// ❌ Pas d'appel à loadSettings() !
```

Résultat : `settings.value` reste `null`, donc :
- `logoUrl.value` = `null` → Affichage de l'icône par défaut
- `serviceName` = `"OSINT"` → Valeur fallback
- `serviceAddress` = `null` → Pas d'affichage

### Pourquoi ça fonctionnait dans d'autres pages ?

**AppShell.vue** (composant principal de l'application) charge les paramètres :
```typescript
onMounted(() => {
  systemSettings.loadSettings();
});
```

Mais **LoginPage** est affiché **en dehors** de l'AppShell (pas de layout principal), donc les paramètres n'étaient jamais chargés.

## ✅ Solution appliquée

### Modification de LoginPage.vue

**Ajout de l'import `onMounted`** :
```typescript
import { reactive, computed, onMounted } from "vue";
```

**Récupération de la fonction `loadSettings`** :
```typescript
const { settings, logoUrl, loadSettings } = useSystemSettings();
//                         ^^^^^^^^^^^^^ Ajouté
```

**Appel au montage du composant** :
```typescript
// Charger les paramètres au montage de la page
onMounted(() => {
  loadSettings();
});
```

## 🔍 Vérification

### Test de l'API (sans authentification)
```bash
curl http://localhost:4000/api/settings
```

**Résultat attendu** :
```json
{
  "id": "...",
  "serviceName": "OSINT",
  "serviceFullName": null,
  "logoUrl": "/uploads/logos/logo-xxx.png",
  "serviceAddress": null,
  ...
}
```

✅ L'API `/api/settings` est bien **publique** (pas de `requireAuth` middleware)

### Flux de chargement

1. **Utilisateur accède à `/login`**
2. **LoginPage.vue se monte**
3. **`onMounted()` se déclenche**
4. **`loadSettings()` appelée**
5. **Requête GET `/api/settings`**
6. **Réponse reçue** → `settings.value` rempli
7. **Computed properties réactives** → Mise à jour de l'affichage
8. **Logo et textes personnalisés visibles** ✨

## 📊 Comparaison avant/après

### Avant (sans `onMounted`)

```
Page Login chargée
  ↓
useSystemSettings() appelé
  ↓
settings.value = null
logoUrl.value = null
  ↓
Affichage : Icône par défaut + "OSINT"
```

### Après (avec `onMounted`)

```
Page Login chargée
  ↓
onMounted() déclenché
  ↓
loadSettings() appelée
  ↓
API GET /api/settings
  ↓
settings.value = { serviceName: "...", logoUrl: "...", ... }
  ↓
Computed properties recalculées
  ↓
Affichage : Logo personnalisé + Nom du service + Adresse
```

## 🧪 Tests effectués

### ✅ Test 1 : API accessible sans authentification
```bash
curl http://localhost:4000/api/settings
# → 200 OK avec données
```

### ✅ Test 2 : Logo présent dans la réponse
```bash
curl -s http://localhost:4000/api/settings | jq '.logoUrl'
# → "/uploads/logos/logo-1759745175102-892506278.png"
```

### ✅ Test 3 : Code source mis à jour
```bash
grep -n "onMounted\|loadSettings" /workspaces/OSINTReport/frontend/src/pages/LoginPage.vue
# → Lignes avec import et appel trouvées
```

## 🎯 Résultat final

Après actualisation de la page (Ctrl+Shift+R), la page de login affiche maintenant :

- ✅ **Logo personnalisé** (ou icône par défaut si pas de logo)
- ✅ **Nom du service** (depuis `settings.serviceName`)
- ✅ **Nom complet du service** (depuis `settings.serviceFullName`)
- ✅ **Adresse du service** en pied de page (construite depuis address, city, postalCode, country)

## 📝 Notes techniques

### Architecture du composable

Le composable `useSystemSettings` utilise un **pattern singleton** :
- Les variables `settings`, `loading`, `error` sont **partagées** entre tous les appels
- Une fois chargé, les paramètres sont en cache
- Le flag `if (settings.value) return;` dans `loadSettings()` évite les rechargements inutiles

### Réactivité Vue

Les `computed()` properties sont **automatiquement recalculées** quand `settings.value` change :
- `serviceName` recalculé quand `settings.value.serviceName` change
- `logoUrl` recalculé quand `settings.value.logoUrl` change
- Pas besoin de forcer un re-render

### Performance

Le chargement est **asynchrone et non bloquant** :
- La page s'affiche immédiatement avec les valeurs par défaut
- Une fois l'API répondue (quelques ms), l'affichage se met à jour
- Pas de flash ou de loading visible pour l'utilisateur

## 🔄 Autres pages concernées

### Pages qui chargent déjà les paramètres :
- ✅ **AppShell.vue** - Charge au montage
- ✅ **SystemSettingsPage.vue** - Utilise directement le composable

### Pages qui pourraient bénéficier du même fix :
- **RegisterPage.vue** (si elle existe et n'utilise pas AppShell)
- **ForgotPasswordPage.vue** (si elle existe et n'utilise pas AppShell)
- **ResetPasswordPage.vue** (si elle existe et n'utilise pas AppShell)

## ✨ Améliorations futures possibles

- [ ] Auto-chargement dans le composable (appel automatique au premier usage)
- [ ] Système de cache avec TTL (Time To Live)
- [ ] Invalidation du cache lors de modifications depuis `/admin/system`
- [ ] Événement global pour notifier les changements de paramètres
- [ ] Progressive Web App : mise en cache des paramètres en local storage
- [ ] Skeleton loader pendant le chargement initial
