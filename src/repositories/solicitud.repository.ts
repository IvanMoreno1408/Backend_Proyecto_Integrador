import { supabase } from '../config/supabase';
import { SolicitudContacto } from '../types/models';
import { FiltrosSolicitudDto } from '../types/dtos';

const DEFAULT_LIMIT = 20;

export const solicitudRepository = {
  async findAll(filtros: FiltrosSolicitudDto): Promise<SolicitudContacto[]> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('solicitudes_contacto')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Exclude 'eliminado' by default unless explicitly filtered
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    } else {
      query = query.neq('estado', 'eliminado');
    }

    if (filtros.pais_id !== undefined) {
      query = query.eq('pais_id', filtros.pais_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: number): Promise<SolicitudContacto | null> {
    const { data, error } = await supabase
      .from('solicitudes_contacto')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data;
  },

  async insert(data: Partial<SolicitudContacto>): Promise<SolicitudContacto> {
    const { data: created, error } = await supabase
      .from('solicitudes_contacto')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created;
  },

  async update(id: number, data: Partial<SolicitudContacto>): Promise<SolicitudContacto> {
    const { data: updated, error } = await supabase
      .from('solicitudes_contacto')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  async softDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from('solicitudes_contacto')
      .update({ estado: 'eliminado', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async countAll(filtros: FiltrosSolicitudDto): Promise<number> {
    let query = supabase
      .from('solicitudes_contacto')
      .select('id', { count: 'exact', head: true });

    // Exclude 'eliminado' by default unless explicitly filtered
    if (filtros.estado) {
      query = query.eq('estado', filtros.estado);
    } else {
      query = query.neq('estado', 'eliminado');
    }

    if (filtros.pais_id !== undefined) {
      query = query.eq('pais_id', filtros.pais_id);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
