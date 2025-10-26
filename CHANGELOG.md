# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### En développement
- Interface de génération de rapports PDF avec template Police Belge
- Graphe de corrélations visuel interactif
- Signatures numériques pour rapports

## [1.1.1] - 2025-10-26

### Amélioré
- **Affichage en cartes des données extraites** : Interface remaniée avec grille de cartes au lieu de tableau
  - Affichage responsive (1/2/3 colonnes selon la taille d'écran)
  - Cartes colorées avec `border-l-4` selon le type de donnée
  - Affichage des 3 premiers rapports sources directement sur chaque carte
  - Navigation directe vers rapports via `router-link` (clic sur ID)
  - Modal de détails avec liste complète scrollable de tous les rapports
  - Boutons "Voir détails" et "Rechercher" sur chaque carte
  - Meilleure expérience utilisateur et cohérence avec l'affichage des entités

### Ajouté
- Variable `selectedExtractedItem` pour stocker l'item sélectionné
- Variable `extractedDetailsModal` pour la référence à la modal
- Fonction `getTypeBorderClass()` pour les classes de bordure par type
- Fonction `viewExtractedItem()` pour ouvrir la modal de détails
- Modal complète avec navigation directe vers tous les rapports sources

### Modifié
- Template : Remplacement du tableau par une grille CSS responsive
- Template : Ajout de la modal de détails avec liste de rapports
- Design : Cartes avec hover effect et transitions

## [1.1.0] - 2025-01-XX

### Ajouté
- **Visualisation des données extraites** : Nouvelle interface complète pour voir toutes les données extraites automatiquement des rapports
  - Onglet "Données extraites" dans la page "Gestion des données OSINT"
  - 6 cartes statistiques interactives (Téléphones, Emails, Entreprises, Plateformes, Pseudos, Adresses)
  - Tableau de données avec filtrage par type
  - Barre de recherche en temps réel
  - Traçabilité des rapports sources pour chaque donnée
  - Bouton "Rechercher" pour navigation rapide vers la page de recherche
  - Extraction de 9 types de données : phones, emails, companies, platforms, aliases, names, addresses, urls, accounts
- **Backend** : Endpoint `GET /api/search/extracted` avec agrégation complète des données
- **Backend** : Méthode `SearchService.getExtractedData()` utilisant Maps pour éviter doublons
- **Frontend** : Interfaces TypeScript `ExtractedData` et `ExtractedItem`
- **Documentation** : 5 nouveaux documents (feature, quickstart, delivery, user guide, session summary)
- **Scripts** : Script de test automatisé `test-extracted-data.sh`

### Modifié
- Page "Entités" renommée en "Gestion des données OSINT"
- Système d'onglets ajouté : "Entités" (manuel) et "Données extraites" (automatique)
- README.md mis à jour avec la nouvelle fonctionnalité

### Performances
- Limite d'affichage à 100 résultats pour maintenir la réactivité
- Utilisation de Maps et Sets pour agrégation efficace côté backend
- Debouncing sur la recherche (300ms)

### Sécurité
- Permission `reports:read` requise pour l'endpoint `/api/search/extracted`
- Validation via token JWT
- Protection XSS via templating Vue.js
- Protection injection SQL via Prisma ORM

## [1.0.0] - 2025-01-XX

### Ajouté
- **Architecture complète** : Backend Express + Frontend Vue 3
- **Authentification** : Système JWT avec cookies httpOnly
- **RBAC** : Permissions granulaires (reports:read, reports:write, users:read, users:write, system:admin)
- **Rapports OSINT** : Création, modification, publication, archivage
- **Modules d'analyse** : 12 types de modules structurés (téléphone, email, réseaux sociaux, financier, etc.)
- **Système de corrélations** : Détection automatique de liens entre rapports
- **Gestion d'entités** : Personnes, organisations, contacts avec autocomplétion
- **MeiliSearch** : Intégration complète avec recherche full-text
- **Interface de recherche** : Filtres facettés, highlighting, pagination
- **Dashboard** : Statistiques en temps réel et vue d'ensemble
- **Workflow** : DRAFT → PUBLISHED → ARCHIVED
- **Sécurité** : Chiffrement AES-256-GCM pour données sensibles (Vault)
- **Base de données** : PostgreSQL avec Prisma ORM
- **Docker** : Configuration Docker Compose pour PostgreSQL et MeiliSearch
- **Documentation** : 15+ documents techniques et guides utilisateur

### Technologies
- **Backend** : Node.js 20, Express 5, TypeScript 5, Prisma
- **Frontend** : Vue 3, Vite, Pinia, Vue Router, TypeScript
- **UI** : Tailwind CSS, DaisyUI, HugeIcons
- **Base de données** : PostgreSQL 16
- **Recherche** : MeiliSearch 1.5
- **Authentification** : JWT, Argon2
- **Validation** : Zod schemas

### Sécurité
- Authentification JWT avec refresh tokens
- Permissions RBAC granulaires
- Chiffrement AES-256-GCM (KeyStore + VaultItem)
- Validation Zod sur toutes les entrées
- Cookies httpOnly sécurisés
- Audit logs pour traçabilité
- Protection CSRF
- Hash Argon2 pour mots de passe

### Performance
- Pagination sur toutes les listes
- Lazy loading des modules de rapports
- Debouncing sur recherche et autocomplétion
- Index MeiliSearch optimisés
- Cache client via Pinia stores

### Documentation
- Guide de démarrage rapide
- Documentation API complète (50+ endpoints)
- Architecture détaillée
- Guide de déploiement
- Documentation sécurité (Vault)
- Templates de rapports
- Guides d'intégration

---

## Types de changements

- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements dans les fonctionnalités existantes
- `Déprécié` pour les fonctionnalités bientôt supprimées
- `Supprimé` pour les fonctionnalités supprimées
- `Corrigé` pour les corrections de bugs
- `Sécurité` pour les vulnérabilités corrigées
- `Performance` pour les améliorations de performance
- `Documentation` pour les changements de documentation
