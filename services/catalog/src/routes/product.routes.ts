import { Router } from 'express';
import { createProduct, getProducts, updateStock } from '../controllers/product.controller';
import { auth, AuthRequest } from '@ecommerce/middleware';

const productRouter = Router();

// Public route
productRouter.get('/', getProducts);

// Protected routes
productRouter.post('/', auth, createProduct);
productRouter.patch('/:id/stock', auth, updateStock);

export { productRouter };