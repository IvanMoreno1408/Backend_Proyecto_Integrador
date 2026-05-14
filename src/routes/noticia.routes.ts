import { Router } from 'express';
import { noticiaController } from '../controllers/noticia.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { applyPaisFilter } from '../middlewares/pais.middleware';

const router = Router();

// ─── Rutas públicas (sin token) — ANTES de /:id para evitar conflictos ────────
router.get('/public/:paisSlug', noticiaController.listarPublicas);
router.get('/public/:paisSlug/:noticiaSlug', noticiaController.obtenerPublica);

// ─── Rutas admin (con token) ──────────────────────────────────────────────────
router.get('/', verifyToken, applyPaisFilter, noticiaController.listar);

router.post(
  '/',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  noticiaController.crear
);

// Rutas con :id van DESPUÉS de las rutas con segmentos fijos
router.patch(
  '/:id/publicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  noticiaController.publicar
);

router.patch(
  '/:id/despublicar',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  noticiaController.despublicar
);

router.get('/:id', verifyToken, noticiaController.obtener);

router.put(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais', 'editor'),
  noticiaController.actualizar
);

router.delete(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  noticiaController.eliminar
);

export default router;
