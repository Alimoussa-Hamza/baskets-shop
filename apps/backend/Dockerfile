FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# medusa build charge medusa-config.ts, qui exige ces variables : valeurs FACTICES, limitées à cette commande.
# Les vraies valeurs sont fournies au démarrage par l'hébergeur. MEDUSA_BACKEND_URL reste vide : l'admin appelle son propre domaine.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build REDIS_URL=redis://localhost:6379 \
    STORE_CORS=http://build ADMIN_CORS=http://build AUTH_CORS=http://build \
    JWT_SECRET=build-only COOKIE_SECRET=build-only \
    npm run build

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.medusa/server ./
RUN npm ci --omit=dev
USER node
EXPOSE 9000
# Migrations = étape de déploiement séparée (npm run db:migrate), pas au démarrage
CMD ["npx", "medusa", "start"]
