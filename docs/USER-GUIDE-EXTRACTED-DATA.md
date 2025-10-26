# ✨ Nouvelle fonctionnalité : Données extraites

## 🎯 En bref

Vous pouvez maintenant **voir toutes les données extraites de vos rapports** dans une interface dédiée !

## 🚀 Comment y accéder ?

1. **Menu** : Gestion des données OSINT
2. **Onglet** : "Données extraites"

## 💡 Qu'est-ce que c'est ?

Lorsque vous créez un rapport avec des modules (plateformes, entreprises, identifiants), l'application **extrait automatiquement** les données importantes :

- 📱 **Téléphones**
- 📧 **Emails**
- 🏢 **Entreprises**
- 🌐 **Plateformes** (LinkedIn, Facebook, etc.)
- 👤 **Pseudos/Usernames**
- 📍 **Adresses**
- 🔗 **URLs**
- 👥 **Noms de personnes**
- 💳 **Comptes utilisateurs**

## ✨ Fonctionnalités

### 1. Statistiques en temps réel

6 cartes affichent les totaux de chaque type de donnée. **Cliquez sur une carte** pour filtrer le tableau !

### 2. Recherche

Barre de recherche pour **trouver rapidement** une donnée spécifique (email, téléphone, nom d'entreprise...).

### 3. Tableau détaillé

Chaque ligne affiche :

- **Type** (badge coloré)
- **Valeur** (la donnée elle-même)
- **Rapports** (combien de rapports la contiennent)
- **Actions** (bouton "Rechercher" pour voir les rapports sources)

### 4. Hover pour détails

Passez la souris sur le nombre de rapports pour **voir les IDs** des rapports sources.

### 5. Recherche rapide

Cliquez sur "🔍 Rechercher" pour une donnée → vous êtes **redirigé vers la page de recherche** avec le terme pré-rempli !

## 🎓 Exemple d'utilisation

**Problème** : Vous avez 30 rapports et cherchez tous ceux qui mentionnent `contact@suspect.com`

**Solution rapide** :

1. Allez dans "Données extraites"
2. Tapez "contact@suspect.com" dans la recherche
3. Voyez combien de rapports le mentionnent
4. Cliquez sur "Rechercher" → tous les rapports s'affichent !

## 🔄 Actualisation

Les données ne se mettent **pas à jour automatiquement**. Cliquez sur le bouton **"Actualiser"** pour recharger les statistiques après avoir créé de nouveaux rapports.

## 🆚 Différence avec "Entités"

| Onglet                | Source                              | Modification                  |
| --------------------- | ----------------------------------- | ----------------------------- |
| **Entités**           | Création manuelle                   | ✅ Créer, modifier, supprimer |
| **Données extraites** | Extraction automatique des rapports | ❌ Lecture seule              |

## 📊 Limite

Pour des raisons de performance, seuls les **100 premiers résultats** s'affichent. Si vous avez plus de résultats, un message vous suggère d'utiliser les **filtres** ou la **recherche**.

## ❓ Questions fréquentes

### "Je ne vois aucune donnée"

**Réponse** : C'est normal si vous n'avez pas encore créé de rapports avec des modules contenant des données. Créez un rapport avec un module "Analyse de plateforme" ou "Vue d'ensemble" et les données apparaîtront !

### "Les données ne sont pas à jour"

**Réponse** : Cliquez sur le bouton "Actualiser" pour recharger les statistiques.

### "Je vois des doublons (ex: 'LinkedIn' et 'linkedin')"

**Réponse** : C'est normal, l'application différencie les majuscules/minuscules pour l'instant. Faites attention à la casse lors de la saisie.

### "Comment supprimer une donnée ?"

**Réponse** : Les données extraites sont **générées automatiquement** depuis vos rapports. Pour supprimer une donnée, supprimez-la du rapport source.

## 🎉 Avantages

✅ **Visibilité complète** sur vos données collectées  
✅ **Recherche cross-rapports** en 2 clics  
✅ **Statistiques instantanées** de votre base de données  
✅ **Traçabilité** : voir quels rapports contiennent chaque information  
✅ **Gain de temps** : plus besoin de chercher manuellement dans tous les rapports

---

**Besoin d'aide ?** Consultez le [guide complet](QUICKSTART-EXTRACTED-DATA.md) ou contactez le support.
