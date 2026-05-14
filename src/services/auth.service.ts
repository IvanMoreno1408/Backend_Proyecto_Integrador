import bcrypt from 'bcryptjs';
import { signToken } from '../config/jwt';
import { usuarioRepository } from '../repositories/usuario.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { JwtPayload } from '../types/dtos';
import { Usuario } from '../types/models';

const SALT_ROUNDS = 10;

export const authService = {
  async login(
    username: string,
    password: string,
    ip: string
  ): Promise<{ token: string; usuario: Omit<Usuario, 'password_hash'> }> {
    const usuario = await usuarioRepository.findByUsername(username);
    if (!usuario) {
      throw new AppError('Credenciales incorrectas', 401);
    }
    if (usuario.estado === 'inactivo') {
      throw new AppError('La cuenta está deshabilitada', 403);
    }
    const passwordValid = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValid) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    const payload: JwtPayload = {
      usuario_id: usuario.id,
      rol: usuario.rol as JwtPayload['rol'],
      pais_id: usuario.pais_id,
      username: usuario.username,
    };
    const token = signToken(payload);

    await auditoriaRepository.registrar({
      usuario_id: usuario.id,
      accion: 'LOGIN',
      modulo: 'auth',
      descripcion: `Login exitoso para usuario ${username}`,
      ip,
    });

    const { password_hash, respuesta_seguridad_hash, roles, ...usuarioSinPassword } = usuario as any;
    return { token, usuario: usuarioSinPassword as Omit<Usuario, 'password_hash'> };
  },

  async logout(usuario_id: number, ip: string): Promise<void> {
    await auditoriaRepository.registrar({
      usuario_id,
      accion: 'LOGOUT',
      modulo: 'auth',
      descripcion: `Logout para usuario_id ${usuario_id}`,
      ip,
    });
  },

  // ─── Parte 17: Recuperación de contraseña ──────────────────────────────────

  /**
   * Devuelve la pregunta de seguridad del usuario identificado por username o email.
   * No revela si el usuario existe o no con el mismo mensaje de error.
   */
  async obtenerPreguntaSeguridad(
    identifier: string
  ): Promise<{ username: string; pregunta_seguridad: string }> {
    const usuario = await usuarioRepository.findByIdentifier(identifier);

    if (!usuario || !usuario.pregunta_seguridad) {
      throw new AppError('No se encontró una pregunta de seguridad para ese usuario', 404);
    }
    if (usuario.estado === 'inactivo') {
      throw new AppError('La cuenta está deshabilitada', 403);
    }

    return {
      username: usuario.username,
      pregunta_seguridad: usuario.pregunta_seguridad,
    };
  },

  /**
   * Restablece la contraseña verificando la respuesta de seguridad.
   */
  async restablecerPassword(
    username: string,
    respuesta_seguridad: string,
    nueva_password: string,
    ip: string
  ): Promise<void> {
    const usuario = await usuarioRepository.findByUsername(username);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }
    if (usuario.estado === 'inactivo') {
      throw new AppError('La cuenta está deshabilitada', 403);
    }
    if (!usuario.respuesta_seguridad_hash) {
      throw new AppError('Este usuario no tiene configurada una pregunta de seguridad', 422);
    }

    const respuestaValida = await bcrypt.compare(
      respuesta_seguridad.toLowerCase().trim(),
      usuario.respuesta_seguridad_hash
    );
    if (!respuestaValida) {
      throw new AppError('La respuesta de seguridad es incorrecta', 401);
    }

    const password_hash = await bcrypt.hash(nueva_password, SALT_ROUNDS);

    await usuarioRepository.update(usuario.id, {
      password_hash,
      password_updated_at: new Date().toISOString(),
    } as Partial<Usuario>);

    await auditoriaRepository.registrar({
      usuario_id: usuario.id,
      accion: 'RESET_PASSWORD',
      modulo: 'auth',
      descripcion: `Contraseña restablecida mediante pregunta de seguridad para ${username}`,
      ip,
    });
  },

  /**
   * Cambia la contraseña del usuario autenticado verificando la contraseña actual.
   */
  async cambiarPasswordPropia(
    usuario_id: number,
    password_actual: string,
    nueva_password: string,
    ip: string
  ): Promise<void> {
    const usuario = await usuarioRepository.findById(usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const passwordValida = await bcrypt.compare(password_actual, usuario.password_hash);
    if (!passwordValida) {
      throw new AppError('La contraseña actual es incorrecta', 401);
    }

    if (password_actual === nueva_password) {
      throw new AppError('La nueva contraseña debe ser diferente a la actual', 422);
    }

    const password_hash = await bcrypt.hash(nueva_password, SALT_ROUNDS);

    await usuarioRepository.update(usuario_id, {
      password_hash,
      password_updated_at: new Date().toISOString(),
    } as Partial<Usuario>);

    await auditoriaRepository.registrar({
      usuario_id,
      accion: 'CHANGE_PASSWORD',
      modulo: 'auth',
      descripcion: `Contraseña cambiada por el propio usuario ${usuario.username}`,
      ip,
    });
  },

  /**
   * Actualiza la pregunta y respuesta de seguridad del usuario autenticado.
   */
  async actualizarPreguntaSeguridad(
    usuario_id: number,
    pregunta_seguridad: string,
    respuesta_seguridad: string,
    ip: string
  ): Promise<void> {
    const usuario = await usuarioRepository.findById(usuario_id);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Normalizar la respuesta antes de hashear (minúsculas y sin espacios extremos)
    const respuesta_seguridad_hash = await bcrypt.hash(
      respuesta_seguridad.toLowerCase().trim(),
      SALT_ROUNDS
    );

    await usuarioRepository.update(usuario_id, {
      pregunta_seguridad,
      respuesta_seguridad_hash,
    } as Partial<Usuario>);

    await auditoriaRepository.registrar({
      usuario_id,
      accion: 'UPDATE_SECURITY_QUESTION',
      modulo: 'auth',
      descripcion: `Pregunta de seguridad actualizada para ${usuario.username}`,
      ip,
    });
  },
};
