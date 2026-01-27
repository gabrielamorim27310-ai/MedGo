FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api-gateway/package.json ./apps/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/api-gateway/ ./apps/api-gateway/

# Build shared types first, then api-gateway
RUN pnpm --filter @medgo/shared-types build
RUN cd apps/api-gateway && npx prisma generate
RUN pnpm --filter @medgo/api-gateway build

WORKDIR /app/apps/api-gateway

EXPOSE 3001

CMD ["node", "dist/server.js"]
