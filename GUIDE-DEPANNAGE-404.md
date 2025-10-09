# 🔧 GUIDE DE DÉPANNAGE - Erreur 404 API Settings

**Date** : 9 octobre 2025  
**Problème** : `GET /api/api/settings/ai/status 404 (Not Found)`

---

## 🎯 DIAGNOSTIC

### Le problème
L'URL contient un **doublon** `/api/api/` au lieu de `/api/`

### La cause
Le **cache du navigateur** contient l'ancienne version du fichier JavaScript

### La solution
**VIDER LE CACHE DU NAVIGATEUR**

---

## ✅ SOLUTIONS (par ordre de rapidité)

### Solution 1 : Hard Refresh ⚡ (RECOMMANDÉ)

#### Windows / Linux
```
Ctrl + Shift + R
```

#### macOS
```
Cmd + Shift + R
```

#### Alternative avec DevTools
```
1. F12 pour ouvrir les DevTools
2. Clic droit sur le bouton "Actualiser"
3. Sélectionner "Vider le cache et actualiser"
```

---

### Solution 2 : Vider le cache manuellement 🗑️

#### Chrome / Edge
```
1. F12 → Onglet "Application"
2. Section "Storage" → "Clear site data"
3. Cocher "Cache storage" et "Cached images and files"
4. Cliquer "Clear site data"
5. F5 pour actualiser
```

#### Firefox
```
1. F12 → Onglet "Stockage"
2. Clic droit sur le domaine
3. "Tout supprimer"
4. F5 pour actualiser
```

---

### Solution 3 : Mode navigation privée 🕵️

```
1. Ouvrir une fenêtre de navigation privée :
   - Chrome/Edge: Ctrl+Shift+N
   - Firefox: Ctrl+Shift+P
   
2. Accéder à l'application :
   http://localhost:5174/admin/ai
   
3. Si ça fonctionne → Le problème est bien le cache
```

---

### Solution 4 : Désactiver le cache (développement) 🛠️

```
1. F12 → Onglet "Network" (Réseau)
2. Cocher "Disable cache"
3. Garder les DevTools ouverts
4. F5 pour actualiser
```

---

## 🔍 VÉRIFICATION

### Après avoir vidé le cache

1. **Ouvrir les DevTools** (F12)
2. **Onglet Network** (Réseau)
3. **Actualiser la page** (F5)
4. **Chercher la requête** `/settings/ai/status`

#### ✅ Si c'est OK
```
Request URL: https://...github.dev/api/settings/ai/status
Status: 200 OK
```

#### ❌ Si le problème persiste
```
Request URL: https://...github.dev/api/api/settings/ai/status
Status: 404 Not Found

→ Voir Solution 5 ci-dessous
```

---

### Solution 5 : Redémarrer le serveur de développement 🔄

Si le problème persiste après avoir vidé le cache :

```bash
# 1. Arrêter le frontend (dans le terminal qui l'exécute)
Ctrl+C

# 2. Redémarrer
cd /workspaces/OSINTReport/frontend
npm run dev

# 3. Attendre le message :
#    ➜  Local:   http://localhost:5174/

# 4. Ouvrir en navigation privée
#    Pour être sûr d'avoir la dernière version
```

---

## 📝 VÉRIFICATION DU CODE SOURCE

Pour vérifier que les corrections sont bien présentes :

```bash
# Vérifier les URLs dans le fichier
grep "api.get\|api.put\|api.post" \
  /workspaces/OSINTReport/frontend/src/pages/admin/AISettingsPage.vue \
  | grep settings
```

### ✅ Résultat attendu
```
api.get('/settings/ai/status')
api.put('/settings/ai', ...)
api.post('/settings/ai/test', ...)
```

### ❌ Mauvais résultat
```
api.get('/api/settings/ai/status')  ← Doublon /api/
```

---

## 🎯 PROCÉDURE COMPLÈTE

### Étape 1 : Vider le cache
```
Ctrl + Shift + R (ou Cmd + Shift + R sur Mac)
```

### Étape 2 : Vérifier dans DevTools
```
F12 → Network → Actualiser → Chercher "settings/ai/status"
```

### Étape 3 : Tester la configuration
```
1. Aller sur /admin/ai
2. Activer l'IA
3. Choisir Claude
4. Sélectionner claude-sonnet-4-5-20250514
5. Entrer votre clé API
6. Cliquer "Tester la connexion"
```

### Étape 4 : Si le test fonctionne
```
✅ Enregistrer
✅ Aller sur un rapport
✅ Modifier le résumé
✅ Cliquer "Générer un résumé avec l'IA"
```

---

## 🐛 SI LE PROBLÈME PERSISTE

### Vérifier que le backend est démarré
```bash
curl http://localhost:4000/api/health

# Résultat attendu :
{"status":"ok"}
```

### Vérifier les routes backend
```bash
curl http://localhost:4000/api/settings/ai/status

# Devrait retourner du JSON (même si 401 Unauthorized sans auth)
```

### Vérifier la configuration Vite
```bash
# Le baseURL doit être /api (pas /api/)
cat /workspaces/OSINTReport/frontend/src/services/http.ts | grep baseURL
```

### Résultat attendu
```typescript
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : `${window.location.origin.replace(/\/$/, "")}/api`;
```

---

## 📞 SUPPORT

### Logs utiles

#### Backend
```bash
# Voir les requêtes reçues
tail -f /workspaces/OSINTReport/backend/backend.log | grep settings
```

#### Frontend (Console navigateur)
```javascript
// Vérifier l'URL de base de l'API
console.log(window.location.origin)

// Devrait afficher :
// https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev
```

---

## ✅ CHECKLIST FINALE

- [ ] Cache navigateur vidé (Ctrl+Shift+R)
- [ ] DevTools Network montre `/api/settings/ai/status` (sans doublon)
- [ ] Requête retourne 200 OK (si connecté) ou 401 (si non connecté)
- [ ] Page /admin/ai se charge sans erreur 404
- [ ] Configuration IA fonctionnelle
- [ ] Test de connexion fonctionne
- [ ] Génération de texte opérationnelle

---

**Date de création** : 9 octobre 2025  
**Problème résolu** : Erreur 404 doublon /api/api/  
**Solution principale** : **Vider le cache du navigateur** (Ctrl+Shift+R)
