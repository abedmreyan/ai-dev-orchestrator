# Multi-stage build for Node.js application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json pnpm-lock.yaml* ./
COPY patches ./patches
RUN npm install -g pnpm && pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Only copy native modules and externalized packages
COPY package*.json pnpm-lock.yaml* ./
COPY patches ./patches
RUN npm install -g pnpm && pnpm install --prod --no-frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
