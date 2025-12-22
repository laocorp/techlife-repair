# ============================================
# Dockerfile for RepairApp (Next.js 15 + Prisma 5)
# PostgreSQL Direct - Optimized for Dokploy
# ============================================

# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# Build-time arguments (will be overridden by Dokploy env vars)
ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL=https://repair.laocorp.lat
ARG NEXT_PUBLIC_APP_URL=https://repair.laocorp.lat

# Make them available as env vars during build
ENV DATABASE_URL=$DATABASE_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and prisma
COPY package*.json ./
COPY prisma ./prisma/

# Remove package-lock.json to ensure fresh dependency resolution
RUN rm -f package-lock.json

# Install dependencies
RUN npm install --legacy-peer-deps

# Install lightningcss for linux (tailwind)
RUN npm install lightningcss-linux-x64-gnu --save-optional || true

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production stage ----
FROM node:20-slim AS runner
WORKDIR /app

# Install OpenSSL and curl for runtime
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy built output and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose the default Next.js port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server.js"]
