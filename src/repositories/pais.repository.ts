import { supabase } from '../config/supabase';
import { Pais } from '../types/models';
import { CrearPaisDto, ActualizarPaisDto } from '../types/dtos';

export interface PaisDependencies {
  usuarios: number;
  noticias: number;
  testimonios: number;
  solicitudes: number;
}

export const paisRepository = {
  async findAll(): Promise<Pais[]> {
    const { data, error } = await supabase
      .from('paises')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: number): Promise<Pais | null> {
    const { data, error } = await supabase
      .from('paises')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data;
  },

  async findBySlug(slug: string): Promise<Pais | null> {
    const { data, error } = await supabase
      .from('paises')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error || !data) return null;
    return data;
  },

  async findByCodigo(codigo: string): Promise<Pais | null> {
    const { data, error } = await supabase
      .from('paises')
      .select('*')
      .eq('codigo', codigo)
      .single();
    if (error || !data) return null;
    return data;
  },

  async insert(data: CrearPaisDto): Promise<Pais> {
    const { data: created, error } = await supabase
      .from('paises')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created;
  },

  async update(id: number, data: ActualizarPaisDto): Promise<Pais> {
    const { data: updated, error } = await supabase
      .from('paises')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  async checkDependencies(id: number): Promise<PaisDependencies> {
    const [usuariosRes, noticiasRes, testimoniosRes, solicitudesRes] = await Promise.all([
      supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('pais_id', id),
      supabase.from('noticias').select('id', { count: 'exact', head: true }).eq('pais_id', id).neq('estado', 'eliminado'),
      supabase.from('testimonios').select('id', { count: 'exact', head: true }).eq('pais_id', id).neq('estado', 'eliminado'),
      supabase.from('solicitudes_contacto').select('id', { count: 'exact', head: true }).eq('pais_id', id).neq('estado', 'eliminado'),
    ]);

    return {
      usuarios: usuariosRes.count ?? 0,
      noticias: noticiasRes.count ?? 0,
      testimonios: testimoniosRes.count ?? 0,
      solicitudes: solicitudesRes.count ?? 0,
    };
  },
};
