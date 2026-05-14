import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { usuarioRepository } from '../repositories/usuario.repository';
import { sendResponse, AppError } from '../middlewares/errorHandler';

// ─── Schemas de validación ────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'El identificador (username o email) es requerido'),
});

const resetPasswordSchema = z.object({
  username: z.string().min(1, 'El username es requerido'),
  respuesta_seguridad: z.string().min(1, 'La respuesta de seguridad es requerida'),
  nueva_password: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

const changePasswordSchema = z.object({
  password_actual: z.string().min(1, 'La contraseña actual es requerida'),
  nueva_password: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

const securityQuestionSchema = z.object({
  pregunta_seguridad: z.string().min(5, 'La pregunta de seguridad debe tener al menos 5 caracteres'),
  respuesta_seguridad: z.string().min(1, 'La respuesta de seguridad es requerida'),
});

// ─── Controller ───────────────────────────────────────────────────────────────

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
      const { password_hash, respuesta_seguridad_hash, roles, ...perfil } = usuario as any;
      sendResponse(res, 200, perfil, 'Perfil obtenido exitosamente');
    } catch (err) {
      next(err);
    }
  },

  // ─── Parte 17: Recuperación y gestión de contraseña ────────────────────────

  /**
   * POST /api/auth/forgot-password
   * Devuelve la pregunta de seguridad del usuario (sin token).
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = forgotPasswordSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const { username, pregunta_seguridad } = await authService.obtenerPreguntaSeguridad(
        result.data.identifier
      );

      res.status(200).json({
        message: 'Pregunta de seguridad encontrada',
        username,
        pregunta_seguridad,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/reset-password
   * Restablece la contraseña verificando la respuesta de seguridad (sin token).
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = resetPasswordSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      await authService.restablecerPassword(
        result.data.username,
        result.data.respuesta_seguridad,
        result.data.nueva_password,
        ip
      );

      sendResponse(res, 200, null, 'Contraseña restablecida exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/change-password
   * El usuario autenticado cambia su propia contraseña.
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const result = changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      await authService.cambiarPasswordPropia(
        req.usuario.usuario_id,
        result.data.password_actual,
        result.data.nueva_password,
        ip
      );

      sendResponse(res, 200, null, 'Contraseña actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/auth/security-question
   * El usuario autenticado actualiza su pregunta y respuesta de seguridad.
   */
  async updateSecurityQuestion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.usuario) {
        return next(new AppError('Token de autenticación requerido', 401));
      }

      const result = securityQuestionSchema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return next(new AppError('Datos de entrada inválidos', 422, errors));
      }

      const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
      await authService.actualizarPreguntaSeguridad(
        req.usuario.usuario_id,
        result.data.pregunta_seguridad,
        result.data.respuesta_seguridad,
        ip
      );

      sendResponse(res, 200, null, 'Pregunta de seguridad actualizada exitosamente');
    } catch (err) {
      next(err);
    }
  },
};
