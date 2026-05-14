import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.me);

export default router;
