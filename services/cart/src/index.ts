import express from 'express';
import { cartRouter } from './routes/cart.routes';
import { logger } from '@ecommerce/logger';
import { RabbitMQClient } from '@ecommerce/queue';

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use('/api/cart', cartRouter);

// Export RabbitMQ client for use in controllers
export const rabbitMQ = new RabbitMQClient(process.env.RABBITMQ_URL || 'amqp://localhost:5672');

async function start() {
  try {
    // Connect to RabbitMQ before starting the server
    await rabbitMQ.connect();
    await rabbitMQ.createQueue('cart_events');
    logger.info('Connected to RabbitMQ');

    app.listen(port, () => {
      logger.info(`Cart service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start cart service:', error);
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