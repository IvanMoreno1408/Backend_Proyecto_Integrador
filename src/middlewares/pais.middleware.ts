import { Request, Response, NextFunction } from 'express';

export const applyPaisFilter = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.usuario) {
    req.paisFiltro = null;
    return next();
  }
  if (req.usuario.rol === 'superadmin') {
    req.paisFiltro = req.query.pais_id ? parseInt(req.query.pais_id as string, 10) : null;
  } else {
    req.paisFiltro = req.usuario.pais_id;
  }
  next();
};
