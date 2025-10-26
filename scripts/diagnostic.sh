#!/bin/bash

echo "🔍 Diagnostic de l'environnement OSINTReport"
echo "============================================="
echo ""

# Vérifier les ports
echo "📡 Vérification des services actifs..."
echo ""

if ss -tlnp | grep -q ':4000'; then
    echo "✅ Backend actif sur le port 4000"
else
    echo "❌ Backend NON actif sur le port 4000"
fi

if ss -tlnp | grep -q ':5173'; then
    echo "✅ Frontend Vite actif sur le port 5173 (DEV)"
else
    echo "❌ Frontend Vite NON actif sur le port 5173"
fi

if ss -tlnp | grep -q ':8080'; then
    echo "⚠️  Nginx actif sur le port 8080 (PROD)"
else
    echo "ℹ️  Nginx non actif sur le port 8080"
fi

echo ""
echo "============================================="
echo "🌐 URLs à utiliser pour le développement :"
echo "============================================="
echo ""
echo "Frontend (avec proxy Vite) : http://localhost:5173"
echo "Backend API direct         : http://localhost:4000/api"
echo ""
echo "⚠️  IMPORTANT :"
echo "Pour que le proxy Vite fonctionne et que la signature"
echo "s'enregistre correctement, utilisez :"
echo ""
echo "   👉 http://localhost:5173"
echo ""
echo "Et PAS http://localhost:8080 (version Nginx sans proxy)"
echo ""

# Vérifier la configuration frontend
echo "============================================="
echo "📝 Configuration Frontend"
echo "============================================="
echo ""

if [ -f "/workspaces/OSINTReport/frontend/.env" ]; then
    echo "Contenu de frontend/.env :"
    cat /workspaces/OSINTReport/frontend/.env
else
    echo "❌ Fichier .env introuvable"
fi

echo ""
echo "vite.config.ts proxy configuration :"
echo "- /api -> http://localhost:4000"
echo "- /uploads -> http://localhost:4000"
echo ""

# Vérifier le backend
echo "============================================="
echo "🔧 Backend"
echo "============================================="
echo ""

if ps aux | grep -q '[t]s-node-dev.*server.ts'; then
    PID=$(ps aux | grep '[t]s-node-dev.*server.ts' | awk '{print $2}')
    echo "✅ Backend actif (PID: $PID)"
    echo "Commande : $(ps -p $PID -o command=)"
else
    echo "❌ Backend non actif"
fi

echo ""
echo "============================================="
echo "🧪 Test de connectivité"
echo "============================================="
echo ""

echo "Test API Backend (health check) :"
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    echo "✅ Backend API répond"
else
    echo "⚠️  Backend API ne répond pas sur /api/health"
fi

echo ""
echo "Test Frontend (dev server) :"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend Vite répond"
else
    echo "❌ Frontend Vite ne répond pas"
fi

echo ""
echo "============================================="
echo "📋 Checklist pour tester la signature"
echo "============================================="
echo ""
echo "1. ✅ Ouvrir http://localhost:5173 dans le navigateur"
echo "2. ✅ Ouvrir les DevTools (F12)"
echo "3. ✅ Aller dans l'onglet Console"
echo "4. ✅ Se connecter si nécessaire"
echo "5. ✅ Aller sur la page Profil"
echo "6. ✅ Cliquer sur 'Ajouter une signature'"
echo "7. ✅ Dessiner dans le canvas"
echo "8. ✅ Vérifier les logs console '🎨 Start drawing'"
echo "9. ✅ Cliquer sur 'Enregistrer'"
echo "10. ✅ Vérifier les logs console '🖊️ SignaturePad'"
echo ""

echo "============================================="
echo "🚀 Commandes utiles"
echo "============================================="
echo ""
echo "Redémarrer le projet complet :"
echo "  cd /workspaces/OSINTReport && npm run dev"
echo ""
echo "Redémarrer uniquement le frontend :"
echo "  cd /workspaces/OSINTReport/frontend && npm run dev"
echo ""
echo "Redémarrer uniquement le backend :"
echo "  cd /workspaces/OSINTReport/backend && npm run dev"
echo ""
echo "Voir les logs backend :"
echo "  docker-compose logs backend -f"
echo ""

echo "✨ Diagnostic terminé !"
