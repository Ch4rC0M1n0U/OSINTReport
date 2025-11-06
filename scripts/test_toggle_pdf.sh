#!/bin/bash

# Script de test pour le toggle includeInPdf

cd /workspaces/OSINTReport/backend

echo "=== Régénération du client Prisma ==="
npx prisma generate

echo ""
echo "=== Redémarrage du serveur backend ==="
echo "Le serveur devrait se redémarrer automatiquement avec ts-node-dev"
echo "Attendez quelques secondes avant de tester dans le frontend"
