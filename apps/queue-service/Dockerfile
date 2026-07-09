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

# Código (o queue-service usa o Prisma Client gerado a partir do schema
# do api-gateway — por isso copiamos o schema)
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/api-gateway/prisma/ ./apps/api-gateway/prisma/
COPY apps/queue-service/ ./apps/queue-service/

# Compila de dentro de cada diretório (o pnpm coloca os módulos no
# node_modules de cada workspace); tsc é global.
RUN cd packages/shared-types && tsc
RUN cd apps/api-gateway && pnpm exec prisma generate
RUN cd apps/queue-service && tsc

WORKDIR /app/apps/queue-service

EXPOSE 3002

CMD ["node", "dist/server.js"]
