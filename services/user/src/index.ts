import { createServer } from './server';
import { logger } from '@ecommerce/logger';
import { RabbitMQClient } from '@ecommerce/queue';

export const rabbitMQ = new RabbitMQClient(process.env.RABBITMQ_URL || 'amqp://localhost:5672');

const port = process.env.PORT || 3000;

async function start() {
  try {
    const app = await createServer();

    // Connect to RabbitMQ
    if (process.env.NODE_ENV !== 'test') {
      await rabbitMQ.connect();
      await rabbitMQ.createQueue('user_events');
      logger.info('Connected to RabbitMQ');
    }

    app.listen(port, () => {
      logger.info(`User service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start user service:', error);
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

if (process.env.NODE_ENV !== 'test') {
  start();
}