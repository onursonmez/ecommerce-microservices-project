import express from 'express';
import { orderRouter } from './routes/order.routes';
import { logger } from '@ecommerce/logger';
import { RabbitMQClient } from '@ecommerce/queue';

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use('/api/orders', orderRouter);

// Export RabbitMQ client for use in controllers
export const rabbitMQ = new RabbitMQClient(process.env.RABBITMQ_URL || 'amqp://localhost:5672');

async function start() {
  try {
    // Connect to RabbitMQ before starting the server
    await rabbitMQ.connect();
    await rabbitMQ.createQueue('order_events');
    logger.info('Connected to RabbitMQ');

    app.listen(port, () => {
      logger.info(`Order service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start order service:', error);
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