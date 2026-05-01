import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { archivoService } from '../services/archivo.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const archivoMetaSchema = z.object({
  modulo: z.string().min(1, 'El campo modulo es requerido'),
  referencia_id: z.number().int().positive().optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export const archivoController = {
  async subir(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      // Validate file presence (multer populates req.file)
      if (!req.file) {
        return next(new AppError('No se proporcionó ningún archivo', 422));
      }

      // Validate and parse metadata from body
      const metaResult = archivoMetaSchema.safeParse({
        modulo: req.body.modulo,
        referencia_id: req.body.referencia_id
          ? parseInt(req.body.referencia_id as string, 10)
          : undefined,
      });

      if (!metaResult.success) {
        const errors = metaResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const archivo = await archivoService.subir(req.file, metaResult.data, req.usuario);
      sendResponse(res, 201, archivo, 'Archivo subido exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
