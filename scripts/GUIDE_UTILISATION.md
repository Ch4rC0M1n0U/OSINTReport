# 🎯 Guide d'utilisation des données de test

## 📝 Vue d'ensemble

Les scripts dans ce dossier vous permettent d'insérer et de nettoyer des données de test complètes pour le frontend OSINTReport.

## 📦 Fichiers disponibles

### Scripts SQL

- **`insert_dummy_report.sql`** - Script d'insertion des données de test
- **`cleanup_dummy_data.sql`** - Script de suppression des données de test

### Scripts Shell

- **`seed-dummy-data.sh`** ✅ - Script d'insertion automatisé (recommandé)
- **`cleanup-dummy-data.sh`** - Script de nettoyage automatisé

### Documentation

- **`README_DUMMY_DATA.md`** - Documentation détaillée du contenu du dossier

## 🚀 Utilisation rapide

### Méthode 1: Script Shell (recommandé)

```bash
# Depuis la racine du projet
./scripts/seed-dummy-data.sh

# Pour nettoyer
./scripts/cleanup-dummy-data.sh
```

### Méthode 2: npm (depuis /backend)

```bash
cd backend
npm run db:seed-dummy
```

### Méthode 3: Docker direct

```bash
# Insertion
docker exec -i osintreport-postgres psql -U osint_admin -d osint_db < scripts/insert_dummy_report.sql

# Nettoyage
docker exec -i osintreport-postgres psql -U osint_admin -d osint_db < scripts/cleanup_dummy_data.sql
```

### Méthode 4: psql direct (si vous avez accès direct à PostgreSQL)

```bash
psql -U osint_admin -d osint_db -f scripts/insert_dummy_report.sql
```

## 📊 Données insérées

### Rapport principal

- **ID**: `dummy-report-2024-001`
- **Titre**: "Enquête sur fraude financière et blanchiment d'argent - Réseau international"
- **Numéro de dossier**: `CASE-2024-BR-0573`
- **Numéro de rapport**: `RPT-OSINT-2024-001`
- **Classification**: CONFIDENTIAL
- **Urgence**: URGENT
- **Statut**: PUBLISHED (validé et verrouillé)

### Entités (10 au total)

#### Personnes (2)

1. **MARTIN Alexandre Pierre** - Suspect principal, gérant de MultiTrade SPRL
2. **DUBOIS Marie-Claire** - Administratrice de Global Invest SA

#### Organisations (2)

1. **MultiTrade SPRL** - Société écran présumée
2. **Global Invest SA** - Société d'investissement liée

#### Téléphones (2)

1. **+32 475 12 34 56** - Numéro de MARTIN Alexandre
2. **+33 6 78 90 12 34** - Numéro français lié à MultiTrade

#### Emails (2)

1. **a.martin@multitrade.be** - Email professionnel de MARTIN
2. **mc.dubois@globalinvest.eu** - Email de DUBOIS

#### Comptes (2)

1. **@alexm_trader** - Instagram de MARTIN (12.5K followers)
2. **alexandremartin_pro** - LinkedIn professionnel

#### Adresses (2)

1. **Avenue Louise 250, 1050 Bruxelles** - Siège social MultiTrade
2. **Rue de la Loi 155, 1040 Bruxelles** - Siège social Global Invest

### Modules du rapport (12)

1. ✅ **Profil** - MARTIN Alexandre (données biographiques complètes)
2. ✅ **Profil** - DUBOIS Marie-Claire
3. ✅ **Téléphone** - Analyse du +32 475 12 34 56
4. ✅ **Email** - Analyse de a.martin@multitrade.be
5. ✅ **Adresse** - Avenue Louise 250
6. ✅ **Organisation** - MultiTrade SPRL
7. ✅ **Account** - Instagram @alexm_trader
8. ✅ **Rich Text** - Contexte de l'enquête (HTML formaté avec titres, listes, tableaux)
9. ✅ **Rich Text** - Analyse des flux financiers
10. ✅ **Extracted Data** - Documents publics (BCE, WHOIS, comptes annuels)
11. ✅ **Timeline** - 14 événements chronologiques (2017-2024)
12. ✅ **Network Map** - Carte des corrélations et du réseau

### Données supplémentaires

- **4 ResearchRecords** - Enregistrements de recherches OSINT
- **1 ReportVersion** - Version du rapport
- **1 SearchableContent** - Contenu indexable pour Meilisearch
- **3 AuditLogs** - Logs d'audit (création, modification, validation)

## 🎭 Scénario du dossier

Le dossier simule une **enquête OSINT réaliste** sur un réseau de blanchiment d'argent international :

- **Contexte**: Suite à un signalement de la CTIF (Cellule de Traitement des Informations Financières)
- **Suspects**: MARTIN Alexandre Pierre et DUBOIS Marie-Claire
- **Méthode**: Utilisation de sociétés écrans belges (MultiTrade SPRL, Global Invest SA)
- **Montants**: ~4.7M€ de transactions suspectes
- **Zones géographiques**: Belgique, Luxembourg, Suisse, Dubaï, Monaco
- **Techniques**: Cryptomonnaies, fausses factures, paradis fiscaux

Le rapport contient des **éléments réalistes** :

- Profils complets avec données biographiques
- Analyse de réseaux sociaux (Instagram lifestyle)
- Registres publics (BCE, WHOIS)
- Data breaches identifiés
- Timeline détaillée des événements
- Cartographie du réseau criminel
- Analyse financière

## ✅ Vérification

Après l'insertion, vérifiez que tout est OK :

```bash
# Via Docker
docker exec -i osintreport-postgres psql -U osint_admin -d osint_db -c "SELECT * FROM \"Report\" WHERE \"id\" = 'dummy-report-2024-001';"

# Compter les modules
docker exec -i osintreport-postgres psql -U osint_admin -d osint_db -c "SELECT COUNT(*) FROM \"ReportModule\" WHERE \"reportId\" = 'dummy-report-2024-001';"

# Compter les entités
docker exec -i osintreport-postgres psql -U osint_admin -d osint_db -c "SELECT COUNT(*) FROM \"Entity\" WHERE \"id\" LIKE 'entity-%';"
```

Vous devriez avoir :

- ✅ 1 rapport
- ✅ 12 modules
- ✅ 10 entités (ou 12 selon les types de recherche créés)

## 🌐 Accès Frontend

Une fois les données insérées, vous pouvez :

1. **Ouvrir le frontend** (http://localhost:5173 ou votre URL Codespaces)
2. **Se connecter** avec votre compte utilisateur
3. **Naviguer vers la liste des rapports**
4. **Ouvrir le rapport** "Enquête sur fraude financière et blanchiment d'argent"
5. **Explorer tous les modules** et fonctionnalités

## 🧹 Nettoyage

Pour supprimer toutes les données de test :

```bash
./scripts/cleanup-dummy-data.sh
```

⚠️ **Attention**: Cette opération est **irréversible** ! Elle supprime :

- Le rapport `dummy-report-2024-001`
- Toutes les entités de test
- Tous les modules associés
- Les enregistrements de recherche
- Les versions et logs

## 🛠️ Personnalisation

Pour adapter le script à vos besoins :

1. **Modifier les entités** : Éditez `insert_dummy_report.sql` section "ENTITÉS"
2. **Ajouter des modules** : Ajoutez des INSERT dans la section "MODULES DU RAPPORT"
3. **Changer les dates** : Modifiez les timestamps dans les INSERT
4. **Adapter les données** : Personnalisez les payloads JSON

## 🐛 Dépannage

### Erreur "role osint does not exist"

➡️ Vérifiez les variables d'environnement dans `.env` (POSTGRES_USER, POSTGRES_DB)

### Erreur "container not found"

➡️ Assurez-vous que Docker est démarré : `docker-compose up -d`

### Erreur "duplicate key value"

➡️ Les données existent déjà. Nettoyez d'abord : `./scripts/cleanup-dummy-data.sh`

### Le rapport n'apparaît pas dans le frontend

➡️ Vérifiez que votre utilisateur a les permissions nécessaires
➡️ Vérifiez que le statut du rapport est bien PUBLISHED

## 📚 Ressources

- Documentation complète : `README_DUMMY_DATA.md`
- Script SQL brut : `insert_dummy_report.sql`
- Script de nettoyage : `cleanup_dummy_data.sql`

## 🎉 Bon test !

Profitez de ce dossier de test complet pour explorer et tester toutes les fonctionnalités de votre application OSINTReport !
