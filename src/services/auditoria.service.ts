import { auditoriaRepository } from '../repositories/auditoria.repository';
import { BitacoraAuditoria } from '../types/models';
import { FiltrosAuditoriaDto, PaginatedResponse } from '../types/dtos';

const MAX_LIMIT = 50;

export const auditoriaService = {
  async listar(filtros: FiltrosAuditoriaDto): Promise<PaginatedResponse<BitacoraAuditoria>> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? MAX_LIMIT, MAX_LIMIT);

    const filtrosEfectivos: FiltrosAuditoriaDto = { ...filtros, page, limit };

    const [registros, total] = await Promise.all([
      auditoriaRepository.findAll(filtrosEfectivos),
      auditoriaRepository.countAll(filtrosEfectivos),
    ]);

    return { data: registros, total, page, limit };
  },
};
