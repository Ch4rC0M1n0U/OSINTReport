#!/bin/bash

# Script pour mettre à jour les URLs dans le fichier .env selon l'environnement

ENV_FILE="${1:-.env}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_PATH="$ROOT_DIR/$ENV_FILE"

echo "🔍 Détection de l'environnement..."

# Vérifier si nous sommes dans GitHub Codespaces
if [ -n "$CODESPACE_NAME" ] && [ -n "$GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN" ]; then
    echo "✅ Environnement détecté : GitHub Codespaces"
    FRONTEND_URL="https://${CODESPACE_NAME}-5173.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    BACKEND_URL="https://${CODESPACE_NAME}-4000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo "   Frontend : $FRONTEND_URL"
    echo "   Backend  : $BACKEND_URL"
else
    echo "ℹ️  Environnement détecté : Local"
    FRONTEND_URL="http://localhost:5173"
    BACKEND_URL="http://localhost:4000"
    echo "   Frontend : $FRONTEND_URL"
    echo "   Backend  : $BACKEND_URL"
fi

# Vérifier si le fichier .env existe
if [ ! -f "$ENV_PATH" ]; then
    echo ""
    echo "⚠️  Le fichier $ENV_FILE n'existe pas."
    echo "📝 Création du fichier à partir de .env.example..."
    
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ENV_PATH"
        echo "✅ Fichier $ENV_FILE créé"
    else
        echo "❌ Erreur : .env.example introuvable"
        exit 1
    fi
fi

echo ""
echo "🔧 Mise à jour de $ENV_FILE..."

# Fonction pour mettre à jour ou ajouter une variable
update_or_add_var() {
    local var_name=$1
    local var_value=$2
    local file=$3
    
    if grep -q "^${var_name}=" "$file"; then
        # La variable existe déjà, on la met à jour
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^${var_name}=.*|${var_name}=${var_value}|" "$file"
        else
            # Linux
            sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" "$file"
        fi
        echo "   ✓ ${var_name} mise à jour"
    elif grep -q "^#${var_name}=" "$file"; then
        # La variable est commentée, on la décommente et met à jour
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^#${var_name}=.*|${var_name}=${var_value}|" "$file"
        else
            sed -i "s|^#${var_name}=.*|${var_name}=${var_value}|" "$file"
        fi
        echo "   ✓ ${var_name} décommentée et mise à jour"
    else
        # La variable n'existe pas, on l'ajoute
        echo "" >> "$file"
        echo "${var_name}=${var_value}" >> "$file"
        echo "   ✓ ${var_name} ajoutée"
    fi
}

# Mettre à jour les URLs
update_or_add_var "FRONTEND_URL" "$FRONTEND_URL" "$ENV_PATH"
update_or_add_var "BACKEND_URL" "$BACKEND_URL" "$ENV_PATH"

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📋 URLs configurées :"
echo "   FRONTEND_URL=$FRONTEND_URL"
echo "   BACKEND_URL=$BACKEND_URL"
echo ""
echo "⚠️  N'oubliez pas de redémarrer l'application pour appliquer les changements :"
echo "   npm run dev"
