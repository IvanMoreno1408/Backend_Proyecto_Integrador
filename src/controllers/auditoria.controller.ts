import { Request, Response, NextFunction } from 'express';
import { auditoriaService } from '../services/auditoria.service';
import { sendResponse, AppError } from '../middlewares/errorHandler';
import { FiltrosAuditoriaDto } from '../types/dtos';

export const auditoriaController = {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const filtros: FiltrosAuditoriaDto = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        usuario_id: req.query.usuario_id
          ? parseInt(req.query.usuario_id as string, 10)
          : undefined,
        modulo: req.query.modulo as string | undefined,
        accion: req.query.accion as string | undefined,
      };

      const result = await auditoriaService.listar(filtros);
      sendResponse(res, 200, result, 'Bitácora de auditoría obtenida exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
