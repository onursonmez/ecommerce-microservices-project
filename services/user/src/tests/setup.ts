/// <reference types="jest" />

import { PrismaClient } from '@prisma/client';

// Create a mock RabbitMQ client
export const mockPublishToQueue = jest.fn().mockResolvedValue(undefined);
export const mockRabbitMQClient = {
    connect: jest.fn().mockResolvedValue(undefined),
    createQueue: jest.fn().mockResolvedValue(undefined),
    publishToQueue: mockPublishToQueue,
    close: jest.fn().mockResolvedValue(undefined),
};

// Mock RabbitMQ
jest.mock('@ecommerce/queue', () => ({
    RabbitMQClient: jest.fn().mockImplementation(() => mockRabbitMQClient),
}));

// Use test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://root:root@localhost:3307/user_service';
process.env.JWT_SECRET = 'test-secret-key';

const prisma = new PrismaClient();

beforeAll(async () => {
    // Create tables in test database
    await prisma.$connect();
});

beforeEach(async () => {
    // Clean up database before each test
    await prisma.user.deleteMany();
    await prisma.$executeRaw`ALTER TABLE User AUTO_INCREMENT = 1;`;

    // Clear all mock calls
    mockPublishToQueue.mockClear();
});

afterEach(async () => {
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
    await prisma.user.deleteMany();
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
});

afterAll(async () => {
    await prisma.$disconnect();
});