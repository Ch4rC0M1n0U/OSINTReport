#!/bin/bash

# Script de test de l'API

echo "Test 1: Ping du backend"
curl -s http://localhost:4000/health 2>&1 | head -5

echo ""
echo "Test 2: Vérifier que le backend répond"
curl -s http://localhost:4000/api/auth/check 2>&1 | head -5

echo ""
echo "Serveur backend : OK si vous voyez des réponses JSON ci-dessus"
