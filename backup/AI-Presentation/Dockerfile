# Multi-stage build for minimal image size
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY tsconfig*.json ./
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3100
CMD ["node", "dist/main.js"]