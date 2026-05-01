import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { noticiaService } from '../services/noticia.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';
import { FiltrosNoticiaDto } from '../types/dtos';
import { EstadoContenido } from '../types/models';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const crearNoticiaSchema = z.object({
  titulo: z.string().min(1, 'El título es requerido'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  resumen: z.string().min(1, 'El resumen es requerido'),
  contenido: z.string().min(1, 'El contenido es requerido'),
  imagen_principal_url: z.string().url().nullable().optional(),
  pais_id: z.number().int().positive().optional(),
});

const actualizarNoticiaSchema = z.object({
  titulo: z.string().min(1).optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  resumen: z.string().min(1).optional(),
  contenido: z.string().min(1).optional(),
  imagen_principal_url: z.string().url().nullable().optional(),
});

const estadosValidos: EstadoContenido[] = ['borrador', 'publicado', 'despublicado', 'eliminado'];

// ─── Controller ───────────────────────────────────────────────────────────────

export const noticiaController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const filtros: FiltrosNoticiaDto = {
        pais_id: req.paisFiltro ?? undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        autor_id: req.query.autor_id ? parseInt(req.query.autor_id as string, 10) : undefined,
      };

      if (req.query.estado) {
        const estado = req.query.estado as string;
        if (!estadosValidos.includes(estado as EstadoContenido)) {
          return next(new AppError('Estado inválido', 422));
        }
        filtros.estado = estado as EstadoContenido;
      }

      const result = await noticiaService.listar(filtros, req.usuario);
      sendResponse(res, 200, result, 'Noticias obtenidas exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const result = crearNoticiaSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const noticia = await noticiaService.crear(result.data, req.usuario);
      sendResponse(res, 201, noticia, 'Noticia creada exitosamente');
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

      const { noticiaRepository } = await import('../repositories/noticia.repository');
      const noticia = await noticiaRepository.findById(id);
      if (!noticia) {
        return next(new AppError('Recurso no encontrado', 404));
      }

      // Enforce country access for admin_pais and editor
      if (req.usuario.rol === 'admin_pais' || req.usuario.rol === 'editor') {
        if (noticia.pais_id !== req.usuario.pais_id) {
          return next(new AppError('Acceso denegado al recurso de otro país', 403));
        }
      }

      sendResponse(res, 200, noticia, 'Noticia obtenida exitosamente');
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

      const result = actualizarNoticiaSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const noticia = await noticiaService.actualizar(id, result.data, req.usuario);
      sendResponse(res, 200, noticia, 'Noticia actualizada exitosamente');
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

      await noticiaService.eliminar(id, req.usuario);
      sendResponse(res, 200, null, 'Noticia eliminada exitosamente');
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

      const noticia = await noticiaService.publicar(id, req.usuario);
      sendResponse(res, 200, noticia, 'Noticia publicada exitosamente');
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

      const noticia = await noticiaService.despublicar(id, req.usuario);
      sendResponse(res, 200, noticia, 'Noticia despublicada exitosamente');
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

      const filtros: FiltrosNoticiaDto = {
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

      const result = await noticiaService.listar(filtros, dummyUsuario);
      sendResponse(res, 200, result, 'Noticias públicas obtenidas exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async obtenerPublica(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paisSlug, noticiaSlug } = req.params;
      const noticia = await noticiaService.obtenerPublica(paisSlug, noticiaSlug);
      sendResponse(res, 200, noticia, 'Noticia obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
