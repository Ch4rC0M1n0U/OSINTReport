# 📁 Scripts OSINTReport

Ce dossier contient les scripts utilitaires pour la gestion de la base de données et des données de test.

## 📄 Fichiers

### 🎯 Données de test (Dummy Data)

| Fichier                   | Type | Description                                           |
| ------------------------- | ---- | ----------------------------------------------------- |
| `insert_dummy_report.sql` | SQL  | Script d'insertion d'un dossier OSINT complet de test |
| `cleanup_dummy_data.sql`  | SQL  | Script de suppression des données de test             |
| `seed-dummy-data.sh`      | Bash | Script automatisé d'insertion (recommandé)            |
| `cleanup-dummy-data.sh`   | Bash | Script automatisé de nettoyage                        |

### 📚 Documentation

| Fichier                | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `GUIDE_UTILISATION.md` | **Guide complet d'utilisation** (commencez ici !)     |
| `README_DUMMY_DATA.md` | Documentation détaillée du contenu du dossier de test |
| `README.md`            | Ce fichier (index du dossier)                         |

## 🚀 Démarrage rapide

### Insérer des données de test

```bash
# Depuis la racine du projet
./scripts/seed-dummy-data.sh
```

### Nettoyer les données de test

```bash
./scripts/cleanup-dummy-data.sh
```

## 📊 Contenu du dossier de test

Le script `insert_dummy_report.sql` insère :

- ✅ **1 rapport OSINT complet** - Enquête sur fraude financière
- ✅ **10 entités** - Personnes, organisations, téléphones, emails, comptes, adresses
- ✅ **12 modules** - Profils, rich text, timeline, network map, etc.
- ✅ **4 recherches OSINT** - Réseaux sociaux, registres publics, WHOIS, breaches
- ✅ **Données indexables** - Pour Meilisearch
- ✅ **Logs d'audit** - Traçabilité complète

## 📖 Pour plus d'informations

Consultez le **[Guide d'utilisation](GUIDE_UTILISATION.md)** pour des instructions détaillées.

## 🎭 Cas d'usage

### Développement Frontend

Testez toutes les fonctionnalités de l'interface sans créer manuellement des données :

- Visualisation de rapports complets
- Navigation entre modules
- Affichage des entités
- Timeline et corrélations
- Rich text formatting

### Démonstration

Montrez les capacités de l'application avec un dossier réaliste et professionnel.

### Tests automatisés

Utilisez ces données comme fixtures pour vos tests E2E.

### Formation

Formez les utilisateurs avec un exemple concret et complet.

## ⚙️ Configuration

Les scripts utilisent les variables d'environnement définies dans `.env` :

- `POSTGRES_USER` - Utilisateur PostgreSQL (défaut: `osint_admin`)
- `POSTGRES_DB` - Base de données (défaut: `osint_db`)

## 🛠️ Prérequis

- Docker et docker-compose en cours d'exécution
- PostgreSQL accessible (via conteneur `osintreport-postgres`)
- Au moins un utilisateur créé dans la table `User`

## 🔒 Sécurité

⚠️ **Les données de test sont FICTIVES** et ne doivent **JAMAIS** être utilisées en production !

Ces données sont destinées uniquement aux environnements de :

- Développement local
- Tests
- Démonstration
- Formation

## 📝 Licence

Ces scripts font partie du projet OSINTReport et suivent la même licence que le projet principal.

---

**Bon développement !** 🚀
