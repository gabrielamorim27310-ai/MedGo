FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/analytics-service/package.json ./apps/analytics-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/analytics-service/ ./apps/analytics-service/

# Build shared types first, then analytics-service
RUN pnpm --filter @medgo/shared-types build
RUN cd apps/analytics-service && npx prisma generate || true
RUN pnpm --filter @medgo/analytics-service build

WORKDIR /app/apps/analytics-service

EXPOSE 3004

CMD ["node", "dist/server.js"]
