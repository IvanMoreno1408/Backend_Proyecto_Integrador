import { Router } from 'express';
import { noticiaController } from '../controllers/noticia.controller';
import { testimonioController } from '../controllers/testimonio.controller';
import { solicitudController } from '../controllers/solicitud.controller';

const router = Router();

// GET /api/public/noticias/:paisSlug — noticias publicadas por país
router.get('/noticias/:paisSlug', noticiaController.listarPublicas);

// GET /api/public/noticias/:paisSlug/:noticiaSlug — detalle de noticia publicada
router.get('/noticias/:paisSlug/:noticiaSlug', noticiaController.obtenerPublica);

// GET /api/public/testimonios/:paisSlug — testimonios publicados por país
router.get('/testimonios/:paisSlug', testimonioController.listarPublicas);

// POST /api/public/solicitudes — crear solicitud de contacto sin token
router.post('/solicitudes', solicitudController.crearPublica);

export default router;
