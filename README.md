# E-commerce Microservices Backend

This project is a microservices-based e-commerce backend built with Node.js, TypeScript, Express, RabbitMQ, and MySQL.

## Services

- **User Service**: Handles user authentication and management
- **Catalog Service**: Manages product catalog
- **Cart Service**: Handles shopping cart operations
- **Order Service**: Manages order processing

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- npm

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the services using Docker Compose:
   ```bash
   docker-compose up
   ```

## Service Ports

- User Service: 3000
- Catalog Service: 3001
- Cart Service: 3002
- Order Service: 3003
- RabbitMQ Management: 15672
- MySQL Ports:
  - User DB: 3307
  - Catalog DB: 3308
  - Cart DB: 3309
  - Order DB: 3310

## API Documentation

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### User Service (Port 3000)

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

Response (201):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-20T12:00:00.000Z",
    "updatedAt": "2024-01-20T12:00:00.000Z"
  },
  "token": "YOUR_JWT_TOKEN"
}
```

### Catalog Service (Port 3001)

#### Get Products (Public)
```http
GET /api/products

Response (200):
[
  {
    "id": 1,
    "name": "Product Name",
    "description": "Product Description",
    "price": 99.99,
    "stock": 100,
    "createdAt": "2024-01-20T12:00:00.000Z",
    "updatedAt": "2024-01-20T12:00:00.000Z"
  }
]
```

#### Create Product (Protected)
```http
POST /api/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "stock": 100
}

Response (201):
{
  "id": 1,
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "stock": 100,
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

#### Update Stock (Protected)
```http
PATCH /api/products/:id/stock
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "stock": 50
}

Response (200):
{
  "id": 1,
  "name": "Product Name",
  "description": "Product Description",
  "price": 99.99,
  "stock": 50,
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

### Cart Service (Port 3002)

#### Add to Cart (Protected)
```http
POST /api/cart/add
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}

Response (201):
{
  "id": 1,
  "cartId": 1,
  "productId": 1,
  "quantity": 2,
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

#### Get Cart (Protected)
```http
GET /api/cart
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
{
  "id": 1,
  "userId": 1,
  "items": [
    {
      "id": 1,
      "cartId": 1,
      "productId": 1,
      "quantity": 2,
      "createdAt": "2024-01-20T12:00:00.000Z",
      "updatedAt": "2024-01-20T12:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

### Order Service (Port 3003)

#### Create Order (Protected)
```http
POST /api/orders
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 99.99
    }
  ],
  "total": 199.98
}

Response (201):
{
  "id": 1,
  "userId": 1,
  "status": "PENDING",
  "total": 199.98,
  "items": [
    {
      "id": 1,
      "orderId": 1,
      "productId": 1,
      "quantity": 2,
      "price": 99.99,
      "createdAt": "2024-01-20T12:00:00.000Z",
      "updatedAt": "2024-01-20T12:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

#### Update Order Status (Protected)
```http
PATCH /api/orders/:id/status
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "PROCESSING"
}

Response (200):
{
  "id": 1,
  "userId": 1,
  "status": "PROCESSING",
  "total": 199.98,
  "items": [...],
  "createdAt": "2024-01-20T12:00:00.000Z",
  "updatedAt": "2024-01-20T12:00:00.000Z"
}
```

#### Get Orders (Protected)
```http
GET /api/orders
Authorization: Bearer YOUR_JWT_TOKEN

Response (200):
[
  {
    "id": 1,
    "userId": 1,
    "status": "PROCESSING",
    "total": 199.98,
    "items": [...],
    "createdAt": "2024-01-20T12:00:00.000Z",
    "updatedAt": "2024-01-20T12:00:00.000Z"
  }
]
```

## Development

### Starting Infrastructure Services

First, start RabbitMQ and all MySQL databases using docker-compose:

```bash
docker-compose -f docker-compose.dev.yml up -d rabbitmq mysql-user mysql-catalog mysql-cart mysql-order
```

To stop

```bash
docker-compose -f docker-compose.dev.yml down
```

### Starting Individual Services

After the infrastructure is running, you can start each service independently in development mode:

1. User Service:
```bash
cd services/user
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

2. Catalog Service:
```bash
cd services/catalog
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

3. Cart Service:
```bash
cd services/cart
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

4. Order Service:
```bash
cd services/order
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Each service will run on its designated port:
- User Service: http://localhost:3000
- Catalog Service: http://localhost:3001
- Cart Service: http://localhost:3002
- Order Service: http://localhost:3003

### Environment Setup

Create a `.env` file in each service directory with the following content (adjust the port according to the service):

User Service (.env):
```env
DATABASE_URL="mysql://root:root@localhost:3307/user_service"
RABBITMQ_URL="amqp://user:password@localhost:5672"
JWT_SECRET="your-secret-key"
NODE_ENV=development
```

Catalog Service (.env):
```env
DATABASE_URL="mysql://root:root@localhost:3308/catalog_service"
RABBITMQ_URL="amqp://user:password@localhost:5672"
JWT_SECRET="your-secret-key"
NODE_ENV=development
```

Cart Service (.env):
```env
DATABASE_URL="mysql://root:root@localhost:3309/cart_service"
RABBITMQ_URL="amqp://user:password@localhost:5672"
JWT_SECRET="your-secret-key"
NODE_ENV=development
```

Order Service (.env):
```env
DATABASE_URL="mysql://root:root@localhost:3310/order_service"
RABBITMQ_URL="amqp://user:password@localhost:5672"
JWT_SECRET="your-secret-key"
NODE_ENV=development
```

## Testing

### Running Tests

Run tests for a specific service:
```bash
# User Service
cd services/user && npm test
```

### Test Coverage

Generate test coverage report:
```bash
npm test -- --coverage
```

### Test Environment

Tests use:
- In-memory SQLite database for faster test execution
- Mocked RabbitMQ client
- JWT authentication with a test secret key

### Running Integration Tests

To run integration tests that include database and RabbitMQ:

```bash
npm run test:integration
```

## Database Migrations

Each service has its own Prisma schema and migrations. To run migrations:

```bash
npm run prisma:migrate
```

Or for a specific service:

```bash
cd services/[service-name]
npx prisma migrate deploy
```

## Inter-Service Communication

An example of communication between services using RabbitMQ. The Catalog service listens to the USER_CREATED event from the User service and creates a free product record for the newly registered user.

This implementation incorporates the following best practices:

### Separate Consumer Module:
Each event consumer is kept in a separate module.\
The Single Responsibility Principle (SRP) is applied.\
It is easily testable and maintainable.

### Type Safety:
Interfaces are used for event and data structures.\
Type checking is enforced with TypeScript.

### Error Handling:
Detailed logging is implemented.\
Messages are requeued in case of errors.\
Graceful shutdown support is provided.

### Testability:
Unit tests are written for the consumer.\
Test database cleanup is performed.\
Appropriate waiting mechanisms are in place for asynchronous operations.

### Event Chaining:
When an event is processed, a new event (WELCOME_PRODUCT_CREATED) is published.\
Other services can listen to this new event.

### Isolation:
Each service manages its own database operations.\
Inter-service communication is done exclusively via events.

### Usage:
The User service publishes a USER_CREATED event when a user is created.\
The Catalog service listens to this event and automatically creates a welcome product for the new user.\
Once the product is created, a WELCOME_PRODUCT_CREATED event is published.\
Other services (e.g., the Cart service) can listen to this new event and perform additional actions.\
This structure optimally implements the event-driven communication pattern in microservice architecture, ensuring services adhere to the principle of loose coupling.

## Development Notes

- Each service can be developed and run independently
- Changes to shared code require rebuilding the shared package
- RabbitMQ Management UI is available at http://localhost:15672 (user/password)
- Database migrations are run automatically in development mode
- Hot reload is enabled for all services in development mode