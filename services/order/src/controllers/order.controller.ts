import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '@ecommerce/middleware';
import { logger } from '@ecommerce/logger';
import { rabbitMQ } from '../index';

const prisma = new PrismaClient();

export async function createOrder(req: AuthRequest, res: Response) {
  try {
    const { items, total } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!items?.length || !total) {
      return res.status(400).json({ error: 'Items and total are required' });
    }

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });

    try {
      await rabbitMQ.publishToQueue('order_events', {
        type: 'ORDER_CREATED',
        data: order,
        userId
      });
    } catch (error) {
      logger.error('Failed to publish order created event:', error);
      // Continue with the response even if event publishing fails
    }

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: 'Invalid order data' });
    }
    logger.error('Error in createOrder:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { items: true },
    });

    try {
      await rabbitMQ.publishToQueue('order_events', {
        type: 'ORDER_STATUS_UPDATED',
        data: order,
        userId
      });
    } catch (error) {
      logger.error('Failed to publish order status updated event:', error);
      // Continue with the response even if event publishing fails
    }

    res.json(order);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Order not found' });
      }
      return res.status(400).json({ error: 'Invalid order status update' });
    }
    logger.error('Error in updateOrderStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getOrders(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    logger.error('Error in getOrders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}