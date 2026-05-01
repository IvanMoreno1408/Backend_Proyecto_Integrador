import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { solicitudService } from '../services/solicitud.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';
import { FiltrosSolicitudDto } from '../types/dtos';
import { EstadoSolicitud } from '../types/models';

// ─── Zod schemas ──────────────────────────────────────────────────────────────

const crearSolicitudSchema = z.object({
  pais_id: z.number({ required_error: 'El campo pais_id es requerido' }).int().positive(),
  nombre: z.string({ required_error: 'El campo nombre es requerido' }).min(1, 'El nombre es requerido'),
  correo: z
    .string({ required_error: 'El campo correo es requerido' })
    .min(1, 'El correo es requerido')
    .email('El formato del correo electrónico no es válido'),
  telefono: z.string().nullable().optional(),
  finalidad: z.string().nullable().optional(),
  mensaje: z.string().min(1, 'El mensaje es requerido').nullable().optional(),
});

const actualizarEstadoSchema = z.object({
  estado: z.enum(
    ['pendiente', 'en_proceso', 'gestionada', 'cerrada', 'eliminado'],
    { required_error: 'El campo estado es requerido' }
  ),
});

const agregarObservacionesSchema = z.object({
  observaciones: z
    .string({ required_error: 'El campo observaciones es requerido' })
    .min(1, 'Las observaciones no pueden estar vacías'),
});

const estadosValidos: EstadoSolicitud[] = [
  'pendiente',
  'en_proceso',
  'gestionada',
  'cerrada',
  'eliminado',
];

// ─── Controller ───────────────────────────────────────────────────────────────

export const solicitudController = {
  /**
   * POST /api/solicitudes — public, no auth required
   */
  async crearPublica(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = crearSolicitudSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const solicitud = await solicitudService.crearPublica(result.data);
      sendResponse(res, 201, solicitud, 'Solicitud de contacto enviada exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/solicitudes — verifyToken + applyPaisFilter
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const filtros: FiltrosSolicitudDto = {
        pais_id: req.paisFiltro ?? undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      if (req.query.estado) {
        const estado = req.query.estado as string;
        if (!estadosValidos.includes(estado as EstadoSolicitud)) {
          return next(new AppError('Estado inválido', 422));
        }
        filtros.estado = estado as EstadoSolicitud;
      }

      const result = await solicitudService.listar(filtros, req.usuario);
      sendResponse(res, 200, result, 'Solicitudes obtenidas exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/solicitudes/:id — verifyToken
   */
  async obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const solicitud = await solicitudService.obtener(id, req.usuario);
      sendResponse(res, 200, solicitud, 'Solicitud obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/solicitudes/:id/estado — verifyToken + requireRole('superadmin','admin_pais')
   */
  async actualizarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const result = actualizarEstadoSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const solicitud = await solicitudService.actualizarEstado(id, result.data, req.usuario);
      sendResponse(res, 200, solicitud, 'Estado de solicitud actualizado exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/solicitudes/:id/observaciones — verifyToken + requireRole('superadmin','admin_pais')
   */
  async agregarObservaciones(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      const result = agregarObservacionesSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const solicitud = await solicitudService.agregarObservaciones(
        id,
        result.data.observaciones,
        req.usuario
      );
      sendResponse(res, 200, solicitud, 'Observaciones actualizadas exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/solicitudes/:id — verifyToken + requireRole('superadmin','admin_pais')
   */
  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return next(new AppError('ID inválido', 400));
      }

      await solicitudService.eliminar(id, req.usuario);
      sendResponse(res, 200, null, 'Solicitud eliminada exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
