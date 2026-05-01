import { testimonioRepository } from '../repositories/testimonio.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { Testimonio } from '../types/models';
import {
  CrearTestimonioDto,
  ActualizarTestimonioDto,
  FiltrosTestimonioDto,
  JwtPayload,
  PaginatedResponse,
} from '../types/dtos';

const MAX_LIMIT = 20;

export const testimonioService = {
  async listar(
    filtros: FiltrosTestimonioDto,
    usuario: JwtPayload
  ): Promise<PaginatedResponse<Testimonio>> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? MAX_LIMIT, MAX_LIMIT);

    // Enforce country filter for admin_pais and editor
    const filtrosEfectivos: FiltrosTestimonioDto = { ...filtros, page, limit };
    if (usuario.rol === 'admin_pais' || usuario.rol === 'editor') {
      filtrosEfectivos.pais_id = usuario.pais_id ?? undefined;
    }

    const [testimonios, total] = await Promise.all([
      testimonioRepository.findAll(filtrosEfectivos),
      testimonioRepository.countAll(filtrosEfectivos),
    ]);

    return { data: testimonios, total, page, limit };
  },

  async crear(data: CrearTestimonioDto, usuario: JwtPayload): Promise<Testimonio> {
    // Validate required fields
    const missingFields: string[] = [];
    if (!data.nombre || data.nombre.trim() === '') missingFields.push('nombre');
    if (!data.contenido || data.contenido.trim() === '') missingFields.push('contenido');
    if (missingFields.length > 0) {
      throw new AppError(
        'Campos requeridos faltantes',
        422,
        missingFields.map(f => `${f}: El campo es requerido`)
      );
    }

    // Determine pais_id
    let pais_id: number;
    if (usuario.rol === 'superadmin') {
      if (!data.pais_id) {
        throw new AppError('El campo pais_id es requerido para superadmin', 422);
      }
      pais_id = data.pais_id;
    } else {
      // admin_pais and editor use their own pais_id
      if (!usuario.pais_id) {
        throw new AppError('El usuario no tiene un país asignado', 422);
      }
      pais_id = usuario.pais_id;
    }

    const testimonio = await testimonioRepository.insert({
      nombre: data.nombre,
      cargo: data.cargo ?? null,
      empresa: data.empresa ?? null,
      contenido: data.contenido,
      foto_url: data.foto_url ?? null,
      instagram_url: data.instagram_url ?? null,
      facebook_url: data.facebook_url ?? null,
      destacado: data.destacado ?? false,
      pais_id,
      autor_id: usuario.usuario_id,
      estado: 'borrador',
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'CREAR',
      modulo: 'testimonios',
      registro_id: testimonio.id,
      descripcion: `Testimonio creado: ${testimonio.nombre}`,
    });

    return testimonio;
  },

  async actualizar(
    id: number,
    data: ActualizarTestimonioDto,
    usuario: JwtPayload
  ): Promise<Testimonio> {
    const testimonio = await testimonioRepository.findById(id);
    if (!testimonio) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais and editor
    if (usuario.rol === 'admin_pais' || usuario.rol === 'editor') {
      if (testimonio.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await testimonioRepository.update(id, data);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'EDITAR',
      modulo: 'testimonios',
      registro_id: id,
      descripcion: `Testimonio actualizado: ${updated.nombre}`,
    });

    return updated;
  },

  async eliminar(id: number, usuario: JwtPayload): Promise<void> {
    // Only admin_pais and superadmin can delete; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const testimonio = await testimonioRepository.findById(id);
    if (!testimonio) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (testimonio.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    await testimonioRepository.softDelete(id);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'ELIMINAR',
      modulo: 'testimonios',
      registro_id: id,
      descripcion: `Testimonio eliminado: ${testimonio.nombre}`,
    });
  },

  async publicar(id: number, usuario: JwtPayload): Promise<Testimonio> {
    // Only admin_pais and superadmin can publish; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const testimonio = await testimonioRepository.findById(id);
    if (!testimonio) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (testimonio.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await testimonioRepository.update(id, {
      estado: 'publicado',
      fecha_publicacion: new Date().toISOString(),
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'PUBLICAR',
      modulo: 'testimonios',
      registro_id: id,
      descripcion: `Testimonio publicado: ${testimonio.nombre}`,
    });

    return updated;
  },

  async despublicar(id: number, usuario: JwtPayload): Promise<Testimonio> {
    // Only admin_pais and superadmin can unpublish; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const testimonio = await testimonioRepository.findById(id);
    if (!testimonio) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (testimonio.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await testimonioRepository.update(id, {
      estado: 'despublicado',
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'DESPUBLICAR',
      modulo: 'testimonios',
      registro_id: id,
      descripcion: `Testimonio despublicado: ${testimonio.nombre}`,
    });

    return updated;
  },

  async marcarDestacado(
    id: number,
    destacado: boolean,
    usuario: JwtPayload
  ): Promise<Testimonio> {
    // Only admin_pais and superadmin can mark as destacado; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const testimonio = await testimonioRepository.findById(id);
    if (!testimonio) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (testimonio.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await testimonioRepository.update(id, { destacado });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'DESTACAR',
      modulo: 'testimonios',
      registro_id: id,
      descripcion: `Testimonio ${destacado ? 'marcado como destacado' : 'desmarcado como destacado'}: ${testimonio.nombre}`,
    });

    return updated;
  },
};
