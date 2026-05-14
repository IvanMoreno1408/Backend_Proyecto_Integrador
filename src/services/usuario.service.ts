import bcrypt from 'bcryptjs';
import { usuarioRepository, UsuarioSinPassword } from '../repositories/usuario.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { supabase } from '../config/supabase';
import {
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  FiltrosUsuarioDto,
  JwtPayload,
  AdminChangePasswordDto,
} from '../types/dtos';
import { Usuario } from '../types/models';

const SALT_ROUNDS = 10;

// Roles that require a pais_id
const ROLES_REQUIRE_PAIS = ['admin_pais', 'editor'];

async function getRolNombreById(rol_id: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('nombre')
    .eq('id', rol_id)
    .single();
  if (error || !data) return null;
  return data.nombre as string;
}

export const usuarioService = {
  async listar(filtros: FiltrosUsuarioDto): Promise<UsuarioSinPassword[]> {
    return usuarioRepository.findAll(filtros);
  },

  async crear(
    data: CrearUsuarioDto,
    usuario: JwtPayload
  ): Promise<UsuarioSinPassword> {
    // Check unique email
    const existingEmail = await usuarioRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    // Check unique username
    const existingUsername = await usuarioRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new AppError('Ya existe un usuario con ese username', 409);
    }

    // Validate pais_id requirement based on role
    const rolNombre = await getRolNombreById(data.rol_id);
    if (rolNombre && ROLES_REQUIRE_PAIS.includes(rolNombre)) {
      if (data.pais_id === undefined || data.pais_id === null) {
        throw new AppError(
          'El campo pais_id es obligatorio para el rol seleccionado',
          422
        );
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const { password, ...rest } = data;
    const insertData: Partial<Usuario> = {
      ...rest,
      password_hash,
      estado: data.estado ?? 'activo',
    };

    const created = await usuarioRepository.insert(insertData);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'CREAR',
      modulo: 'usuarios',
      registro_id: created.id,
      descripcion: `Usuario creado: ${created.username} (${created.email})`,
    });

    const { password_hash: _ph, roles: _roles, ...sinPassword } = created as any;
    return sinPassword as UsuarioSinPassword;
  },

  async actualizar(
    id: number,
    data: ActualizarUsuarioDto,
    usuario: JwtPayload
  ): Promise<UsuarioSinPassword> {
    const existing = await usuarioRepository.findById(id);
    if (!existing) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Check unique email if being updated
    if (data.email && data.email !== existing.email) {
      const emailConflict = await usuarioRepository.findByEmail(data.email);
      if (emailConflict) {
        throw new AppError('Ya existe un usuario con ese email', 409);
      }
    }

    // Check unique username if being updated
    if (data.username && data.username !== existing.username) {
      const usernameConflict = await usuarioRepository.findByUsername(data.username);
      if (usernameConflict) {
        throw new AppError('Ya existe un usuario con ese username', 409);
      }
    }

    // Validate pais_id requirement if rol_id is being changed
    if (data.rol_id !== undefined) {
      const rolNombre = await getRolNombreById(data.rol_id);
      const newPaisId = data.pais_id !== undefined ? data.pais_id : existing.pais_id;
      if (rolNombre && ROLES_REQUIRE_PAIS.includes(rolNombre)) {
        if (newPaisId === undefined || newPaisId === null) {
          throw new AppError(
            'El campo pais_id es obligatorio para el rol seleccionado',
            422
          );
        }
      }
    }

    const updateData: Partial<Usuario> = { ...data } as any;

    // Hash password if provided
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
      delete (updateData as any).password;
    }

    const updated = await usuarioRepository.update(id, updateData);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'EDITAR',
      modulo: 'usuarios',
      registro_id: id,
      descripcion: `Usuario actualizado: ${updated.username}`,
    });

    const { password_hash: _ph, roles: _roles, ...sinPassword } = updated as any;
    return sinPassword as UsuarioSinPassword;
  },

  async desactivar(id: number, usuario: JwtPayload): Promise<void> {
    const existing = await usuarioRepository.findById(id);
    if (!existing) {
      throw new AppError('Recurso no encontrado', 404);
    }

    await usuarioRepository.update(id, { estado: 'inactivo' } as Partial<Usuario>);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'DESACTIVAR',
      modulo: 'usuarios',
      registro_id: id,
      descripcion: `Usuario desactivado: ${existing.username}`,
    });
  },

  // ─── Parte 17: Superadmin cambia contraseña de otro usuario ────────────────

  /**
   * Solo el superadmin puede cambiar la contraseña de cualquier usuario
   * sin necesidad de conocer la contraseña actual.
   */
  async cambiarPasswordAdmin(
    id: number,
    data: AdminChangePasswordDto,
    solicitante: JwtPayload
  ): Promise<void> {
    const existing = await usuarioRepository.findById(id);
    if (!existing) {
      throw new AppError('Recurso no encontrado', 404);
    }

    const password_hash = await bcrypt.hash(data.nueva_password, SALT_ROUNDS);

    await usuarioRepository.update(id, {
      password_hash,
      password_updated_at: new Date().toISOString(),
    } as Partial<Usuario>);

    await auditoriaRepository.registrar({
      usuario_id: solicitante.usuario_id,
      accion: 'ADMIN_CHANGE_PASSWORD',
      modulo: 'usuarios',
      registro_id: id,
      descripcion: `Contraseña cambiada por superadmin para usuario: ${existing.username}`,
    });
  },
};
