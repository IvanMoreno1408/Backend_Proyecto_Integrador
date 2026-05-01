import { Router } from 'express';
import { testimonioController } from '../controllers/testimonio.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { applyPaisFilter } from '../middlewares/pais.middleware';

const router = Router();

// List testimonials (authenticated, with country filter applied)
router.get('/', verifyToken, applyPaisFilter, testimonioController.listar);

// Create testimonial
router.post(
  '/',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  testimonioController.crear
);

// Get single testimonial by ID
router.get('/:id', verifyToken, testimonioController.obtener);

// Update testimonial
router.put(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  testimonioController.actualizar
);

// Delete testimonial (soft delete)
router.delete(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.eliminar
);

// Publish testimonial
router.patch(
  '/:id/publicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.publicar
);

// Unpublish testimonial
router.patch(
  '/:id/despublicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.despublicar
);

// Mark/unmark as destacado
router.patch(
  '/:id/destacado',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.marcarDestacado
);

export default router;
