#!/bin/bash
# Script d'installation des dépendances Chrome pour Puppeteer
# À exécuter lors du setup initial du projet en environnement Docker/Codespaces

set -e

echo "🔧 Installation des dépendances Chrome pour Puppeteer..."

# Mise à jour des packages
echo "📦 Mise à jour apt..."
sudo apt-get update -qq

# Installation des bibliothèques système requises par Chrome
echo "📚 Installation des bibliothèques système..."
sudo apt-get install -y -qq \
  libnss3 \
  libatk1.0-0t64 \
  libatk-bridge2.0-0t64 \
  libcups2t64 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2t64 \
  libpango-1.0-0 \
  libcairo2 \
  libx11-xcb1 \
  libxcb-dri3-0 \
  libxshmfence1 \
  libxi6 \
  libxtst6

# Installation de Chrome via Puppeteer
echo "🌐 Installation de Chrome via Puppeteer..."
cd "$(dirname "$0")/../backend"
npx puppeteer browsers install chrome

# Vérification
echo "✅ Vérification de l'installation..."
CHROME_PATH="/home/codespace/.cache/puppeteer/chrome"
if [ -d "$CHROME_PATH" ]; then
  CHROME_VERSION=$(ls -d $CHROME_PATH/linux-* | head -1 | xargs basename)
  echo "✅ Chrome installé: $CHROME_VERSION"
else
  echo "❌ Erreur: Chrome non trouvé dans $CHROME_PATH"
  exit 1
fi

echo ""
echo "🎉 Installation terminée avec succès!"
echo "📄 Vous pouvez maintenant exporter des PDFs via Puppeteer"
echo ""
echo "Pour tester:"
echo "  cd backend"
echo "  npx ts-node --require tsconfig-paths/register test-pdf-generation.ts"
