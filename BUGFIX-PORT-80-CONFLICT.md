# 🐛 BUGFIX - Port 80 déjà alloué sur EasyPanel

## 🔍 Problème identifié

Lors du déploiement sur EasyPanel avec `docker-compose.easypanel.yml`, l'erreur suivante se produit :

```
Error response from daemon: failed to set up container networking: 
driver failed programming external connectivity on endpoint home_osint-frontend-1: 
Bind for 0.0.0.0:80 failed: port is already allocated
```

## 🎯 Cause racine

EasyPanel utilise son propre **reverse proxy** (généralement Nginx ou Traefik) qui écoute déjà sur le port 80 pour router les requêtes vers les différents services.

Quand Docker Compose essaie d'exposer le port 80 avec `ports: - "80:8080"`, il entre en conflit avec le reverse proxy d'EasyPanel.

## ✅ Solution

### Utiliser `expose` au lieu de `ports`

**AVANT** (❌ Incorrect pour EasyPanel) :
```yaml
frontend:
  build:
    context: ./frontend
  ports:
    - "${FRONTEND_PORT:-80}:8080"  # ❌ Essaie de binder le port 80 de l'hôte
```

**APRÈS** (✅ Correct pour EasyPanel) :
```yaml
frontend:
  build:
    context: ./frontend
  expose:
    - "8080"  # ✅ Expose le port seulement au réseau Docker interne
```

### Différence entre `ports` et `expose`

| Directive | Comportement | Usage |
|-----------|-------------|--------|
| `ports: - "80:8080"` | Expose le port sur l'hôte (0.0.0.0:80) | Serveur sans reverse proxy |
| `expose: - "8080"` | Expose le port seulement au réseau Docker | Avec reverse proxy (EasyPanel) |

## 🔧 Corrections appliquées

### Frontend

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
    args:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL}
  restart: unless-stopped
  expose:
    - "8080"  # ✅ Au lieu de ports: - "80:8080"
  depends_on:
    - backend
  networks:
    - osintreport-network
```

### Backend

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  restart: unless-stopped
  expose:
    - "4000"  # ✅ Exposé pour le reverse proxy
  environment:
    # ...
```

## 📋 Comment EasyPanel gère le routing

### Architecture avec EasyPanel

```
Internet
   ↓
┌──────────────────────┐
│  EasyPanel Nginx     │
│  (Port 80/443)       │
└──────────────────────┘
   ↓                ↓
┌─────────────┐  ┌─────────────┐
│  Frontend   │  │  Backend    │
│  (Port 8080)│  │  (Port 4000)│
│  expose:8080│  │  expose:4000│
└─────────────┘  └─────────────┘
```

### Configuration dans EasyPanel

Dans l'interface EasyPanel, vous devez configurer :

1. **Frontend** :
   - Service: `frontend`
   - Port interne: `8080`
   - Domaine: `votredomaine.com`

2. **Backend** :
   - Service: `backend`
   - Port interne: `4000`
   - Domaine: `api.votredomaine.com`

EasyPanel créera automatiquement les routes dans son reverse proxy.

## 🧪 Test de validation

### Vérifier la configuration

```bash
# Le fichier ne doit plus contenir "ports:" pour frontend/backend
grep -n "ports:" docker-compose.easypanel.yml

# Doit contenir "expose:" pour frontend et backend
grep -n "expose:" docker-compose.easypanel.yml
```

### Déployer sur EasyPanel

```bash
# Push les changements
git add docker-compose.easypanel.yml
git commit -m "fix: Use expose instead of ports for EasyPanel compatibility"
git push origin main

# Sur EasyPanel, redéployer avec docker-compose.easypanel.yml
```

## 📊 Comparaison des configurations

### Pour EasyPanel (Plateforme PaaS)

```yaml
frontend:
  expose:
    - "8080"  # ✅ Pas de binding sur l'hôte
```

**Avantages** :
- ✅ Pas de conflit de port
- ✅ Reverse proxy gère SSL/TLS
- ✅ Load balancing automatique
- ✅ Certificats Let's Encrypt automatiques

### Pour serveur auto-hébergé (Sans reverse proxy)

```yaml
frontend:
  ports:
    - "80:8080"  # ✅ Binding direct pour accès public
```

**Usage** :
- Serveur dédié sans reverse proxy
- Accès direct via IP:80
- Gestion manuelle de SSL

## 💡 Bonnes pratiques

### Sur plateforme PaaS (EasyPanel, Heroku, Railway, etc.)

- ✅ Toujours utiliser `expose` au lieu de `ports`
- ✅ Laisser la plateforme gérer le routing
- ✅ Configurer les domaines dans l'interface de la plateforme
- ✅ Ne pas gérer SSL dans vos conteneurs

### Sur serveur auto-hébergé avec Nginx/Traefik

- ✅ Utiliser `expose` si vous avez un reverse proxy
- ✅ Utiliser `ports` seulement si accès direct nécessaire
- ✅ Préférer un reverse proxy pour gérer SSL et routing

## 🆘 Autres ports qui peuvent causer des conflits

Sur EasyPanel, évitez de binder ces ports sur l'hôte :

| Port | Service | Raison |
|------|---------|--------|
| 80 | HTTP | Reverse proxy EasyPanel |
| 443 | HTTPS | Reverse proxy EasyPanel |
| 22 | SSH | SSH du serveur |
| 3306 | MySQL | Parfois utilisé par la plateforme |
| 5432 | PostgreSQL | Parfois exposé par la plateforme |

**Solution** : Toujours utiliser `expose` pour ces ports.

## ✨ Résultat

Après cette correction :
- ✅ Pas de conflit de port
- ✅ EasyPanel peut router correctement vers les services
- ✅ SSL/TLS géré automatiquement par EasyPanel
- ✅ Déploiement réussi

## 📚 Fichier mis à jour

- `docker-compose.easypanel.yml` - Utilise maintenant `expose` au lieu de `ports`

## 🔗 Configuration des domaines dans EasyPanel

Après le déploiement, configurez dans EasyPanel :

1. **Aller dans Services** → **frontend**
2. **Domains** → **Add Domain**
3. Ajouter : `votredomaine.com` → Port interne : `8080`

4. **Aller dans Services** → **backend**
5. **Domains** → **Add Domain**
6. Ajouter : `api.votredomaine.com` → Port interne : `4000`

EasyPanel génèrera automatiquement les certificats SSL avec Let's Encrypt ! 🔒

---

**Date de correction** : 7 octobre 2025  
**Impact** : Critique - bloquait le démarrage sur EasyPanel  
**Statut** : ✅ Résolu
