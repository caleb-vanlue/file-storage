FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p /app/storage

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]