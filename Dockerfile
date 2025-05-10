FROM node:20-alpine AS base

FROM base AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations

RUN mkdir -p /app/storage
ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npm run start:prod"]