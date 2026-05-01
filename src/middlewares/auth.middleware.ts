import { Request, Response, NextFunction } from 'express';
import { verifyToken as jwtVerify } from '../config/jwt';
import { AppError } from './errorHandler';

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticación requerido', 401));
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwtVerify(token);
    req.usuario = payload;
    next();
  } catch {
    next(new AppError('Token inválido o expirado', 401));
  }
};
