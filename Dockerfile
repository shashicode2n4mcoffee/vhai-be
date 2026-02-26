# Multi-stage build for Cloud Run (GCP)
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# TypeScript source and build
COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Cloud Run sets PORT; default for local Docker
ENV PORT=8080

# Production deps only (no devDependencies)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Prisma client and schema (for migrations at deploy time if needed)
COPY prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Built output
COPY --from=builder /app/dist ./dist

# Non-root user (Cloud Run can run as root; this is best practice)
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8080

CMD ["node", "dist/index.js"]
