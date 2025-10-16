#!/bin/bash

echo "==================================="
echo "🔍 Vérification de la configuration Docker"
echo "==================================="
echo ""

# Vérifier les fichiers Docker
echo "📄 Fichiers Docker:"
[ -f "docker-compose.yml" ] && echo "  ✅ docker-compose.yml" || echo "  ❌ docker-compose.yml manquant"
[ -f "backend/Dockerfile" ] && echo "  ✅ backend/Dockerfile" || echo "  ❌ backend/Dockerfile manquant"
[ -f "frontend/Dockerfile" ] && echo "  ✅ frontend/Dockerfile" || echo "  ❌ frontend/Dockerfile manquant"
[ -f ".env.docker.example" ] && echo "  ✅ .env.docker.example" || echo "  ❌ .env.docker.example manquant"
[ -f "DOCKER.md" ] && echo "  ✅ DOCKER.md" || echo "  ❌ DOCKER.md manquant"
echo ""

# Vérifier la structure des Dockerfiles
echo "🔨 Validation des Dockerfiles:"
if grep -q "FROM node:20-alpine AS builder" backend/Dockerfile; then
    echo "  ✅ Backend: Multi-stage build détecté"
else
    echo "  ❌ Backend: Multi-stage build manquant"
fi

if grep -q "FROM node:20-alpine AS builder" frontend/Dockerfile; then
    echo "  ✅ Frontend: Multi-stage build détecté"
else
    echo "  ❌ Frontend: Multi-stage build manquant"
fi

if grep -q "npx prisma" backend/Dockerfile; then
    echo "  ✅ Backend: Prisma configuré"
else
    echo "  ❌ Backend: Prisma non configuré"
fi
echo ""

# Vérifier docker-compose.yml
echo "🐳 Validation docker-compose.yml:"
if grep -q "postgres:" docker-compose.yml; then
    echo "  ✅ Service PostgreSQL"
fi
if grep -q "meilisearch:" docker-compose.yml; then
    echo "  ✅ Service Meilisearch"
fi
if grep -q "backend:" docker-compose.yml; then
    echo "  ✅ Service Backend"
fi
if grep -q "frontend:" docker-compose.yml; then
    echo "  ✅ Service Frontend"
fi
if grep -q "depends_on:" docker-compose.yml; then
    echo "  ✅ Dépendances configurées"
fi
if grep -q "healthcheck:" docker-compose.yml; then
    echo "  ✅ Healthchecks configurés"
fi
echo ""

# Vérifier les ports
echo "🔌 Configuration des ports:"
echo "  PostgreSQL: $(grep 'POSTGRES_PORT' .env.docker.example | cut -d'=' -f2)"
echo "  Meilisearch: $(grep 'MEILI_PORT' .env.docker.example | cut -d'=' -f2)"
echo "  Backend: $(grep 'BACKEND_PORT' .env.docker.example | cut -d'=' -f2)"
echo "  Frontend: $(grep 'FRONTEND_PORT' .env.docker.example | cut -d'=' -f2)"
echo ""

echo "==================================="
echo "✅ Vérification terminée!"
echo "==================================="
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Copiez .env.docker.example vers .env"
echo "  2. Modifiez les secrets dans .env"
echo "  3. Lancez: docker compose up -d"
echo ""
