# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
# Rebuild better-sqlite3 for Linux/musl
RUN npm rebuild better-sqlite3

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data dir so DB can initialize during build
RUN mkdir -p data

RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/yugo-eats.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/seed-docker.js ./seed-docker.js

RUN mkdir -p /app/data /app/public/uploads && chown -R nextjs:nodejs /app/data /app/public/uploads

# Declare volumes for data persistence (DB + uploaded images)
VOLUME ["/app/data", "/app/public/uploads"]

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node seed-docker.js && node server.js"]
