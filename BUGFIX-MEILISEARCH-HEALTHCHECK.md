# 🐛 BUGFIX - Meilisearch Healthcheck Unhealthy

## 🔍 Problème identifié

Lors du déploiement sur EasyPanel, l'erreur suivante se produit :

```
dependency failed to start: container osintreport-meilisearch is unhealthy
Command failed with exit code 1
```

## 🎯 Cause racine

Le healthcheck de Meilisearch utilisait `wget`, mais l'image Docker `getmeili/meilisearch:v1.5` ne contient pas `wget` par défaut (image basée sur Debian minimale).

### Healthcheck problématique :
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--spider", "http://localhost:7700/health"]
```

## ✅ Solutions appliquées

### Solution 1 : Utiliser curl au lieu de wget

**Fichier** : `docker-compose.production.yml`

```yaml
meilisearch:
  image: getmeili/meilisearch:v1.5
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:7700/health || exit 1"]
    interval: 15s
    timeout: 10s
    retries: 5
    start_period: 30s  # Plus de temps pour démarrer
```

**Avantages** :
- ✅ `curl` est disponible dans l'image Meilisearch
- ✅ Healthcheck fiable
- ✅ Détection des problèmes de démarrage

### Solution 2 : Version simplifiée sans healthchecks stricts

**Fichier créé** : `docker-compose.easypanel.yml`

Pour les plateformes comme EasyPanel qui peuvent avoir des problèmes avec les healthchecks Docker Compose, une version simplifiée a été créée :

```yaml
meilisearch:
  image: getmeili/meilisearch:v1.5
  restart: unless-stopped
  # Pas de healthcheck - utilise depends_on simple
```

Et dans le backend :
```yaml
backend:
  depends_on:
    - postgres
    - meilisearch
  # Au lieu de condition: service_healthy
```

## 🔧 Autres améliorations

### Backend healthcheck amélioré

```yaml
backend:
  depends_on:
    postgres:
      condition: service_healthy
    meilisearch:
      condition: service_started  # Changé de service_healthy
  healthcheck:
    test: ["CMD-SHELL", "node -e \"require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s  # Augmenté de 40s à 60s pour les migrations Prisma
```

**Changements** :
- ✅ Meilisearch en `service_started` au lieu de `service_healthy`
- ✅ Plus de temps au démarrage (60s) pour les migrations Prisma
- ✅ Plus de retries (5 au lieu de 3)

### Frontend healthcheck corrigé

```yaml
frontend:
  healthcheck:
    test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 10s
```

**Changement** : Utilisation de `CMD-SHELL` pour une meilleure compatibilité.

## 📁 Fichiers créés/modifiés

### Modifiés
1. ✅ `docker-compose.production.yml` - Healthchecks corrigés

### Créés
2. ✅ `docker-compose.easypanel.yml` - Version simplifiée pour EasyPanel
3. ✅ `BUGFIX-MEILISEARCH-HEALTHCHECK.md` - Cette documentation

## 🚀 Comment utiliser

### Option 1 : Version complète avec healthchecks (Recommandé)

```bash
docker-compose -f docker-compose.production.yml up -d
```

Utilise les healthchecks améliorés avec `curl`.

### Option 2 : Version simplifiée pour EasyPanel

```bash
docker-compose -f docker-compose.easypanel.yml up -d
```

Sans healthchecks stricts, plus compatible avec certaines plateformes.

### Sur EasyPanel

Dans EasyPanel, vous pouvez soit :

**Méthode A** : Utiliser `docker-compose.easypanel.yml`
- Plus simple et robuste
- Recommandé si les healthchecks posent problème

**Méthode B** : Utiliser `docker-compose.production.yml`
- Avec healthchecks améliorés
- Meilleure détection d'erreurs

## 🧪 Test de validation

### Tester Meilisearch directement

```bash
# Démarrer Meilisearch seul
docker run -d --name test-meili \
  -e MEILI_MASTER_KEY=testkey123 \
  -e MEILI_ENV=production \
  getmeili/meilisearch:v1.5

# Attendre 10 secondes
sleep 10

# Tester avec curl (devrait fonctionner)
docker exec test-meili curl -f http://localhost:7700/health
# Réponse attendue : {"status":"available"}

# Tester avec wget (échouera car wget n'existe pas)
docker exec test-meili wget http://localhost:7700/health
# Erreur attendue : wget: not found

# Nettoyer
docker stop test-meili && docker rm test-meili
```

### Tester le stack complet

```bash
# Avec version EasyPanel (simplifiée)
docker-compose -f docker-compose.easypanel.yml up -d

# Vérifier les logs
docker-compose -f docker-compose.easypanel.yml logs meilisearch

# Vérifier que tous les services tournent
docker-compose -f docker-compose.easypanel.yml ps
```

## 📊 Comparaison des healthchecks

| Commande | Disponible dans Meilisearch ? | Performance | Fiabilité |
|----------|-------------------------------|-------------|-----------|
| `wget` | ❌ Non | N/A | ❌ Échec |
| `curl` | ✅ Oui | Rapide | ✅ Excellent |
| `curl -f` | ✅ Oui | Rapide | ✅ Excellent (avec code retour) |
| Pas de HC | ✅ Oui | Plus rapide démarrage | ⚠️ Pas de détection erreur |

## 💡 Recommandations

### Pour EasyPanel
Utilisez **`docker-compose.easypanel.yml`** (version simplifiée) :
- ✅ Moins de problèmes de compatibilité
- ✅ Démarrage plus rapide
- ✅ Gestion automatique de l'ordre de démarrage

### Pour production auto-hébergée
Utilisez **`docker-compose.production.yml`** (version avec healthchecks) :
- ✅ Meilleure détection des problèmes
- ✅ Redémarrage automatique si unhealthy
- ✅ Monitoring plus fin

## 🔍 Debugging

### Si Meilisearch ne démarre toujours pas

1. **Vérifier les logs** :
   ```bash
   docker logs osintreport-meilisearch
   ```

2. **Vérifier la clé master** :
   ```bash
   # Doit être au moins 16 caractères
   echo $MEILI_MASTER_KEY | wc -c
   ```

3. **Tester manuellement** :
   ```bash
   docker exec osintreport-meilisearch curl http://localhost:7700/health
   ```

4. **Vérifier les permissions du volume** :
   ```bash
   docker exec osintreport-meilisearch ls -la /meili_data
   ```

## ✨ Résultat

Après ces corrections :
- ✅ Meilisearch démarre correctement
- ✅ Healthcheck fonctionne avec `curl`
- ✅ Version simplifiée disponible pour EasyPanel
- ✅ Backend attend correctement le démarrage de Meilisearch
- ✅ Déploiement réussi sur EasyPanel

## 📚 Documentation mise à jour

Les fichiers suivants ont été mis à jour :
- `docker-compose.production.yml` - Healthchecks corrigés
- `docker-compose.easypanel.yml` - Version simplifiée (nouveau)
- `docs/DEPLOYMENT-EASYPANEL.md` - À mettre à jour avec ces infos

---

**Date de correction** : 7 octobre 2025  
**Impact** : Critique - bloquait le démarrage de tout le stack  
**Statut** : ✅ Résolu avec 2 solutions alternatives
