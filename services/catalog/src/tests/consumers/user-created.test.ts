import { PrismaClient } from '@prisma/client';
import { setupUserCreatedConsumer } from '../../consumers/user-created.consumer';
import { rabbitMQ } from '../../index';

const prisma = new PrismaClient();

describe('User Created Consumer', () => {
    beforeEach(async () => {
        // Temizle
        await prisma.product.deleteMany();
        await prisma.$executeRaw`ALTER TABLE products AUTO_INCREMENT = 1;`;
    });

    it('should create welcome product when user created event received', async () => {
        const mockUserEvent = {
            type: 'USER_CREATED',
            data: {
                id: 1,
                email: 'test@example.com',
                name: 'Test User'
            }
        };

        // Initialize the Consumer
        await setupUserCreatedConsumer();

        // Publish the event
        await rabbitMQ.publishToQueue('user_events', mockUserEvent);

        // Wait for the product to be created (a more sophisticated method can be used in real life)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if the product has been created
        const products = await prisma.product.findMany();
        expect(products).toHaveLength(1);
        expect(products[0]).toMatchObject({
            name: `Welcome Gift for ${mockUserEvent.data.name}`,
            price: 1.00,
            stock: 1
        });
    });
});