import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paisService } from '../services/pais.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';

const crearPaisSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  codigo: z.string().min(1, 'El código es requerido').max(10, 'El código no puede superar 10 caracteres'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

const actualizarPaisSchema = z.object({
  nombre: z.string().min(1).optional(),
  codigo: z.string().min(1).max(10).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

export const paisController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paises = await paisService.listar();
      sendResponse(res, 200, paises, 'Países obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async listarActivos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paises = await paisService.listarActivos();
      sendResponse(res, 200, paises, 'Países activos obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = crearPaisSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      const pais = await paisService.crear(result.data, req.usuario);
      sendResponse(res, 201, pais, 'País creado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }
      const result = actualizarPaisSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      const pais = await paisService.actualizar(id, result.data, req.usuario);
      sendResponse(res, 200, pais, 'País actualizado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      await paisService.eliminar(id, req.usuario);
      sendResponse(res, 200, null, 'País eliminado exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
