FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY services/catalog/package*.json ./services/catalog/
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/ ./packages/
COPY services/catalog/ ./services/catalog/

# Build shared packages
RUN npm run build -w @ecommerce/types && \
    npm run build -w @ecommerce/logger && \
    npm run build -w @ecommerce/middleware && \
    npm run build -w @ecommerce/queue

# Change to service directory and copy prisma schema
WORKDIR /app/services/catalog
COPY services/catalog/prisma ./prisma/

# Generate Prisma client and build TypeScript
RUN npx prisma generate --schema=./prisma/schema.prisma && \
    npm run build

EXPOSE 3000

CMD ["npm", "start"]