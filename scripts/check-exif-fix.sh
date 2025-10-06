#!/bin/bash

# Script de vérification rapide - Fix EXIF exifr
# Date: 6 octobre 2025

echo "🔍 Vérification du fix EXIF avec exifr"
echo "========================================"
echo ""

# 1. Vérifier l'installation d'exifr
echo "1️⃣ Vérification de l'installation d'exifr..."
cd /workspaces/OSINTReport/backend
if npm list exifr | grep -q "exifr@"; then
    echo "   ✅ exifr installé : $(npm list exifr | grep exifr@)"
else
    echo "   ❌ exifr NON installé"
    echo "   → Exécuter: npm install exifr"
    exit 1
fi
echo ""

# 2. Vérifier que exif-parser n'est plus là
echo "2️⃣ Vérification de la suppression d'exif-parser..."
if npm list exif-parser 2>&1 | grep -q "empty"; then
    echo "   ✅ exif-parser bien supprimé"
else
    echo "   ⚠️  exif-parser encore présent"
    echo "   → Exécuter: npm uninstall exif-parser"
fi
echo ""

# 3. Vérifier les erreurs TypeScript
echo "3️⃣ Vérification des erreurs TypeScript..."
if npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then
    echo "   ❌ Erreurs TypeScript détectées"
    npx tsc --noEmit --skipLibCheck | head -20
else
    echo "   ✅ Aucune erreur TypeScript"
fi
echo ""

# 4. Vérifier le code source
echo "4️⃣ Vérification du code source..."
if grep -q "import exifr from 'exifr'" src/modules/media/media.service.ts; then
    echo "   ✅ Import exifr présent"
else
    echo "   ❌ Import exifr MANQUANT"
fi

if grep -q "exifr.parse" src/modules/media/media.service.ts; then
    echo "   ✅ Appel exifr.parse() présent"
else
    echo "   ❌ Appel exifr.parse() MANQUANT"
fi

if grep -q "limitInputPixels: 100000000" src/modules/media/media.service.ts; then
    echo "   ✅ Limite Sharp augmentée (100MP)"
else
    echo "   ⚠️  Limite Sharp non augmentée"
fi
echo ""

# 5. Vérifier les services Docker
echo "5️⃣ Vérification des services Docker..."
cd /workspaces/OSINTReport
if docker-compose ps | grep -q "postgres.*Up"; then
    echo "   ✅ PostgreSQL en cours d'exécution"
else
    echo "   ⚠️  PostgreSQL arrêté"
    echo "   → Exécuter: docker-compose up -d"
fi

if docker-compose ps | grep -q "meilisearch"; then
    echo "   ✅ Meilisearch en cours d'exécution"
else
    echo "   ⚠️  Meilisearch arrêté"
fi
echo ""

# 6. Vérifier le backend
echo "6️⃣ Vérification du backend..."
if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:4000/api/health)
    if echo "$HEALTH" | grep -q "ok"; then
        echo "   ✅ Backend opérationnel"
    else
        echo "   ⚠️  Backend répond mais état inconnu: $HEALTH"
    fi
else
    echo "   ❌ Backend inaccessible (http://localhost:4000)"
    echo "   → Exécuter: cd backend && npm run dev"
fi
echo ""

# 7. Vérifier le dossier uploads
echo "7️⃣ Vérification du dossier uploads..."
UPLOAD_DIR="/workspaces/OSINTReport/backend/uploads/screenshots"
if [ -d "$UPLOAD_DIR" ]; then
    echo "   ✅ Dossier uploads/screenshots existe"
    COUNT=$(ls -1 "$UPLOAD_DIR"/*.webp 2>/dev/null | wc -l)
    echo "   📊 Nombre d'images: $COUNT"
    
    # Vérifier si certaines ont du GPS
    GPS_COUNT=0
    for meta in "$UPLOAD_DIR"/*.meta.json 2>/dev/null; do
        if [ -f "$meta" ] && grep -q "gpsLatitude" "$meta"; then
            ((GPS_COUNT++))
        fi
    done
    echo "   📍 Images avec GPS: $GPS_COUNT"
else
    echo "   ⚠️  Dossier uploads/screenshots n'existe pas"
fi
echo ""

# Résumé final
echo "========================================"
echo "📊 RÉSUMÉ"
echo "========================================"
echo ""

# Compteur de checks
CHECKS_OK=0
CHECKS_TOTAL=7

if npm list exifr | grep -q "exifr@"; then ((CHECKS_OK++)); fi
if ! npm list exif-parser 2>&1 | grep -q "exif-parser@"; then ((CHECKS_OK++)); fi
if ! npx tsc --noEmit --skipLibCheck 2>&1 | grep -q "error TS"; then ((CHECKS_OK++)); fi
if grep -q "import exifr from 'exifr'" backend/src/modules/media/media.service.ts; then ((CHECKS_OK++)); fi
if docker-compose ps | grep -q "postgres.*Up"; then ((CHECKS_OK++)); fi
if curl -s http://localhost:4000/api/health 2>&1 | grep -q "ok"; then ((CHECKS_OK++)); fi
if [ -d "$UPLOAD_DIR" ]; then ((CHECKS_OK++)); fi

echo "Checks réussis: $CHECKS_OK / $CHECKS_TOTAL"
echo ""

if [ $CHECKS_OK -eq $CHECKS_TOTAL ]; then
    echo "✅ TOUT EST PRÊT POUR LES TESTS !"
    echo ""
    echo "Prochaine étape:"
    echo "1. Uploader une image Xiaomi/Google Photos avec GPS"
    echo "2. Vérifier les logs backend pour voir l'extraction GPS"
    echo "3. Confirmer l'affichage du badge 📍 et de la carte"
    echo ""
    echo "Voir: docs/TEST-UPLOAD-XIAOMI.md"
elif [ $CHECKS_OK -ge 5 ]; then
    echo "⚠️  PRESQUE PRÊT (quelques warnings à corriger)"
else
    echo "❌ CORRECTIONS NÉCESSAIRES"
    echo ""
    echo "Actions requises:"
    echo "1. Installer exifr: cd backend && npm install exifr"
    echo "2. Démarrer services: docker-compose up -d"
    echo "3. Démarrer backend: cd backend && npm run dev"
fi

echo ""
echo "========================================"
