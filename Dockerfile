# xmem MCP Memory Server Dockerfile
# Build stage
FROM node:22.12-alpine AS builder
WORKDIR /app

RUN --mount=type=cache,target=/root/.npm npm install

RUN --mount=type=cache,target=/root/.npm-production npm ci --ignore-scripts --omit-dev

FROM node:22-alpine AS release

COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/package-lock.json /app/package-lock.json

ENV NODE_ENV=production

WORKDIR /app

RUN npm ci --ignore-scripts --omit-dev

# xmem MCP Memory Server Dockerfile
# Build stage
FROM node:22.12-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install && npm run build

# Release stage
FROM node:22-alpine AS release
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create a volume for persistent memory storage
VOLUME ["/app/memories"]

ENV NODE_ENV=production

# By default, store all project memories in /app/memories
ENV MEMORY_DIR_PATH=/app/memories

ENTRYPOINT ["node", "dist/index.js"]