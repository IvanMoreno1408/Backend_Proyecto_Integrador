import { Router } from 'express';
import { noticiaController } from '../controllers/noticia.controller';
import { testimonioController } from '../controllers/testimonio.controller';

const router = Router();

// GET /public/:paisSlug/noticias — published news for a country, paginated
router.get('/:paisSlug/noticias', noticiaController.listarPublicas);

// GET /public/:paisSlug/noticias/:noticiaSlug — single published news (404 if not published)
router.get('/:paisSlug/noticias/:noticiaSlug', noticiaController.obtenerPublica);

// GET /public/:paisSlug/testimonios — published testimonials for a country, paginated
router.get('/:paisSlug/testimonios', testimonioController.listarPublicas);

export default router;
