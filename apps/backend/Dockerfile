FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/.medusa/server ./
RUN npm ci --omit=dev
USER node
EXPOSE 9000
# Migrations = étape de déploiement séparée (npm run db:migrate), pas au démarrage
CMD ["npx", "medusa", "start"]
