import { Request, Response, NextFunction } from 'express';
import { RolNombre } from '../types/models';
import { AppError } from './errorHandler';

export const requireRole = (...roles: RolNombre[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      return next(new AppError('Token de autenticación requerido', 401));
    }
    if (!roles.includes(req.usuario.rol)) {
      return next(new AppError('No tiene permisos para realizar esta acción', 403));
    }
    next();
  };
};
