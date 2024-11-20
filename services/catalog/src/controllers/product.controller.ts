import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@ecommerce/logger';
import { AuthRequest } from '@ecommerce/middleware';
import { rabbitMQ } from '../index';
import { Response } from 'express';

const prisma = new PrismaClient();

export async function createProduct(req: AuthRequest, res: Response) {
  try {
    const { name, description, price, stock } = req.body;

    // Validate required fields
    if (!name || !description || !price || stock === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name, description, price, and stock are required'
      });
    }

    // Validate price and stock
    if (price < 0 || stock < 0) {
      return res.status(400).json({
        error: 'Price and stock must be non-negative values'
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
      },
    });

    // Publish product created event
    try {
      await rabbitMQ.publishToQueue('catalog_events', {
        type: 'PRODUCT_CREATED',
        data: product,
        userId: req.user?.userId
      });
    } catch (error) {
      logger.error('Failed to publish product created event:', error);
      // Continue with the response even if event publishing fails
    }

    res.status(201).json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    logger.error('Error in createProduct:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProducts(req: AuthRequest, res: Response) {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    logger.error('Error in getProducts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateStock(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    // Validate stock value
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: 'Valid stock value is required' });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { stock: Number(stock) },
    });

    // Publish stock updated event
    try {
      await rabbitMQ.publishToQueue('catalog_events', {
        type: 'STOCK_UPDATED',
        data: product,
        userId: req.user?.userId
      });
    } catch (error) {
      logger.error('Failed to publish stock updated event:', error);
      // Continue with the response even if event publishing fails
    }

    res.json(product);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(400).json({ error: 'Invalid stock update request' });
    }
    logger.error('Error in updateStock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}