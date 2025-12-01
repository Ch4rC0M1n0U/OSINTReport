# 🐘 Import Elephantastic

## Vue d'ensemble

Cette fonctionnalité permet d'importer des données exportées depuis **Elephantastic** directement dans les modules d'analyse de plateformes d'OSINTReport.

## Utilisation

### 1. Accéder à l'import

1. Ouvrez un rapport existant ou créez-en un nouveau
2. Ajoutez ou sélectionnez un module **"Analyse de plateformes"**
3. Cliquez sur le bouton **📥 Import**
4. Sélectionnez **🐘 Elephantastic** dans le menu

### 2. Importer les données

Vous pouvez importer de deux manières :

#### Option A : Coller le JSON

1. Copiez le contenu JSON depuis Elephantastic
2. Collez-le dans la zone de texte
3. Les enregistrements seront automatiquement détectés

#### Option B : Importer un fichier

1. Cliquez sur l'onglet "📁 Importer un fichier"
2. Sélectionnez votre fichier `.json` ou `.jsonl`
3. Les enregistrements seront chargés automatiquement

### 3. Sélectionner et importer

1. Vérifiez l'aperçu des données dans le tableau
2. Cochez/décochez les enregistrements à importer
3. Activez "Ignorer les doublons" si nécessaire
4. Cliquez sur **📥 Importer X profil(s)**

## Format JSON supporté

Elephantastic exporte au format **JSONL** (JSON Lines) - un objet JSON par ligne.

### Structure d'un enregistrement

```json
{
  "schema": "UserAccount",
  "collection": "Snapchat",
  "label": "Angeles Andino",
  "created_at": "2025-11-20 14:09:59",
  "identifiers": [
    "snapchatid:e9933284-b001-44af-aa25-3f99d5c2bd37",
    "snapchat:angelesandino25"
  ],
  "phones": ["+13038473150"],
  "emails": [],
  "names": ["Angeles Andino"],
  "usernames": ["angelesandino25"],
  "countries": ["us"],
  "urls": [],
  "original": {
    "user_id": "e9933284-b001-44af-aa25-3f99d5c2bd37",
    "username": "angelesandino25",
    "display_name": "Angeles Andino",
    "bitmoji_avatar_id": "104304386352_1-s5",
    "bitmoji_selfie_id": "10226021"
  }
}
```

## Plateformes supportées

### Réseaux sociaux

| Plateforme | Collection     | Identifiants extraits                          |
| ---------- | -------------- | ---------------------------------------------- |
| Snapchat   | `Snapchat`     | `snapId`, `bitmojiAvatarId`, `bitmojiSelfieId` |
| Google     | `Google`       | `gaiaId`, `personId`                           |
| Facebook   | `Facebook`     | `facebookUid`                                  |
| Instagram  | `Instagram`    | `instagramPk`                                  |
| Twitter/X  | `Twitter`, `X` | `twitterId`                                    |
| LinkedIn   | `LinkedIn`     | `urnId`, `publicId`                            |
| Telegram   | `Telegram`     | `telegramId`                                   |
| TikTok     | `TikTok`       | -                                              |
| WhatsApp   | `WhatsApp`     | `status`, `statusSetAt`, `exists`              |
| Discord    | `Discord`      | -                                              |
| Reddit     | `Reddit`       | -                                              |
| YouTube    | `YouTube`      | -                                              |

### Téléphonie / HLR

| Collection  | Données extraites                                                                         |
| ----------- | ----------------------------------------------------------------------------------------- |
| `HLRLookup` | `liveStatus`, `lineType`, `operator`, `country`, `mccMnc`, `isPorted`, `verificationDate` |

### CallerID

| Collection   | Données extraites                        |
| ------------ | ---------------------------------------- |
| `Eyecon`     | `callerName`, `callerPicture`, `country` |
| `CallApp`    | `callerName`, `country`                  |
| `TrueCaller` | `callerName`, `country`                  |
| `Sync.me`    | `callerName`, `country`                  |
| `Hiya`       | `callerName`, `country`                  |
| `GetContact` | `callerName`, `country`                  |

### Fuites de données (Breaches)

| Collection       | Données extraites                |
| ---------------- | -------------------------------- |
| `NetEase (2015)` | `email`, `password`, `hostnames` |
| `LinkedIn Leak`  | `email`, `password`, `hash`      |
| `Adobe Leak`     | `email`, `password`, `hash`      |
| `HaveIBeenPwned` | `email`, `password`, `hash`      |

## Données extraites

Pour chaque enregistrement importé, les données suivantes sont automatiquement extraites et structurées :

### Informations de base

- **Label** : Nom du profil
- **Usernames** : Pseudonymes associés
- **Téléphones** : Numéros de téléphone
- **Emails** : Adresses email
- **Pays** : Pays associés

### Identifiants spécifiques par plateforme

#### Snapchat

- **Snap ID** : UUID unique du compte (`user_id`)
- **Bitmoji Avatar ID** : ID de l'avatar Bitmoji
- **Bitmoji Selfie ID** : ID du selfie Bitmoji
- **Tier** : Niveau du compte

#### Google

- **GAIA ID** : Google Account ID
- **Person ID** : ID de la personne
- **Type de compte** : GOOGLE_USER, etc.

#### Facebook

- **Facebook UID** : Identifiant unique
- **Genre, Date de naissance, Localisation**, etc.

#### Instagram

- **Instagram PK** : Primary Key du compte
- **Compte vérifié/privé**
- **Nombre de publications**

#### HLR Lookup

- **Statut de la ligne** : LIVE (🟢), DEAD (🔴), UNKNOWN (⚪)
- **Type de ligne** : MOBILE, LANDLINE, VOIP
- **Opérateur actuel** : T-Mobile, Orange, SFR, etc.
- **Pays** : Pays associé au numéro
- **MCC/MNC** : Mobile Country Code / Network Code
- **Numéro porté** : Indique si le numéro a été transféré
- **Date de vérification** : Horodatage de la vérification HLR

#### CallerID (Eyecon, CallApp, etc.)

- **Nom identifié** : Nom affiché par l'application CallerID
- **Photo de profil** : Image associée au numéro
- **Pays** : Pays du numéro
- **Source** : Application d'origine (Eyecon, CallApp, TrueCaller...)

#### Breaches / Fuites de données

- **Email compromis** : Adresse email trouvée dans la fuite
- **Mot de passe exposé** : Mot de passe en clair ou hashé
- **Hash** : Hash du mot de passe (MD5, SHA1, bcrypt...)
- **Domaines** : Domaines associés à l'email

### Métadonnées

Toutes les données brutes sont stockées dans les métadonnées du Finding pour référence ultérieure :

- `elephantasticImport: true`
- `elephantasticSchema`: Type de schéma
- `elephantasticCollection`: Plateforme source
- `identifiers`: Liste complète des identifiants

## Niveau de confiance

Les données importées depuis Elephantastic sont automatiquement marquées avec un niveau de confiance **"Confirmé"** car elles proviennent d'une extraction directe.

## Futures sources d'import

Le système est conçu pour supporter d'autres sources OSINT :

- 🔍 **Maltego** (à venir)
- 🕷️ **SpiderFoot** (à venir)
- 🔎 **Shodan** (à venir)
- 📊 **Censys** (à venir)

## Développement

### Ajouter une nouvelle source d'import

1. Créer un nouveau service dans `/frontend/src/services/import/`
2. Implémenter les fonctions de parsing et conversion vers `Finding`
3. Créer un modal d'import dans `/frontend/src/components/import/`
4. Ajouter l'entrée dans le menu dropdown du module PlatformAnalysis

### Structure du service

```typescript
// services/import/nouvelle-source.ts

export interface NouvelleSourceRecord {
  // Structure des données
}

export function parseNouvelleSourceFile(
  content: string
): NouvelleSourceRecord[] {
  // Parser le contenu
}

export function convertNouvelleSourceToFinding(
  record: NouvelleSourceRecord
): Finding {
  // Convertir en Finding
}
```
