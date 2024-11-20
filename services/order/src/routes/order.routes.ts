import { Router } from 'express';
import { createOrder, updateOrderStatus, getOrders } from '../controllers/order.controller';
import { auth } from '@ecommerce/middleware';

const orderRouter = Router();

// Protected routes
orderRouter.post('/', auth, createOrder);
orderRouter.patch('/:id/status', auth, updateOrderStatus);
orderRouter.get('/', auth, getOrders);

export { orderRouter };