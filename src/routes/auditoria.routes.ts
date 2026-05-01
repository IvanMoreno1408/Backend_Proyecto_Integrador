import { Router } from 'express';
import { auditoriaController } from '../controllers/auditoria.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

// GET /api/auditoria — only superadmin can access
router.get('/', verifyToken, requireRole('superadmin'), auditoriaController.listar);

export default router;
