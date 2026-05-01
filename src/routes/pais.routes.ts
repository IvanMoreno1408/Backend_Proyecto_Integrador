import { Router } from 'express';
import { paisController } from '../controllers/pais.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.get('/', verifyToken, requireRole('superadmin'), paisController.listar);
router.post('/', verifyToken, requireRole('superadmin'), paisController.crear);
router.put('/:id', verifyToken, requireRole('superadmin'), paisController.actualizar);
router.delete('/:id', verifyToken, requireRole('superadmin'), paisController.eliminar);

export default router;
