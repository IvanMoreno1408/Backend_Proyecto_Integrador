import { Router } from 'express';
import multer from 'multer';
import { archivoController } from '../controllers/archivo.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Use memory storage so the file buffer is available for Supabase upload
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/archivos — any authenticated user can upload
router.post('/', verifyToken, upload.single('archivo'), archivoController.subir);

export default router;
