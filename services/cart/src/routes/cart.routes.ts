import { Router } from 'express';
import { addToCart, getCart } from '../controllers/cart.controller';
import { auth } from '@ecommerce/middleware';

const cartRouter = Router();

// Protected routes
cartRouter.post('/add', auth, addToCart);
cartRouter.get('/', auth, getCart);

export { cartRouter };