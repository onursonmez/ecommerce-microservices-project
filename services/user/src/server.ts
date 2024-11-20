import express from 'express';
import { userRouter } from './routes/user.routes';
import { RabbitMQClient } from '@ecommerce/queue';

// Create RabbitMQ client instance
export const rabbitMQ = new RabbitMQClient(process.env.RABBITMQ_URL || 'amqp://localhost:5672');

export async function createServer() {
    const app = express();
    app.use(express.json());
    app.use('/api/users', userRouter);

    if (process.env.NODE_ENV !== 'test') {
        try {
            await rabbitMQ.connect();
            await rabbitMQ.createQueue('user_events');
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    return app;
}