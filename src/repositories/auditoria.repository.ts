import { supabase } from '../config/supabase';
import { RegistrarAuditoriaDto, FiltrosAuditoriaDto } from '../types/dtos';
import { BitacoraAuditoria } from '../types/models';

const DEFAULT_LIMIT = 50;

export const auditoriaRepository = {
  async registrar(entrada: RegistrarAuditoriaDto): Promise<void> {
    await supabase.from('bitacora_auditoria').insert(entrada);
  },

  async findAll(filtros: FiltrosAuditoriaDto): Promise<BitacoraAuditoria[]> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? DEFAULT_LIMIT, DEFAULT_LIMIT);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('bitacora_auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filtros.usuario_id !== undefined) {
      query = query.eq('usuario_id', filtros.usuario_id);
    }
    if (filtros.modulo !== undefined) {
      query = query.eq('modulo', filtros.modulo);
    }
    if (filtros.accion !== undefined) {
      query = query.eq('accion', filtros.accion);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async countAll(filtros: FiltrosAuditoriaDto): Promise<number> {
    let query = supabase
      .from('bitacora_auditoria')
      .select('id', { count: 'exact', head: true });

    if (filtros.usuario_id !== undefined) {
      query = query.eq('usuario_id', filtros.usuario_id);
    }
    if (filtros.modulo !== undefined) {
      query = query.eq('modulo', filtros.modulo);
    }
    if (filtros.accion !== undefined) {
      query = query.eq('accion', filtros.accion);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
