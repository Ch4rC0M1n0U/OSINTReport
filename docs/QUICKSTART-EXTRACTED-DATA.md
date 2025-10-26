# 🚀 Quick Start - Données Extraites

Ce guide vous permet de tester rapidement la nouvelle fonctionnalité "Données extraites".

## 📋 Prérequis

- Docker et Docker Compose installés
- Ports 3000 (backend), 5173 (frontend), 5432 (PostgreSQL), 7700 (MeiliSearch) disponibles

## ⚡ Démarrage rapide

### 1. Démarrer l'application

```bash
# Depuis la racine du projet
docker-compose up -d

# Vérifier que tous les services sont démarrés
docker-compose ps
```

Vous devriez voir :

- `osintreport-backend` (port 3000)
- `osintreport-frontend` (port 5173)
- `postgres` (port 5432)
- `meilisearch` (port 7700)

### 2. Initialiser la base de données

```bash
# Appliquer les migrations Prisma
docker-compose exec backend npx prisma migrate deploy

# (Optionnel) Seed avec données de test
docker-compose exec backend npx prisma db seed
```

### 3. Accéder à l'application

Ouvrez votre navigateur : **http://localhost:5173**

Identifiants par défaut :

- Email : `admin@osintreport.local`
- Mot de passe : `admin`

## 🧪 Tester la fonctionnalité

### Option A : Interface Web

1. **Connectez-vous** avec les identifiants ci-dessus
2. **Créez un rapport** avec des données :
   ```
   Menu : Rapports > Nouveau rapport
   - Titre : "Test Données Extraites"
   - Ajoutez un module "Analyse de plateforme" :
     * Nom : LinkedIn
     * URL : https://linkedin.com/in/exemple
   - Ajoutez un module "Vue d'ensemble" :
     * Détails entreprise : Acme Corp
     * Email : contact@acme.com
     * Téléphone : +33 1 23 45 67 89
   ```
3. **Sauvegardez le rapport**
4. **Allez dans "Gestion des données OSINT"** (menu latéral)
5. **Cliquez sur l'onglet "Données extraites"**
6. **Observez les statistiques** :
   - 📱 Téléphones : 1
   - 📧 Emails : 1
   - 🏢 Entreprises : 1
   - 🌐 Plateformes : 1
7. **Testez les filtres** :
   - Cliquez sur une carte de stats → filtre par type
   - Utilisez la barre de recherche
   - Cliquez sur "Rechercher" pour une donnée

### Option B : API (avec cURL)

```bash
# Obtenir un token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osintreport.local","password":"admin"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Appeler l'endpoint extracted data
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/search/extracted | jq
```

Réponse attendue :

```json
{
  "phones": [
    {
      "value": "+33 1 23 45 67 89",
      "reports": ["report-id-1"],
      "count": 1
    }
  ],
  "emails": [...],
  "companies": [...],
  "platforms": [...],
  "stats": {
    "totalPhones": 1,
    "totalEmails": 1,
    "totalCompanies": 1,
    "totalPlatforms": 1,
    "totalReports": 1,
    ...
  }
}
```

### Option C : Script de test automatisé

```bash
# Exécuter le script de test
./scripts/test-extracted-data.sh
```

Le script va :

1. Vérifier que le serveur est accessible
2. Tester l'authentification
3. Appeler l'endpoint `/api/search/extracted`
4. Afficher les statistiques
5. Vérifier la structure de la réponse
6. Mesurer la performance

## 🎯 Scénarios de test

### Scénario 1 : Rapports multiples avec données communes

**Objectif** : Vérifier l'agrégation des doublons

1. Créer 3 rapports différents mentionnant tous "LinkedIn"
2. Aller dans "Données extraites"
3. Vérifier que "LinkedIn" apparaît 1 seule fois avec `count: 3`
4. Hover sur le badge "3 rapport(s)" → voir les 3 IDs

### Scénario 2 : Recherche cross-rapports

**Objectif** : Retrouver toutes les occurrences d'une donnée

1. Dans "Données extraites", repérer un email apparaissant plusieurs fois
2. Cliquer sur "Rechercher" pour cet email
3. Vérifier que la page de recherche affiche tous les rapports contenant cet email

### Scénario 3 : Performance avec volume

**Objectif** : Tester avec beaucoup de données

1. Créer 20-30 rapports avec multiples modules
2. Aller dans "Données extraites"
3. Vérifier que le chargement prend <2 secondes
4. Vérifier que seuls 100 résultats max s'affichent (message si dépassé)

### Scénario 4 : Filtrage par type

**Objectif** : Vérifier l'isolation des types

1. Dans "Données extraites", cliquer sur "📧 Emails"
2. Vérifier que seuls les emails s'affichent (pas de téléphones, entreprises, etc.)
3. Cliquer sur "Voir tout" → tous les types réapparaissent

## 🔍 Vérifications importantes

### ✅ Interface utilisateur

- [ ] Onglets "Entités" et "Données extraites" visibles
- [ ] 6 cartes de statistiques affichées correctement
- [ ] Cartes cliquables pour filtrer
- [ ] Loading skeleton pendant le chargement
- [ ] Barre de recherche fonctionnelle
- [ ] Tableau avec colonnes : Type, Valeur, Rapports, Actions
- [ ] Badges colorés par type de donnée
- [ ] Tooltip sur le nombre de rapports (affiche les IDs)
- [ ] Bouton "Rechercher" redirige vers `/search?q=...`
- [ ] Message si aucune donnée
- [ ] Message si limite de 100 résultats atteinte

### ✅ Fonctionnalités

- [ ] Auto-chargement au changement d'onglet
- [ ] Bouton "Actualiser" fonctionne
- [ ] Recherche filtre bien les résultats
- [ ] Filtres par type isolent bien les données
- [ ] "Voir tout" réinitialise les filtres
- [ ] Performance acceptable (<2s)

### ✅ Données extraites

- [ ] Téléphones extraits de `personDetails.phone`, `companyDetails.phone`
- [ ] Emails extraits de `personDetails.email`, `companyDetails.email`
- [ ] Entreprises extraites de `companyDetails.legalName`, `companyDetails.tradeName`
- [ ] Plateformes extraites de `platform_analysis` (name, category)
- [ ] Pseudos extraits de `metadata.aliases`
- [ ] Noms extraits de `personDetails` (firstName, lastName)
- [ ] Adresses extraites de tous les modules
- [ ] URLs extraites de `websites`, `platform urls`
- [ ] Comptes extraits de `usernames`, `handles`

## 🐛 Dépannage

### Problème : "Aucune donnée extraite"

**Cause** : Aucun rapport créé ou aucune donnée dans les modules

**Solution** :

1. Vérifier qu'il existe des rapports dans l'application
2. Vérifier que les rapports contiennent des modules avec données
3. Aller dans Administration > Gestion de la recherche > Actualiser les statistiques

### Problème : Erreur 401 lors de l'appel API

**Cause** : Token invalide ou expiré

**Solution** :

```bash
# Obtenir un nouveau token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@osintreport.local","password":"admin"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo $TOKEN
```

### Problème : Temps de réponse très long (>5s)

**Cause** : Trop de rapports dans la base

**Solution** :

1. C'est normal avec beaucoup de rapports (pas de cache)
2. Optimisation future possible avec Redis
3. En attendant, utiliser les filtres pour réduire les résultats

### Problème : Données en doublon (ex: "linkedin" et "LinkedIn")

**Cause** : Pas de normalisation de la casse

**Solution** :

- C'est un comportement normal pour l'instant
- Optimisation future : normalisation côté backend
- En attendant, faire attention à la casse lors de la saisie

## 📊 Données de test suggérées

Pour tester efficacement, créez des rapports avec :

### Rapport 1 : "John Doe - Profil LinkedIn"

- Module **Vue d'ensemble** :
  - Détails personne : John Doe, john.doe@gmail.com, +33 6 12 34 56 78
- Module **Analyse de plateforme** :
  - Plateforme : LinkedIn
  - URL : https://linkedin.com/in/johndoe
  - Username : johndoe

### Rapport 2 : "Acme Corp - Entreprise"

- Module **Vue d'ensemble** :
  - Détails entreprise : Acme Corp, contact@acme.com, +33 1 23 45 67 89
  - Adresse : 123 Rue de Paris, 75001 Paris, France
- Module **Analyse de plateforme** :
  - Plateforme : LinkedIn
  - URL : https://linkedin.com/company/acme-corp

### Rapport 3 : "Jane Smith - Multi-plateformes"

- Module **Vue d'ensemble** :
  - Détails personne : Jane Smith, jane.smith@example.com
- Module **Analyse de plateforme** (×3) :
  - LinkedIn (janesmith)
  - Facebook (jane.smith.123)
  - Instagram (@janesmith)

**Résultat attendu dans "Données extraites"** :

- 📱 Téléphones : 2 (John Doe, Acme Corp)
- 📧 Emails : 3 (John, Acme, Jane)
- 🏢 Entreprises : 1 (Acme Corp)
- 🌐 Plateformes : 4 (LinkedIn ×2, Facebook, Instagram)
- 👤 Pseudos : 3 (johndoe, jane.smith.123, @janesmith)

## 🎓 Cas d'usage réels

### Use case 1 : Recherche d'un email dans tous les rapports

**Problème** : Vous avez 50 rapports et cherchez tous ceux mentionnant `contact@suspect.com`

**Solution** :

1. Aller dans "Données extraites"
2. Chercher "contact@suspect.com" dans la barre de recherche
3. Voir combien de rapports contiennent cet email
4. Cliquer sur "Rechercher" → voir tous les rapports

### Use case 2 : Audit des plateformes couvertes

**Problème** : Vous voulez savoir quelles plateformes vous avez le plus documentées

**Solution** :

1. Aller dans "Données extraites"
2. Cliquer sur la carte "🌐 Plateformes"
3. Voir la liste triée par fréquence
4. Exemple : LinkedIn (45 rapports), Facebook (32 rapports), etc.

### Use case 3 : Export des téléphones collectés

**Problème** : Vous avez besoin de la liste de tous les téléphones trouvés

**Solution** :

1. Aller dans "Données extraites"
2. Cliquer sur "📱 Téléphones"
3. (À venir) Bouton "Exporter CSV"
4. En attendant, copier manuellement ou via API

## 📚 Documentation complète

- **Architecture** : `/docs/architecture.md`
- **Feature complète** : `/docs/FEATURE-EXTRACTED-DATA-DISPLAY.md`
- **API Endpoints** : `/docs/AI-API-EXAMPLES.md`
- **Déploiement** : `/docs/DEPLOYMENT-EASYPANEL.md`

## 🤝 Support

- **Issues GitHub** : Créer une issue avec le tag `extracted-data`
- **Logs backend** : `docker-compose logs -f backend`
- **Logs frontend** : Console du navigateur (F12)

---

**Happy testing! 🎉**
