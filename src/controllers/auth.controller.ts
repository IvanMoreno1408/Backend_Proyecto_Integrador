import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { usuarioRepository } from '../repositories/usuario.repository';
import { sendResponse, AppError } from '../middlewares/errorHandler';

const loginSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      const { token, usuario } = await authService.login(result.data.username, result.data.password, ip);

      // Respuesta exacta según README
      res.status(200).json({
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          username: usuario.username,
          rol: (usuario as any).rol ?? null,
          pais: usuario.pais_id ?? null,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      await authService.logout(req.usuario.usuario_id, ip);
      sendResponse(res, 200, null, 'Sesión cerrada exitosamente');
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }
      const usuario = await usuarioRepository.findById(req.usuario.usuario_id);
      if (!usuario) {
        return next(new AppError('Usuario no encontrado', 404));
      }
      // Strip password_hash before returning
      const { password_hash, roles, ...perfil } = usuario as any;
      sendResponse(res, 200, perfil, 'Perfil obtenido exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
