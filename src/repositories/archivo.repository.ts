import { supabase } from '../config/supabase';
import { Archivo } from '../types/models';

export const archivoRepository = {
  async insert(data: Partial<Archivo>): Promise<Archivo> {
    const { data: created, error } = await supabase
      .from('archivos')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created;
  },

  async findById(id: number): Promise<Archivo | null> {
    const { data, error } = await supabase
      .from('archivos')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data;
  },
};
