#!/bin/bash

# Script de génération de secrets pour le déploiement OSINTReport
# Usage: ./scripts/generate-secrets.sh

echo "🔐 Génération des secrets pour le déploiement OSINTReport"
echo "=========================================================="
echo ""

echo "📝 Copiez ces valeurs dans votre fichier .env de production :"
echo ""

echo "# Base de données"
echo "POSTGRES_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")"
echo ""

echo "# JWT & Sessions"
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo "COOKIE_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo ""

echo "# Meilisearch"
echo "MEILI_MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")"
echo ""

echo "# Mot de passe admin (à personnaliser)"
echo "ADMIN_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(12).toString('base64'))")"
echo ""

echo "=========================================================="
echo "✅ Secrets générés avec succès !"
echo ""
echo "⚠️  IMPORTANT :"
echo "   - Conservez ces valeurs en lieu sûr"
echo "   - Ne les committez jamais dans Git"
echo "   - Changez le mot de passe admin après la première connexion"
echo ""
