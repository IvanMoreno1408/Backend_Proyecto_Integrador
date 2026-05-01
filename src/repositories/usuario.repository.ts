import { supabase } from '../config/supabase';
import { Usuario } from '../types/models';
import { FiltrosUsuarioDto } from '../types/dtos';

export interface UsuarioConRol extends Usuario {
  rol: string;
  roles?: { nombre: string };
}

export type UsuarioSinPassword = Omit<UsuarioConRol, 'password_hash'>;

export const usuarioRepository = {
  async findByUsername(username: string): Promise<UsuarioConRol | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('username', username)
      .single();
    if (error || !data) return null;
    return { ...data, rol: data.roles?.nombre ?? '' };
  },

  async findById(id: number): Promise<UsuarioConRol | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return { ...data, rol: data.roles?.nombre ?? '' };
  },

  async findByEmail(email: string): Promise<UsuarioConRol | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('email', email)
      .single();
    if (error || !data) return null;
    return { ...data, rol: data.roles?.nombre ?? '' };
  },

  async findAll(filtros: FiltrosUsuarioDto): Promise<UsuarioSinPassword[]> {
    let query = supabase
      .from('usuarios')
      .select(
        'id, nombre, apellido, email, username, rol_id, pais_id, estado, ultimo_acceso, created_at, updated_at, roles(nombre)'
      );

    if (filtros.pais_id !== undefined) {
      query = query.eq('pais_id', filtros.pais_id);
    }
    if (filtros.estado !== undefined) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros.rol_id !== undefined) {
      query = query.eq('rol_id', filtros.rol_id);
    }

    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row: any) => ({
      ...row,
      rol: row.roles?.nombre ?? '',
    }));
  },

  async insert(data: Partial<Usuario>): Promise<UsuarioConRol> {
    const { data: created, error } = await supabase
      .from('usuarios')
      .insert(data)
      .select('*, roles(nombre)')
      .single();
    if (error || !created) {
      throw new Error(error?.message ?? 'Error al insertar usuario');
    }
    return { ...created, rol: created.roles?.nombre ?? '' };
  },

  async update(id: number, data: Partial<Usuario>): Promise<UsuarioConRol> {
    const { data: updated, error } = await supabase
      .from('usuarios')
      .update(data)
      .eq('id', id)
      .select('*, roles(nombre)')
      .single();
    if (error || !updated) {
      throw new Error(error?.message ?? 'Error al actualizar usuario');
    }
    return { ...updated, rol: updated.roles?.nombre ?? '' };
  },
};
