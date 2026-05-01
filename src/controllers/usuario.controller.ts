import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usuarioService } from '../services/usuario.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const listarQuerySchema = z.object({
  pais_id: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? parseInt(v, 10) : undefined))
    .refine(v => v === undefined || !isNaN(v as number), { message: 'pais_id debe ser un número' }),
  rol_id: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? parseInt(v, 10) : undefined))
    .refine(v => v === undefined || !isNaN(v as number), { message: 'rol_id debe ser un número' }),
  estado: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? parseInt(v, 10) : undefined))
    .refine(v => v === undefined || (!isNaN(v as number) && (v as number) > 0), {
      message: 'page debe ser un número positivo',
    }),
  limit: z
    .string()
    .optional()
    .transform(v => (v !== undefined ? parseInt(v, 10) : undefined))
    .refine(v => v === undefined || (!isNaN(v as number) && (v as number) > 0), {
      message: 'limit debe ser un número positivo',
    }),
});

const crearUsuarioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  email: z.string().email('El email debe tener un formato válido'),
  username: z.string().min(3, 'El username debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol_id: z.number({ required_error: 'El rol_id es requerido' }).int().positive(),
  pais_id: z.number().int().positive().nullable().optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6).optional(),
  rol_id: z.number().int().positive().optional(),
  pais_id: z.number().int().positive().nullable().optional(),
  estado: z.enum(['activo', 'inactivo']).optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

export const usuarioController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = listarQuerySchema.safeParse(req.query);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Parámetros de consulta inválidos', 422, errors));
      }
      const usuarios = await usuarioService.listar(result.data as any);
      sendResponse(res, 200, usuarios, 'Usuarios obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = crearUsuarioSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      const usuario = await usuarioService.crear(result.data, req.usuario);
      sendResponse(res, 201, usuario, 'Usuario creado exitosamente');
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
      const result = actualizarUsuarioSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      const usuario = await usuarioService.actualizar(id, result.data, req.usuario);
      sendResponse(res, 200, usuario, 'Usuario actualizado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async desactivar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      await usuarioService.desactivar(id, req.usuario);
      sendResponse(res, 200, null, 'Usuario desactivado exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
