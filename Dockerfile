# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm install

# Copy source files
COPY . .

# Build the Next.js app
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built output and necessary files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the default Next.js port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
