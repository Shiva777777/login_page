# Simple production Dockerfile for the Node.js app
FROM node:18-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]