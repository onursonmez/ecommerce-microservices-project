FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package*.json ./
COPY services/user/package*.json ./services/user/
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/ ./packages/
COPY services/user/ ./services/user/

# Build shared packages
RUN npm run build -w @ecommerce/types && \
    npm run build -w @ecommerce/logger && \
    npm run build -w @ecommerce/middleware && \
    npm run build -w @ecommerce/queue

# Change to service directory and copy prisma schema
WORKDIR /app/services/user
COPY services/user/prisma ./prisma/

# Generate Prisma client and build TypeScript
RUN npx prisma generate --schema=./prisma/schema.prisma && \
    npm run build

EXPOSE 3000

CMD ["npm", "start"]