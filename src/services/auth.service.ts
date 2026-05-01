import bcrypt from 'bcryptjs';
import { signToken } from '../config/jwt';
import { usuarioRepository } from '../repositories/usuario.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { JwtPayload } from '../types/dtos';
import { Usuario } from '../types/models';

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

    const { password_hash, roles, ...usuarioSinPassword } = usuario as any;
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
};
