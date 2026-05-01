import { paisRepository } from '../repositories/pais.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { Pais } from '../types/models';
import { CrearPaisDto, ActualizarPaisDto, JwtPayload } from '../types/dtos';

export const paisService = {
  async listar(): Promise<Pais[]> {
    return paisRepository.findAll();
  },

  async crear(data: CrearPaisDto, usuario: JwtPayload): Promise<Pais> {
    // Enforce uniqueness of codigo
    const existingCodigo = await paisRepository.findByCodigo(data.codigo);
    if (existingCodigo) {
      throw new AppError('Ya existe un registro con ese codigo', 409);
    }

    // Enforce uniqueness of slug
    const existingSlug = await paisRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw new AppError('Ya existe un registro con ese slug', 409);
    }

    const pais = await paisRepository.insert(data);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'CREAR',
      modulo: 'paises',
      registro_id: pais.id,
      descripcion: `País creado: ${pais.nombre} (${pais.codigo})`,
    });

    return pais;
  },

  async actualizar(id: number, data: ActualizarPaisDto, usuario: JwtPayload): Promise<Pais> {
    const existing = await paisRepository.findById(id);
    if (!existing) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Check codigo uniqueness if being updated
    if (data.codigo && data.codigo !== existing.codigo) {
      const codigoConflict = await paisRepository.findByCodigo(data.codigo);
      if (codigoConflict) {
        throw new AppError('Ya existe un registro con ese codigo', 409);
      }
    }

    // Check slug uniqueness if being updated
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await paisRepository.findBySlug(data.slug);
      if (slugConflict) {
        throw new AppError('Ya existe un registro con ese slug', 409);
      }
    }

    const updated = await paisRepository.update(id, data);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'EDITAR',
      modulo: 'paises',
      registro_id: id,
      descripcion: `País actualizado: ${updated.nombre}`,
    });

    return updated;
  },

  async eliminar(id: number, usuario: JwtPayload): Promise<void> {
    const existing = await paisRepository.findById(id);
    if (!existing) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Check for active dependencies before deleting
    const deps = await paisRepository.checkDependencies(id);
    const dependencias: string[] = [];
    if (deps.usuarios > 0) dependencias.push(`${deps.usuarios} usuario(s)`);
    if (deps.noticias > 0) dependencias.push(`${deps.noticias} noticia(s)`);
    if (deps.testimonios > 0) dependencias.push(`${deps.testimonios} testimonio(s)`);
    if (deps.solicitudes > 0) dependencias.push(`${deps.solicitudes} solicitud(es) de contacto`);

    if (dependencias.length > 0) {
      throw new AppError(
        `No se puede eliminar: existen ${dependencias.join(', ')} asociadas`,
        409
      );
    }

    await paisRepository.update(id, { estado: 'eliminado' });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'ELIMINAR',
      modulo: 'paises',
      registro_id: id,
      descripcion: `País eliminado: ${existing.nombre} (${existing.codigo})`,
    });
  },
};
