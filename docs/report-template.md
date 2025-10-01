# Modèle de rapport OSINT

> **Source** : inspiration tirée d’un exemple fourni (données personnelles supprimées immédiatement après analyse). Ce document ne contient que des structures et libellés génériques.

## Vue d’ensemble du rapport

- **En-tête institutionnel**
  - Logo(s) police + intitulé du service `PJF Bruxelles – DRS – Data Management & Analysis`
  - Titre principal : `Rapport OSINT`
  - Sous-titre : `Dossier « {reference_dossier} » – Rapport n° {numero_rapport}`
- **Bloc d’introduction**
  - Paragraphe de contexte référant au dossier et à la demande OSINT.
  - Date d’émission du rapport.

## Sections fonctionnelles

### 1. Résumé des faits
- Bloc de texte riche décrivant les éléments recueillis par les enquêteurs.
- Possibilité de listes à puces pour les compléments d’information.

### 2. Entités concernées
- Liste structurée des personnes/organisations/identifiants.
- Chaque entrée : nom, identifiant (RRN, alias, etc.), type.

### 3. Objectifs de la recherche OSINT
- Liste à puces d’objectifs opérationnels.

### 4. Résumé des recherches et des résultats
- Bloc texte + puces décrivant les résultats globaux.
- Sous-liste pour les éléments non trouvés.
- Note méthodologique (ex. avertissement sur la volumétrie d’Internet).

### 5. Modules de recherche détaillée
Chaque module couvre une entité, un identifiant ou une plateforme.

- **Types identifiés** :
  - `entity_overview` – ex. « Recherches concernant le nommé {Entité} ».
  - `identifier_lookup` – ex. numéro de téléphone, alias, username.
  - `platform_analysis` – ex. Facebook, Instagram, X, WhatsApp, etc.
  - `media_gallery` – collection d’images avec légendes.
- **Structure commune** :
  - `title` (texte)
  - `context` (texte riche)
  - `findings` (liste d’items)
    - item = `{label, description, confidence?, sources[]}`
  - `attachments` (références vers médias ou documents)
  - `relatedEntities` (IDs d’entités du dossier)

### 6. Données sauvegardées
- Liste d’ensembles de données archivées (connexions, groupes, abonnements…)
- Chaque item : `label`, `description`, `retention_policy`.

### 7. Conclusions
- Liste de conclusions opérationnelles (statements).

### 8. Possibilités d’enquête
- Liste de pistes d’investigation (requisitions, plateformes à solliciter, données visées).
- Peut inclure sous-listes détaillant l’article de loi ou le type de données.

### 9. Sign-off
- Bloc texte avec la date, le rédacteur (nom, grade, unité) et un bandeau visuel éventuel.

## Données à modéliser

| Domaine | Description | Représentation proposée |
| --- | --- | --- |
| Métadonnées rapport | Titre, numéro de dossier, numéro de rapport, service demandeur, période de recherche, statut | Table `Report` (colonnes dédiées) |
| Entités | Personnes/organisations/alias liés | Table `Entity` (type + liens) |
| Modules | Sections dynamiques du rapport | Table `ReportModule` (type, position, payload JSONB) |
| Résultats détaillés | Résultats structurés d’une recherche | Table `ResearchRecord` + champs `payload` |
| Annexes médias | Images, captures d’écran, documents | Table `ReportAttachment` (référence de stockage chiffrée, moduleId facultatif) |
| Traçabilité | Historique versions & audit | Tables `ReportVersion`, `AuditLog` existantes |

### Schéma JSON type pour `ReportModule.payload`

```json
{
  "context": "texte riche (markdown ou html restreint)",
  "findings": [
    {
      "label": "Profil Facebook",
      "description": "Profil lié au numéro …",
      "confidence": "probable",
      "sources": [
        {
          "type": "url",
          "value": "https://…",
          "note": "Publication du 30/12/2021"
        }
      ],
      "attachments": ["att-uuid-1", "att-uuid-2"]
    }
  ],
  "notes": "Observations complémentaires"
}
```

## Contraintes de sécurité

- Les captures d’écran, liens et autres données sensibles doivent être chiffrés au repos (via `VaultItem`).
- Les pièces jointes seront stockées dans un bucket chiffré (clé AES dédiée) avec références indirectes en base.
- Possibilité d’expurger automatiquement certains modules après export PDF définitif.

## Génération PDF

- Chaque section correspond à un composant de template :
  - `report-header`
  - `section-summary`
  - `section-entities`
  - `section-objectives`
  - `section-research`
  - `section-gallery`
  - `section-conclusions`
  - `section-investigation`
  - `signature-block`
- Gestion des images : intégration en base64 temporaire (jamais persistée hors stockage sécurisé).

## Prochaines étapes (backend)

1. Mettre à jour le schéma Prisma pour introduire `ReportAttachment` et renforcer `ReportModule`.
2. Définir des schémas Zod pour la création/édition de rapport et modules.
3. Implémenter les endpoints REST :
   - `POST /reports`
   - `GET /reports`, `GET /reports/:id`
   - `PUT/PATCH /reports/:id`
   - Gestion des modules (`POST /reports/:id/modules`, etc.)
   - Upload d’attachements (pré-signed URL / stockage sécurisé)
4. Préparer un service de génération PDF (stub dans un premier temps).

Ce canevas servira d’assise aux développements backend et frontend tout en respectant les exigences opérationnelles observées.
