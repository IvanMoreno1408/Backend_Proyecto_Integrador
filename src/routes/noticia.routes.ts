import { Router } from 'express';
import { noticiaController } from '../controllers/noticia.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { applyPaisFilter } from '../middlewares/pais.middleware';

const router = Router();

// List news (authenticated, with country filter applied)
router.get('/', verifyToken, applyPaisFilter, noticiaController.listar);

// Create news
router.post(
  '/',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  noticiaController.crear
);

// Get single news by ID
router.get('/:id', verifyToken, noticiaController.obtener);

// Update news
router.put(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  noticiaController.actualizar
);

// Delete news (soft delete)
router.delete(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  noticiaController.eliminar
);

// Publish news
router.patch(
  '/:id/publicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  noticiaController.publicar
);

// Unpublish news
router.patch(
  '/:id/despublicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  noticiaController.despublicar
);

export default router;
