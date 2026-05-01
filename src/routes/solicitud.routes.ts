import { Router } from 'express';
import { solicitudController } from '../controllers/solicitud.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { applyPaisFilter } from '../middlewares/pais.middleware';

const router = Router();

// Create contact request — public, no auth required
router.post('/', solicitudController.crearPublica);

// List contact requests (authenticated, with country filter applied)
router.get('/', verifyToken, applyPaisFilter, solicitudController.listar);

// Get single contact request by ID
router.get('/:id', verifyToken, solicitudController.obtener);

// Update contact request estado
router.patch(
  '/:id/estado',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.actualizarEstado
);

// Add/update admin observations
router.patch(
  '/:id/observaciones',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.agregarObservaciones
);

// Delete contact request (soft delete)
router.delete(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.eliminar
);

export default router;
