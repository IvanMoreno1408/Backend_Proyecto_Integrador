import { supabase } from '../config/supabase';
import { Testimonio } from '../types/models';
import { FiltrosTestimonioDto } from '../types/dtos';

const DEFAULT_LIMIT = 20;

export const testimonioRepository = {
  async findAll(filtros: FiltrosTestimonioDto): Promise<Testimonio[]> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('testimonios')
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

    if (filtros.destacado !== undefined) {
      query = query.eq('destacado', filtros.destacado);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: number): Promise<Testimonio | null> {
    const { data, error } = await supabase
      .from('testimonios')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data;
  },

  async insert(data: Partial<Testimonio>): Promise<Testimonio> {
    const { data: created, error } = await supabase
      .from('testimonios')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created;
  },

  async update(id: number, data: Partial<Testimonio>): Promise<Testimonio> {
    const { data: updated, error } = await supabase
      .from('testimonios')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  },

  async softDelete(id: number): Promise<void> {
    const { error } = await supabase
      .from('testimonios')
      .update({ estado: 'eliminado', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  async countAll(filtros: FiltrosTestimonioDto): Promise<number> {
    let query = supabase
      .from('testimonios')
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

    if (filtros.destacado !== undefined) {
      query = query.eq('destacado', filtros.destacado);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
