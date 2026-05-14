import { Router } from 'express';
import { usuarioController } from '../controllers/usuario.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';

const router = Router();

router.get('/', verifyToken, requireRole('superadmin'), usuarioController.listar);
router.post('/', verifyToken, requireRole('superadmin'), usuarioController.crear);
router.put('/:id', verifyToken, requireRole('superadmin'), usuarioController.actualizar);
router.patch('/:id/desactivar', verifyToken, requireRole('superadmin'), usuarioController.desactivar);

// Parte 17: superadmin cambia contraseña de otro usuario
router.put('/:id/password', verifyToken, requireRole('superadmin'), usuarioController.cambiarPasswordAdmin);

export default router;
