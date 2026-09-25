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
RUN apk add --no-cache wget su-exec
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads
EXPOSE 4000
CMD ["sh", "-c", "mkdir -p /app/uploads && chown -R node:node /app/uploads && su-exec node sh -c 'npx prisma db execute --file prisma/migrations/20260925_admin_username_transition/migration.sql && npx prisma db push --skip-generate && node prisma/seed.mjs && node dist/index.js'"]