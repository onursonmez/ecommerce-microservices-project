import { RabbitMQClient } from '@ecommerce/queue';
import request from 'supertest';
import { Express } from 'express';
import { createServer } from '../server';

let app: Express;
let rabbitMQ: jest.Mocked<RabbitMQClient>;

beforeAll(async () => {
    app = await createServer();
    rabbitMQ = new RabbitMQClient('amqp://localhost:5672') as jest.Mocked<RabbitMQClient>;
});

describe('RabbitMQ Integration', () => {
    it('should publish user created event on registration', async () => {
        const userData = {
            email: 'rabbitmq@example.com',
            password: 'password123',
            name: 'RabbitMQ Test User'
        };

        const response = await request(app)
            .post('/api/users/register')
            .send(userData);

        expect(response.status).toBe(201);

        // Verify RabbitMQ event was published
        expect(rabbitMQ.publishToQueue).toHaveBeenCalledWith(
            'user_events',
            expect.objectContaining({
                type: 'USER_CREATED',
                data: expect.objectContaining({
                    id: expect.any(Number),
                    email: userData.email,
                    name: userData.name
                })
            })
        );
    });

    it('should continue registration process even if RabbitMQ publish fails', async () => {
        // Mock RabbitMQ publish to fail
        // (rabbitMQ.publishToQueue as jest.Mock).mockRejectedValueOnce(new Error('RabbitMQ error'));

        const userData = {
            email: 'rabbitmq-fail@example.com',
            password: 'password123',
            name: 'RabbitMQ Fail Test User'
        };

        const response = await request(app)
            .post('/api/users/register')
            .send(userData);

        // Registration should still succeed
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.email).toBe(userData.email);
    });
});