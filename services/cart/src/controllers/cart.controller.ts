import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@ecommerce/logger';
import { AuthRequest } from '@ecommerce/middleware';
import { rabbitMQ } from '../index';

const prisma = new PrismaClient();

export async function addToCart(req: AuthRequest, res: Response) {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid productId and quantity are required' });
    }

    let cart = await prisma.cart.findFirst({ where: { userId } });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    const cartItem = await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });

    try {
      await rabbitMQ.publishToQueue('cart_events', {
        type: 'ITEM_ADDED',
        data: { cartId: cart.id, item: cartItem },
        userId
      });
    } catch (error) {
      logger.error('Failed to publish cart event:', error);
      // Continue with the response even if event publishing fails
    }

    res.status(201).json(cartItem);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: 'Invalid cart operation' });
    }
    logger.error('Error in addToCart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCart(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    res.json(cart);
  } catch (error) {
    logger.error('Error in getCart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}