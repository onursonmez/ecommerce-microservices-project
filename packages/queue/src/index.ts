import amqp, { Channel, Connection } from 'amqplib';
import { logger } from '@ecommerce/logger';

export class RabbitMQClient {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  constructor(private url: string) {}

  async connect() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async createQueue(queueName: string) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    await this.channel.assertQueue(queueName, { durable: true });
  }

  async publishToQueue(queueName: string, data: any) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    const message = Buffer.from(JSON.stringify(data));
    return this.channel.sendToQueue(queueName, message);
  }

  async consumeFromQueue(queueName: string, callback: (data: any) => Promise<void>) {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }
    await this.channel.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const data = JSON.parse(msg.content.toString());
          await callback(data);
          this.channel?.ack(msg);
        } catch (error) {
          logger.error('Error processing message:', error);
          this.channel?.nack(msg);
        }
      }
    });
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}