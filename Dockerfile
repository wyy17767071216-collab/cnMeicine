FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/

# Install only server deps
RUN pnpm install --filter @cn-medicine/server --frozen-lockfile

# Copy server source
COPY packages/server ./packages/server

# Build
RUN pnpm --filter @cn-medicine/server run build

# ── Runtime stage ──────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/server/package.json ./packages/server/

RUN pnpm install --filter @cn-medicine/server --prod --frozen-lockfile

COPY --from=builder /app/packages/server/dist ./packages/server/dist

EXPOSE 8080

CMD ["node", "packages/server/dist/index.js"]
