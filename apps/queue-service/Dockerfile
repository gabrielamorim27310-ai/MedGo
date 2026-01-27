FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/queue-service/package.json ./apps/queue-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/queue-service/ ./apps/queue-service/

# Build shared types first, then queue-service
RUN pnpm --filter @medgo/shared-types build
RUN cd apps/queue-service && npx prisma generate || true
RUN pnpm --filter @medgo/queue-service build

WORKDIR /app/apps/queue-service

EXPOSE 3002

CMD ["node", "dist/server.js"]
