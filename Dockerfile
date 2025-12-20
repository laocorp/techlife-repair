# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# Install OpenSSL for Prisma (if needed) and other build deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm install

# Copy source files
COPY . .

# Disable Turbopack for build (use Webpack instead)
ENV NEXT_TURBOPACK=0

# Build the Next.js app with Webpack
RUN npm run build

# ---- Production stage ----
FROM node:20-slim AS runner
WORKDIR /app

# Install OpenSSL for runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy built output and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the default Next.js port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
