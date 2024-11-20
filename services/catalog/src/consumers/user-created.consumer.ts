import { PrismaClient } from '@prisma/client';
import { logger } from '@ecommerce/logger';
import { rabbitMQ } from '../index';

const prisma = new PrismaClient();

interface UserCreatedEvent {
    type: 'USER_CREATED';
    data: {
        id: number;
        email: string;
        name: string;
    };
}

export async function setupUserCreatedConsumer() {
    try {
        await rabbitMQ.createQueue('user_events');

        await rabbitMQ.consumeFromQueue('user_events', async (message) => {
            const event = message as UserCreatedEvent;

            if (event.type === 'USER_CREATED') {
                logger.info(`Processing USER_CREATED event for user: ${event.data.id}`);

                try {
                    // Create sample product for new user
                    const welcomeProduct = await prisma.product.create({
                        data: {
                            name: `Welcome Gift for ${event.data.name}`,
                            description: 'A special welcome gift for our new user',
                            price: 0.00, // Free gift product
                            stock: 1
                        }
                    });

                    logger.info(`Created welcome product for user ${event.data.id}:`, welcomeProduct);

                    // Publish an event when the product is created
                    await rabbitMQ.publishToQueue('catalog_events', {
                        type: 'WELCOME_PRODUCT_CREATED',
                        data: {
                            userId: event.data.id,
                            product: welcomeProduct
                        }
                    });
                } catch (error) {
                    logger.error('Error creating welcome product:', error);
                    throw error; // RabbitMQ will requeue the message
                }
            }
        });

        logger.info('User created consumer is ready');
    } catch (error) {
        logger.error('Error setting up user created consumer:', error);
        throw error;
    }
}