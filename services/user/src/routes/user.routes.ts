import { Router } from 'express';
import { register, login } from '../controllers/user.controller';

const userRouter = Router();

userRouter.post('/register', register);
userRouter.post('/login', login);

export { userRouter };