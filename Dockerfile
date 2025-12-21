# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# Build-time arguments for Next.js public env vars
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Make them available as env vars during build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Remove package-lock.json to ensure fresh dependency resolution (fixes linux optional deps)
RUN rm -f package-lock.json

# Install dependencies (will regenerate package-lock.json with linux binaries)
RUN npm install

# Install the specific lightningcss binary for linux x64 (just in case)
RUN npm install lightningcss-linux-x64-gnu --save-optional

# Copy source files
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production stage ----
FROM node:20-slim AS runner
WORKDIR /app

# Install OpenSSL and curl for runtime and health checks
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy built output and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the default Next.js port
EXPOSE 3000

# Health check for container orchestration (Dokploy, Docker Swarm, etc.)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the server
CMD ["node", "server.js"]
