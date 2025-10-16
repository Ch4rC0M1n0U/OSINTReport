# === Stage 1: Build ===
FROM node:20-alpine AS builder

ARG VITE_API_BASE_URL=http://localhost:4000

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Créer le fichier .env.production
RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production

# Build de production
RUN npm run build

# === Stage 2: Nginx ===
FROM nginx:alpine

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Exposer le port
EXPOSE 8080

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
