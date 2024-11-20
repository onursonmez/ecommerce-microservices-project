import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer } from '../server';
import { RabbitMQClient } from '@ecommerce/queue';

const prisma = new PrismaClient();
let app: Express;
let rabbitMQ: RabbitMQClient;

beforeAll(async () => {
    app = await createServer();
    rabbitMQ = new RabbitMQClient('amqp://localhost:5672');
});

describe('Authentication Endpoints', () => {
    describe('POST /api/users/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User'
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(userData.email);
            expect(response.body.name).toBe(userData.name);
            expect(response.body).not.toHaveProperty('password');

            // Wait for transaction to complete and verify user in database
            const user = await prisma.user.findFirst({
                where: { email: userData.email }
            });

            // Ensure user exists and verify data
            expect(user).not.toBeNull();
            expect(user?.email).toBe(userData.email);
            expect(user?.name).toBe(userData.name);

            // Verify password was hashed
            const validPassword = await bcrypt.compare(userData.password, user!.password);
            expect(validPassword).toBe(true);
        });

        it('should not register a user with existing email', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                name: 'Existing User'
            };

            // Create user first time
            await request(app)
                .post('/api/users/register')
                .send(userData);

            // Try to create user with same email
            const response = await request(app)
                .post('/api/users/register')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('User already exists');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Email, password, and name are required');
        });
    });

    describe('POST /api/users/login', () => {
        beforeEach(async () => {
            // Create a test user before each login test
            const hashedPassword = await bcrypt.hash('password123', 10);
            await prisma.user.create({
                data: {
                    email: 'login@example.com',
                    password: hashedPassword,
                    name: 'Login Test User'
                }
            });
        });

        it('should login successfully with correct credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'login@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('login@example.com');
            expect(response.body.user).not.toHaveProperty('password');

            // Verify JWT token
            const decoded = jwt.verify(
                response.body.token,
                process.env.JWT_SECRET || 'your-secret-key'
            ) as { userId: number };
            expect(decoded).toHaveProperty('userId');
        });

        it('should not login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'login@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should not login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Invalid credentials');
        });
    });
});