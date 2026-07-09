FROM node:18-alpine AS base
# openssl: o Prisma precisa dele no Alpine para o engine funcionar
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
# tsc global — evita os symlinks isolados do pnpm no build Docker
RUN npm install -g typescript@5.3.3
WORKDIR /app

# Manifests de TODOS os workspaces (o lockfile precisa deles)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY apps/queue-service/package.json ./apps/queue-service/
COPY apps/notification-service/package.json ./apps/notification-service/
COPY apps/analytics-service/package.json ./apps/analytics-service/
COPY apps/web-dashboard/package.json ./apps/web-dashboard/

RUN pnpm install --frozen-lockfile

# Código
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/api-gateway/ ./apps/api-gateway/

# Compila de dentro de cada diretório (o pnpm coloca os módulos no
# node_modules de cada workspace); tsc é global.
RUN cd packages/shared-types && tsc
RUN cd apps/api-gateway && pnpm exec prisma generate
RUN cd apps/api-gateway && tsc

WORKDIR /app/apps/api-gateway

EXPOSE 3001

# Aplica o schema no banco (Neon) a cada deploy e sobe o servidor.
# O host injeta a porta via env PORT.
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && node dist/server.js"]
