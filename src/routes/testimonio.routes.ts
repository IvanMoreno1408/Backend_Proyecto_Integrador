import { Router } from 'express';
import { testimonioController } from '../controllers/testimonio.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { applyPaisFilter } from '../middlewares/pais.middleware';

const router = Router();

// ─── Rutas públicas (sin token) — ANTES de /:id para evitar conflictos ────────
router.get('/public/:paisSlug', testimonioController.listarPublicas);

// ─── Rutas admin (con token) ──────────────────────────────────────────────────
router.get('/', verifyToken, applyPaisFilter, testimonioController.listar);

router.post(
  '/',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  testimonioController.crear
);

// Rutas con :id van DESPUÉS de las rutas con segmentos fijos
router.patch(
  '/:id/publicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.publicar
);

router.patch(
  '/:id/despublicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.despublicar
);

router.patch(
  '/:id/destacado',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.marcarDestacado
);

router.get('/:id', verifyToken, testimonioController.obtener);

router.put(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  testimonioController.actualizar
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  testimonioController.eliminar
);

export default router;
