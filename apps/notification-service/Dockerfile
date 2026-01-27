FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/notification-service/package.json ./apps/notification-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/notification-service/ ./apps/notification-service/

# Build shared types first, then notification-service
RUN pnpm --filter @medgo/shared-types build
RUN cd apps/notification-service && npx prisma generate || true
RUN pnpm --filter @medgo/notification-service build

WORKDIR /app/apps/notification-service

EXPOSE 3003

CMD ["node", "dist/server.js"]
