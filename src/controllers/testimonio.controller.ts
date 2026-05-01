import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { testimonioService } from '../services/testimonio.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';
import { FiltrosTestimonioDto } from '../types/dtos';
import { EstadoContenido } from '../types/models';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const crearTestimonioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  cargo: z.string().nullable().optional(),
  empresa: z.string().nullable().optional(),
  contenido: z.string().min(1, 'El contenido es requerido'),
  foto_url: z.string().url().nullable().optional(),
  instagram_url: z.string().url().nullable().optional(),
  facebook_url: z.string().url().nullable().optional(),
  destacado: z.boolean().optional(),
  pais_id: z.number().int().positive().optional(),
});

const actualizarTestimonioSchema = z.object({
  nombre: z.string().min(1).optional(),
  cargo: z.string().nullable().optional(),
  empresa: z.string().nullable().optional(),
  contenido: z.string().min(1).optional(),
  foto_url: z.string().url().nullable().optional(),
  instagram_url: z.string().url().nullable().optional(),
  facebook_url: z.string().url().nullable().optional(),
  destacado: z.boolean().optional(),
});

const marcarDestacadoSchema = z.object({
  destacado: z.boolean({ required_error: 'El campo destacado es requerido' }),
});

const estadosValidos: EstadoContenido[] = ['borrador', 'publicado', 'despublicado', 'eliminado'];

// ─── Controller ───────────────────────────────────────────────────────────────

export const testimonioController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const filtros: FiltrosTestimonioDto = {
        pais_id: req.paisFiltro ?? undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      if (req.query.estado) {
        const estado = req.query.estado as string;
        if (!estadosValidos.includes(estado as EstadoContenido)) {
          return next(new AppError('Estado inválido', 422));
        }
        filtros.estado = estado as EstadoContenido;
      }

      if (req.query.destacado !== undefined) {
        filtros.destacado = req.query.destacado === 'true';
      }

      const result = await testimonioService.listar(filtros, req.usuario);
      sendResponse(res, 200, result, 'Testimonios obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const result = crearTestimonioSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const testimonio = await testimonioService.crear(result.data, req.usuario);
      sendResponse(res, 201, testimonio, 'Testimonio creado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const { testimonioRepository } = await import('../repositories/testimonio.repository');
      const testimonio = await testimonioRepository.findById(id);
      if (!testimonio) {
        return next(new AppError('Recurso no encontrado', 404));
      }

      // Enforce country access for admin_pais and editor
      if (req.usuario.rol === 'admin_pais' || req.usuario.rol === 'editor') {
        if (testimonio.pais_id !== req.usuario.pais_id) {
          return next(new AppError('Acceso denegado al recurso de otro país', 403));
        }
      }

      sendResponse(res, 200, testimonio, 'Testimonio obtenido exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const result = actualizarTestimonioSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const testimonio = await testimonioService.actualizar(id, result.data, req.usuario);
      sendResponse(res, 200, testimonio, 'Testimonio actualizado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      await testimonioService.eliminar(id, req.usuario);
      sendResponse(res, 200, null, 'Testimonio eliminado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async publicar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const testimonio = await testimonioService.publicar(id, req.usuario);
      sendResponse(res, 200, testimonio, 'Testimonio publicado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async despublicar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const testimonio = await testimonioService.despublicar(id, req.usuario);
      sendResponse(res, 200, testimonio, 'Testimonio despublicado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async marcarDestacado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const result = marcarDestacadoSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const testimonio = await testimonioService.marcarDestacado(
        id,
        result.data.destacado,
        req.usuario
      );
      sendResponse(res, 200, testimonio, 'Testimonio actualizado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  // ─── Public endpoints ──────────────────────────────────────────────────────

  async listarPublicas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paisSlug } = req.params;
      const { paisRepository } = await import('../repositories/pais.repository');
      const pais = await paisRepository.findBySlug(paisSlug);
      if (!pais) {
        return next(new AppError('Recurso no encontrado', 404));
      }

      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const filtros: FiltrosTestimonioDto = {
        pais_id: pais.id,
        estado: 'publicado',
        page,
        limit,
      };

      // Use a dummy superadmin-like payload to bypass role filtering in service
      const dummyUsuario = {
        usuario_id: 0,
        rol: 'superadmin' as const,
        pais_id: null,
        username: 'public',
      };

      const result = await testimonioService.listar(filtros, dummyUsuario);
      sendResponse(res, 200, result, 'Testimonios públicos obtenidos exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
