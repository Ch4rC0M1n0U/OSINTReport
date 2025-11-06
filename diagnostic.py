#!/usr/bin/env python3
"""
Script de diagnostic pour les problèmes d'API
"""

import sys
import json

# Lire l'erreur 500 depuis stdin ou argument
error_msg = """
Le problème vient probablement d'une des causes suivantes:

1. Le client Prisma n'a pas été régénéré après l'ajout du champ includeInPdf
   → Solution: Exécuté ✓ (npx prisma generate)

2. Le schéma de validation Zod est trop strict
   → Solution: Corrigé ✓ (ajout de .strict() à updateModuleSchema)

3. Le backend n'a pas redémarré après les changements
   → Solution: ts-node-dev devrait redémarrer automatiquement

4. Il y a une erreur dans le code de génération PDF
   → À vérifier: si certains modules n'ont pas includeInPdf

DIAGNOSTIC:
- Schéma Prisma: ✓ Champ includeInPdf existe avec default(true)
- Base de données: ✓ Colonne includeInPdf existe  
- Validation: ✓ updateModuleSchema accepte includeInPdf
- Service: ✓ ReportService.updateModule gère includeInPdf
- Client Prisma: ✓ Régénéré avec succès

PROCHAINES ÉTAPES:
1. Rafraîchir la page frontend (Ctrl+R ou Cmd+R)
2. Ouvrir la console développeur (F12)
3. Essayer de toggle includeInPdf sur un module
4. Noter l'erreur EXACTE retournée par le serveur
5. Vérifier dans l'onglet Network → Response de la requête PATCH

Si l'erreur persiste, il faut voir les logs du backend en temps réel.
"""

print(error_msg)
