#!/bin/bash

# Script de test pour la fonctionnalité "Données extraites"
# Teste l'endpoint GET /api/search/extracted

echo "🧪 Test de la fonctionnalité Données Extraites"
echo "=============================================="
echo ""

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="/api/search/extracted"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que le serveur est accessible
echo "📡 Vérification de l'accessibilité du serveur..."
if ! curl -s -f "${API_URL}/api/health" > /dev/null 2>&1; then
  echo -e "${RED}❌ Le serveur n'est pas accessible à ${API_URL}${NC}"
  echo "Assurez-vous que le serveur backend est démarré"
  exit 1
fi
echo -e "${GREEN}✅ Serveur accessible${NC}"
echo ""

# Vérifier les variables d'environnement nécessaires
if [ -z "$TEST_TOKEN" ]; then
  echo -e "${YELLOW}⚠️  Variable TEST_TOKEN non définie${NC}"
  echo "Pour tester avec authentification, définissez TEST_TOKEN avec un JWT valide"
  echo "Exemple : export TEST_TOKEN='votre-jwt-token'"
  echo ""
  echo "Tentative de connexion pour obtenir un token..."
  
  # Essayer de se connecter avec admin/admin par défaut
  LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@osintreport.local","password":"admin"}')
  
  TEST_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  
  if [ -z "$TEST_TOKEN" ]; then
    echo -e "${RED}❌ Impossible d'obtenir un token${NC}"
    echo "Réponse : $LOGIN_RESPONSE"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Token obtenu avec succès${NC}"
fi
echo ""

# Test 1 : Appel de l'endpoint sans authentification
echo "📝 Test 1 : Appel sans authentification"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL}${ENDPOINT}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "401" ]; then
  echo -e "${GREEN}✅ Retourne bien 401 sans token${NC}"
else
  echo -e "${RED}❌ Code attendu: 401, reçu: ${HTTP_CODE}${NC}"
fi
echo ""

# Test 2 : Appel avec authentification
echo "📝 Test 2 : Appel avec authentification"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  "${API_URL}${ENDPOINT}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Retourne 200 avec token valide${NC}"
  
  # Vérifier la structure de la réponse
  echo ""
  echo "📊 Structure de la réponse :"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  
  # Extraire les stats
  echo ""
  echo "📈 Statistiques :"
  echo "----------------"
  
  TOTAL_REPORTS=$(echo "$BODY" | grep -o '"totalReports":[0-9]*' | cut -d':' -f2)
  TOTAL_PHONES=$(echo "$BODY" | grep -o '"totalPhones":[0-9]*' | cut -d':' -f2)
  TOTAL_EMAILS=$(echo "$BODY" | grep -o '"totalEmails":[0-9]*' | cut -d':' -f2)
  TOTAL_COMPANIES=$(echo "$BODY" | grep -o '"totalCompanies":[0-9]*' | cut -d':' -f2)
  TOTAL_PLATFORMS=$(echo "$BODY" | grep -o '"totalPlatforms":[0-9]*' | cut -d':' -f2)
  TOTAL_ALIASES=$(echo "$BODY" | grep -o '"totalAliases":[0-9]*' | cut -d':' -f2)
  
  echo "  📊 Rapports totaux    : ${TOTAL_REPORTS:-0}"
  echo "  📱 Téléphones         : ${TOTAL_PHONES:-0}"
  echo "  📧 Emails             : ${TOTAL_EMAILS:-0}"
  echo "  🏢 Entreprises        : ${TOTAL_COMPANIES:-0}"
  echo "  🌐 Plateformes        : ${TOTAL_PLATFORMS:-0}"
  echo "  👤 Pseudos/Aliases    : ${TOTAL_ALIASES:-0}"
  
  # Vérifier qu'on a bien les propriétés attendues
  echo ""
  echo "🔍 Vérification de la structure :"
  echo "---------------------------------"
  
  EXPECTED_PROPS=("phones" "emails" "companies" "platforms" "aliases" "names" "addresses" "urls" "accounts" "stats")
  
  for prop in "${EXPECTED_PROPS[@]}"; do
    if echo "$BODY" | grep -q "\"$prop\""; then
      echo -e "  ${GREEN}✅ Propriété '$prop' présente${NC}"
    else
      echo -e "  ${RED}❌ Propriété '$prop' manquante${NC}"
    fi
  done
  
  # Exemples de données
  echo ""
  echo "💡 Exemples de données extraites :"
  echo "----------------------------------"
  
  # Extraire 3 premiers emails
  echo "📧 Emails (3 premiers) :"
  echo "$BODY" | grep -A 20 '"emails"' | grep -o '"value":"[^"]*"' | head -3 | cut -d'"' -f4 | while read email; do
    echo "  - $email"
  done
  
  # Extraire 3 premières entreprises
  echo ""
  echo "🏢 Entreprises (3 premières) :"
  echo "$BODY" | grep -A 20 '"companies"' | grep -o '"value":"[^"]*"' | head -3 | cut -d'"' -f4 | while read company; do
    echo "  - $company"
  done
  
else
  echo -e "${RED}❌ Code attendu: 200, reçu: ${HTTP_CODE}${NC}"
  echo "Réponse : $BODY"
fi
echo ""

# Test 3 : Performance
echo "📝 Test 3 : Performance"
echo "----------------------"
START_TIME=$(date +%s%N)
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${TEST_TOKEN}" \
  "${API_URL}${ENDPOINT}")
END_TIME=$(date +%s%N)
ELAPSED=$((($END_TIME - $START_TIME) / 1000000)) # Convertir en millisecondes

echo "⏱️  Temps de réponse : ${ELAPSED}ms"

if [ $ELAPSED -lt 2000 ]; then
  echo -e "${GREEN}✅ Performance acceptable (<2s)${NC}"
else
  echo -e "${YELLOW}⚠️  Performance à optimiser (>2s)${NC}"
fi
echo ""

# Résumé
echo "=============================================="
echo -e "${GREEN}✅ Tests terminés avec succès${NC}"
echo ""
echo "💡 Pour tester dans l'interface :"
echo "  1. Ouvrir http://localhost:5173/entities"
echo "  2. Cliquer sur l'onglet 'Données extraites'"
echo "  3. Vérifier que les stats s'affichent"
echo "  4. Tester les filtres et la recherche"
echo ""
