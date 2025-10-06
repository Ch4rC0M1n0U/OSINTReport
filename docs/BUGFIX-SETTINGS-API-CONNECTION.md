# 🐛 BUGFIX - API Settings Connection Refused

## Symptôme

Lors de l'accès à `/admin/system`, la page s'affiche mais le contenu ne charge pas. Erreur dans la console :

```
GET http://localhost:4000/api/settings net::ERR_CONNECTION_REFUSED
AxiosError: Network Error
```

## Cause racine

Le service `settingsApi` utilisait **`axios` directement** au lieu d'utiliser l'instance **`api`** configurée dans `http.ts`.

### Problème détaillé

**Fichier** : `frontend/src/services/api/settings.ts`

```typescript
// ❌ AVANT - Utilisation directe d'axios
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

class SettingsApi {
  async getSettings(): Promise<SystemSettings> {
    const response = await axios.get<SystemSettings>(`${API_URL}/settings`);
    return response.data;
  }
}
```

**Problèmes** :
1. ❌ `axios` utilisé directement sans configuration
2. ❌ `API_URL` hardcodé avec fallback `localhost:4000`
3. ❌ Pas de `withCredentials: true` → Cookies non envoyés
4. ❌ Pas de gestion 401 automatique
5. ❌ Ne fonctionne pas en environnement Codespaces/proxy

### Configuration correcte

**Fichier** : `frontend/src/services/http.ts`

```typescript
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : `${window.location.origin.replace(/\/$/, "")}/api`;  // ✅ Utilise l'origine actuelle

export const api = axios.create({
  baseURL,
  withCredentials: true,  // ✅ Envoie les cookies
  headers: {
    "Content-Type": "application/json",
  },
});
```

**Avantages** :
- ✅ Utilise automatiquement l'origine courante (fonctionne en dev, prod, Codespaces)
- ✅ Credentials inclus automatiquement
- ✅ Intercepteur 401 pour redirection login
- ✅ Configuration centralisée

## Solution appliquée

### 1. Import de l'instance `api`

```typescript
// ✅ APRÈS
import { api } from "@/services/http";
```

### 2. Remplacement de tous les appels axios

```typescript
class SettingsApi {
  // GET
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get<SystemSettings>("/settings");
    return response.data;
  }

  // PUT
  async updateSettings(data: UpdateSettingsData): Promise<SystemSettings> {
    const response = await api.put<SystemSettings>("/settings", data);
    return response.data;
  }

  // POST (multipart/form-data)
  async uploadLogo(file: File): Promise<SystemSettings> {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await api.post<SystemSettings>(
      "/settings/logo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  }

  // DELETE
  async removeLogo(): Promise<SystemSettings> {
    const response = await api.delete<SystemSettings>("/settings/logo");
    return response.data;
  }
}
```

### 3. Correction de `getLogoUrl()`

```typescript
getLogoUrl(logoPath: string | null): string | null {
  if (!logoPath) return null;
  
  if (logoPath.startsWith("http")) return logoPath;
  
  // ✅ Utilise la même logique que http.ts
  const baseUrl = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : window.location.origin.replace(/\/$/, "");
  
  return `${baseUrl}${logoPath}`;
}
```

## Changements de code

### Avant
```typescript
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Tous les appels : axios.get(`${API_URL}/...`)
```

### Après
```typescript
import { api } from "@/services/http";

// Tous les appels : api.get("/...")
```

## URLs générées

### Environnement local
- `window.location.origin` = `http://localhost:5173`
- `baseURL` = `http://localhost:5173/api`
- Proxy Vite → `http://localhost:4000/api`

### Environnement Codespaces
- `window.location.origin` = `https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev`
- `baseURL` = `https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev/api`
- Proxy Codespaces → Backend sur port 4000

### Production (futur)
- `window.location.origin` = `https://osintreport.police.be`
- `baseURL` = `https://osintreport.police.be/api`
- Backend sur même domaine

## Tests de validation

### 1. Test GET /api/settings

**Console Browser** :
```javascript
// Avant : ERR_CONNECTION_REFUSED
// Après : 200 OK avec données
```

**Network Tab** :
```
GET https://fuzzy-halibut-97wgwqvrqgg379r7-5173.app.github.dev/api/settings
Status: 200 OK
```

### 2. Test authentification

**Cookies envoyés** :
```
Cookie: or_at=...; or_rt=...
```

✅ L'authentification fonctionne car `withCredentials: true`

### 3. Test upload logo

```typescript
await settingsApi.uploadLogo(file);
// ✅ Fonctionne avec multipart/form-data
```

## Prévention future

### Règle pour tous les nouveaux services API

**Template à suivre** :

```typescript
// ✅ BON
import { api } from "@/services/http";

class MyApi {
  async getData() {
    const response = await api.get("/endpoint");
    return response.data;
  }
}
```

**À éviter** :

```typescript
// ❌ MAUVAIS
import axios from "axios";

const API_URL = "http://localhost:4000/api";

class MyApi {
  async getData() {
    const response = await axios.get(`${API_URL}/endpoint`);
    return response.data;
  }
}
```

### Checklist création nouveau service API

- [ ] Importer `api` depuis `@/services/http`
- [ ] Utiliser `api.get()`, `api.post()`, etc.
- [ ] Chemins relatifs sans `baseURL` hardcodé
- [ ] Pas d'import direct d'`axios`
- [ ] Tester en local ET en Codespaces

## Autres services vérifiés

Tous les autres services API utilisent déjà correctement l'instance `api` :

- ✅ `frontend/src/services/api/reports.ts`
- ✅ `frontend/src/services/api/users.ts`
- ✅ `frontend/src/services/api/smtp.ts`
- ⚠️ **`frontend/src/services/api/settings.ts`** → **CORRIGÉ**

## État final

| Composant | Avant | Après |
|-----------|-------|-------|
| Import | `import axios` | `import { api }` ✅ |
| Base URL | `http://localhost:4000/api` | `window.location.origin + /api` ✅ |
| Credentials | Non envoyés | `withCredentials: true` ✅ |
| GET /settings | ERR_CONNECTION_REFUSED | 200 OK ✅ |
| PUT /settings | Non testé | Fonctionnel ✅ |
| POST /logo | Non testé | Fonctionnel ✅ |
| DELETE /logo | Non testé | Fonctionnel ✅ |

---

**Date** : 6 octobre 2025  
**Temps de résolution** : 5 minutes  
**Status** : ✅ RÉSOLU ET TESTÉ

## Impact

- ✅ Page Paramètres Système maintenant fonctionnelle
- ✅ Chargement des settings OK
- ✅ Mise à jour des settings OK
- ✅ Upload logo OK
- ✅ Fonctionne en local et Codespaces
- ✅ Compatible production (même domaine ou CORS configuré)
