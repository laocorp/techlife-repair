# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (including optional peer deps)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source files
COPY . .

# Build the Next.js app (static generation + server)
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only the built output and production dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Expose the default Next.js port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "start"]
