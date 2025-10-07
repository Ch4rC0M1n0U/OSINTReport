# Dockerfile Backend - OSINTReport API
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Build
FROM node:20-alpine AS builder

# Installer les dépendances système nécessaires pour Prisma et compilation native
RUN apk add --no-cache python3 make g++ libc6-compat openssl

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (y compris dev pour le build)
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Compiler TypeScript
RUN npm run build

# Nettoyer les devDependencies
RUN npm prune --production

# Stage 2: Production
FROM node:20-alpine

# Installer les dépendances runtime nécessaires (OpenSSL pour Prisma, Chromium pour Puppeteer)
RUN apk add --no-cache \
    openssl \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables d'environnement pour Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copier les fichiers depuis le stage de build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Créer les répertoires nécessaires
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port de l'API
EXPOSE 4000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Script de démarrage: migrations puis serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
