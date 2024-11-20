import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '@ecommerce/logger';
import { rabbitMQ } from '../index';

const prisma = new PrismaClient();

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Ensure the transaction is complete
    await prisma.$executeRaw`COMMIT;`;

    // Publish user created event
    try {
      await rabbitMQ.publishToQueue('user_events', {
        type: 'USER_CREATED',
        data: { id: user.id, email: user.email, name: user.name },
      });
    } catch (error) {
      logger.error('Failed to publish user created event:', error);
      // Continue with the response even if event publishing fails
    }

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error('Error in register:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    logger.error('Error in login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}