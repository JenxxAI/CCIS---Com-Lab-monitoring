FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Build frontend
COPY . .
RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Copy server files
COPY server/ ./server/
COPY --from=build /app/dist ./dist

# Serve static files from the server
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "server/index.mjs"]
