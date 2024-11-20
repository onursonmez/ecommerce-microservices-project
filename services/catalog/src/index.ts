import express from 'express';
import { productRouter } from './routes/product.routes';
import { logger } from '@ecommerce/logger';
import { RabbitMQClient } from '@ecommerce/queue';
import { setupUserCreatedConsumer } from './consumers/user-created.consumer';

const app = express();
const port = process.env.PORT || 3001;

// Export RabbitMQ client for use in controllers and consumers
export const rabbitMQ = new RabbitMQClient(process.env.RABBITMQ_URL || 'amqp://localhost:5672');

app.use(express.json());
app.use('/api/products', productRouter);

async function start() {
  try {
    // Connect to RabbitMQ before starting the server
    await rabbitMQ.connect();

    // Setup queues
    await rabbitMQ.createQueue('catalog_events');

    // Setup consumers
    await setupUserCreatedConsumer();

    logger.info('Connected to RabbitMQ');

    app.listen(port, () => {
      logger.info(`Catalog service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start catalog service:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await rabbitMQ.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

start();