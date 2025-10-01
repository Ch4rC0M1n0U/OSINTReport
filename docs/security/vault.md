# Coffre applicatif & chiffrement des données sensibles

## Objectif

Le coffre logiciel protège toutes les références sensibles (clés de stockage, données OSINT confidentielles) en les chiffrant côté serveur avant de les persister dans PostgreSQL. Seuls des pointeurs opaques sont stockés dans les tables métier (`ReportAttachment`, `ResearchRecord`, etc.).

## Architecture

```mermaid
document
    title Vault applicatif OSINTReport
    section Flux de chiffrement
      Utilisateur --> API: payload (storageKey, données sensibles)
      API --> VaultService: demande de stockage chiffré
      VaultService --> KeyStoreService: clé symétrique active ?
      KeyStoreService --> KeyStore: lecture clé chiffrée
      KeyStore --> KeyStoreService: clé chiffrée
      KeyStoreService --> CryptoEngine: déchiffrement (master key)
      CryptoEngine --> KeyStoreService: clé de données (32 o)
      VaultService --> CryptoEngine: chiffrer la valeur (AES-256-GCM)
      CryptoEngine --> VaultService: {iv, authTag, cipherText}
      VaultService --> VaultItem: enregistre {cipherText, keyId}
      VaultItem --> VaultService: id
      VaultService --> API: pointeur vault:{id}
      API --> Base métier: stocke le pointeur au lieu de la valeur
```

### Composants

| Composant | Chemin | Rôle |
| --- | --- | --- |
| `CryptoEngine` | `backend/src/shared/crypto.ts` | Chiffrement/déchiffrement AES-256-GCM, sérialisation d’enveloppes. |
| `KeyStoreService` | `backend/src/modules/security/key-store.service.ts` | Gestion des clés de données chiffrées par la clé maître (environnement). Rotation et cache mémoire. |
| `VaultService` | `backend/src/modules/security/vault.service.ts` | API haut niveau pour écrire/lire/supprimer des secrets chiffrés (`VaultItem`). |
| Prisma `KeyStore` | `backend/prisma/schema.prisma` | Table stockant les clés de données chiffrées (clé active + historiques). |
| Prisma `VaultItem` | idem | Référence chiffrée (pointeur) vers une donnée sensible. |

## Clé maître

- Fourni via `CRYPTO_MASTER_KEY` (hex 64 caractères → 32 octets).
- Doit être conservé dans un gestionnaire de secrets (Vault/KMS) en production.
- Changer la clé nécessite de ré-chiffrer toutes les entrées (fonctionnalité future). La rotation actuelle ne régénère que les clés de données.

## Rotation des clés

1. `KeyStoreService.rotateActiveKey()` crée une nouvelle clé de données aléatoire (`CryptoEngine.generateDataKey()`), la chiffre avec la clé maître et l’active.
2. Les anciennes clés sont marquées `active=false` mais conservées pour déchiffrer l’historique.
3. Les nouveaux secrets utilisent automatiquement la clé active.

## Utilisation dans les rapports

- Lors de `POST /reports/:id/attachments`, la `storageKey` reçue est chiffrée, remplacée par `vault:{id}` dans `ReportAttachment.storageKey`, et le service renvoie la valeur réelle au client.
- `ReportService.getReport` et les réponses d’enregistrement utilisent `VaultService.revealString` pour restituer la valeur en clair au moment de la réponse JSON.
- La suppression d’un module supprime également les `VaultItem` associés à ses pièces jointes.

## Bonnes pratiques & futur

- Ajouter des jobs planifiés pour purger automatiquement les secrets arrivés à expiration (`VaultItem.expiresAt`).
- Monitorer le nombre de secrets stockés et les rotations réalisées (logs et métriques).
- Prévoir une commande d’urgence pour révoquer la clé maître → impliquer une régénération complète des données sensibles.
- Étendre l’usage du coffre aux champs `ResearchRecord.sensitiveDataRef` et autres payloads sensibles.
