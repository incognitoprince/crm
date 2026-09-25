FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma
RUN npm install
RUN npx prisma generate

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN mkdir -p /app/uploads && chown -R node:node /app && chmod 0555 /app/docker-entrypoint.sh
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- http://127.0.0.1:4000/api/health/live || exit 1
CMD ["sh", "./docker-entrypoint.sh"]
