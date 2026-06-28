FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update -qq && apt-get install -qq -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
# Use npm install (not ci) since project uses bun lockfile
RUN npm install

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Create db directory with proper permissions
RUN mkdir -p /app/db && chown nextjs:nodejs /app/db

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./db/custom.db"

CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]