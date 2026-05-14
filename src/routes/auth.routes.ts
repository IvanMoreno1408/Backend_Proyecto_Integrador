import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas (sin token)
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas (requieren token)
router.post('/logout', verifyToken, authController.logout);
router.get('/me', verifyToken, authController.me);
router.put('/change-password', verifyToken, authController.changePassword);
router.patch('/security-question', verifyToken, authController.updateSecurityQuestion);

export default router;
