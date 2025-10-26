# 📖 Guide : Consulter les données extraites et naviguer vers les rapports

## 🎯 Nouveau : Affichage en cartes

Les données extraites s'affichent maintenant sous forme de **cartes visuelles** au lieu d'un tableau.

## 🚀 Comment faire ?

### 1. Accéder aux données extraites

```
Menu → Gestion des données OSINT → Onglet "Données extraites"
```

### 2. Voir les informations d'une donnée

Chaque carte affiche :

- 🏷️ **Type de donnée** (Entreprise, Plateforme, Email, etc.)
- 📊 **Nombre de rapports** qui contiennent cette donnée
- 📝 **La valeur** (nom d'entreprise, email, téléphone, etc.)
- 📄 **Les 3 premiers rapports sources** (IDs cliquables)

### 3. Naviguer vers un rapport (2 méthodes)

#### Méthode rapide : Depuis la carte

Les 3 premiers IDs de rapports sont **cliquables directement** :

```
┌─────────────────────────┐
│ 🏢 Entreprise  5 rapport│
│                         │
│ Acme Corporation        │
│                         │
│ Rapports sources :      │
│ [abc123...] ← CLIQUEZ ! │
│ [def456...] ← CLIQUEZ ! │
│ [ghi789...] ← CLIQUEZ ! │
│                         │
│ [Voir détails] [🔍]     │
└─────────────────────────┘
```

**→ Clic sur un ID → Vous êtes redirigé vers le rapport !**

#### Méthode complète : Via la modal

1. **Cliquez sur la carte** (n'importe où) ou sur **"Voir détails"**
2. Une fenêtre s'ouvre avec **TOUS les rapports** (pas de limite à 3)
3. **Cliquez sur le rapport** que vous voulez consulter
4. Vous êtes redirigé vers ce rapport

```
┌──────────────────────────────────────────┐
│ 🏢 Détails de la donnée             [✕] │
├──────────────────────────────────────────┤
│                                          │
│ 🏢 Entreprise         5 rapport(s)       │
│ Acme Corporation                         │
│                                          │
│ 📄 Rapports contenant cette donnée :    │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ → Rapport abc123... (cliquez!)     │  │
│ │ → Rapport def456... (cliquez!)     │  │
│ │ → Rapport ghi789... (cliquez!)     │  │
│ │ → Rapport jkl012... (cliquez!)     │  │
│ │ → Rapport mno345... (cliquez!)     │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [🔍 Rechercher partout]     [Fermer]    │
└──────────────────────────────────────────┘
```

### 4. Rechercher dans tous les rapports

Si vous voulez **rechercher** cette donnée dans l'application :

1. Cliquez sur le bouton **🔍 "Rechercher"** (dans la carte ou la modal)
2. Vous êtes redirigé vers la page de recherche
3. La donnée est pré-remplie dans la barre de recherche
4. Vous voyez tous les rapports qui la contiennent

## 💡 Exemples d'utilisation

### Exemple 1 : Trouver un rapport qui mentionne LinkedIn

1. Allez dans "Données extraites"
2. Cliquez sur le filtre **"🌐 Plateformes"** (dans les stats en haut)
3. Cherchez "LinkedIn" dans la barre de recherche
4. Cliquez sur la carte LinkedIn
5. Modal s'ouvre avec la liste de tous les rapports
6. **Cliquez sur le rapport** que vous voulez consulter

### Exemple 2 : Voir tous les rapports d'une entreprise

1. Allez dans "Données extraites"
2. Cliquez sur le filtre **"🏢 Entreprises"**
3. Trouvez l'entreprise (ex: "Acme Corp")
4. Vous voyez directement les 3 premiers rapports sur la carte
5. Pour voir **tous** les rapports :
   - Cliquez sur "Voir détails"
   - Liste complète s'affiche
   - Cliquez sur le rapport souhaité

### Exemple 3 : Consulter rapidement un rapport

1. Vous voyez une carte avec un email intéressant
2. Les IDs de rapports sont affichés : `abc123...`, `def456...`
3. **Cliquez directement sur un ID**
4. Le rapport s'ouvre immédiatement !

## 🎨 Couleurs des cartes

Chaque type de donnée a sa couleur :

| Type          | Couleur     | Exemple             |
| ------------- | ----------- | ------------------- |
| 🏢 Entreprise | Bleu        | Acme Corporation    |
| 🌐 Plateforme | Violet      | LinkedIn            |
| 👤 Pseudo     | Rose        | @johndoe            |
| 👥 Nom        | Cyan        | John Doe            |
| 📱 Téléphone  | Vert        | +33 6 12 34 56 78   |
| 📧 Email      | Jaune       | contact@acme.com    |
| 📍 Adresse    | Rouge       | 123 Rue de Paris    |
| 🔗 URL        | Gris        | https://example.com |
| 💳 Compte     | Transparent | johndoe123          |

**→ La barre colorée à gauche de chaque carte indique le type !**

## ❓ Questions fréquentes

### Combien de rapports puis-je voir sur une carte ?

**Réponse** : Les 3 premiers rapports sont affichés directement sur la carte. S'il y en a plus, vous verrez "+X autre(s)". Cliquez sur "Voir détails" pour voir la liste complète.

### Comment voir TOUS les rapports d'une donnée ?

**Réponse** : Cliquez sur "Voir détails" ou sur la carte elle-même. Une fenêtre s'ouvre avec la liste complète (scrollable s'il y en a beaucoup).

### Puis-je ouvrir un rapport en un seul clic ?

**Réponse** : Oui ! Cliquez directement sur un des IDs affichés sur la carte (ex: `abc123...`). Vous serez redirigé immédiatement vers ce rapport.

### Comment fermer la fenêtre de détails ?

**Réponse** : 3 façons :

1. Cliquez sur le bouton "Fermer"
2. Cliquez sur le X en haut à droite
3. Cliquez en dehors de la fenêtre

### Je veux rechercher au lieu d'aller directement au rapport

**Réponse** : Cliquez sur le bouton **🔍 "Rechercher"** (dans la carte ou la modal). Vous serez redirigé vers la page de recherche avec le terme pré-rempli.

## 🆕 Différences avec l'ancien affichage

| Ancien (Tableau)               | Nouveau (Cartes)                    |
| ------------------------------ | ----------------------------------- |
| Tableau simple                 | Cartes visuelles colorées           |
| Tooltip pour voir IDs          | 3 premiers IDs directement visibles |
| Pas de navigation directe      | Clic sur ID → navigation directe    |
| Bouton "Rechercher" uniquement | "Voir détails" + "Rechercher"       |
| Vue limitée                    | Modal avec liste complète           |

## ✅ Avantages

- ✅ **Plus rapide** : Navigation en 1 clic vers un rapport
- ✅ **Plus visuel** : Cartes colorées par type
- ✅ **Plus complet** : Voir tous les rapports dans la modal
- ✅ **Plus pratique** : 3 premiers rapports visibles immédiatement
- ✅ **Plus cohérent** : Même interface que les entités

---

**Astuce** : Utilisez les filtres en haut (cartes de stats) pour afficher seulement un type de donnée (ex: uniquement les emails) !

**Besoin d'aide ?** Consultez la [documentation complète](FEATURE-EXTRACTED-DATA-DISPLAY.md)
