import { Router } from 'express';
import { solicitudController } from '../controllers/solicitud.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { applyPaisFilter } from '../middlewares/pais.middleware';

const router = Router();

// ─── Rutas públicas (sin token) ───────────────────────────────────────────────
// POST /api/solicitudes         — crear solicitud
// POST /api/solicitudes/public  — alias README
router.post('/public', solicitudController.crearPublica);
router.post('/', solicitudController.crearPublica);

// ─── Rutas admin (con token) ──────────────────────────────────────────────────
// GET /api/solicitudes
router.get('/', verifyToken, applyPaisFilter, solicitudController.listar);

// GET /api/solicitudes/:id
router.get('/:id', verifyToken, solicitudController.obtener);

// PUT /api/solicitudes/:id/status  — alias README (cambia estado + observaciones)
router.put(
  '/:id/status',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.actualizarEstado
);

// PATCH /api/solicitudes/:id/estado — nombre original en español
router.patch(
  '/:id/estado',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.actualizarEstado
);

// PATCH /api/solicitudes/:id/observaciones
router.patch(
  '/:id/observaciones',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.agregarObservaciones
);

// DELETE /api/solicitudes/:id
router.delete(
  '/:id',
  verifyToken,
  requireRole('superadmin', 'admin_pais'),
  solicitudController.eliminar
);

export default router;
