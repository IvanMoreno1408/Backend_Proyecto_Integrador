import { solicitudRepository } from '../repositories/solicitud.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { SolicitudContacto } from '../types/models';
import {
  CrearSolicitudDto,
  ActualizarSolicitudDto,
  FiltrosSolicitudDto,
  JwtPayload,
  PaginatedResponse,
} from '../types/dtos';

const MAX_LIMIT = 20;

// Simple email format validator
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const solicitudService = {
  /**
   * Public endpoint — no auth required.
   * Validates required fields and email format, then persists with estado='pendiente'.
   */
  async crearPublica(data: CrearSolicitudDto): Promise<SolicitudContacto> {
    // Validate required fields
    const missingFields: string[] = [];
    if (!data.pais_id) missingFields.push('pais_id');
    if (!data.nombre || data.nombre.trim() === '') missingFields.push('nombre');
    if (!data.correo || data.correo.trim() === '') missingFields.push('correo');
    if (!data.mensaje || data.mensaje.trim() === '') missingFields.push('mensaje');

    if (missingFields.length > 0) {
      throw new AppError(
        'Campos requeridos faltantes',
        422,
        missingFields.map(f => `${f}: El campo es requerido`)
      );
    }

    // Validate email format
    if (!isValidEmail(data.correo)) {
      throw new AppError('Formato de correo electrónico inválido', 422, [
        'correo: El formato del correo electrónico no es válido',
      ]);
    }

    const solicitud = await solicitudRepository.insert({
      pais_id: data.pais_id,
      nombre: data.nombre.trim(),
      correo: data.correo.trim(),
      telefono: data.telefono ?? null,
      finalidad: data.finalidad ?? null,
      mensaje: data.mensaje?.trim() ?? null,
      estado: 'pendiente',
    });

    return solicitud;
  },

  /**
   * Paginated list, ordered by created_at DESC.
   * admin_pais and editor see only their country's solicitudes.
   */
  async listar(
    filtros: FiltrosSolicitudDto,
    usuario: JwtPayload
  ): Promise<PaginatedResponse<SolicitudContacto>> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? MAX_LIMIT, MAX_LIMIT);

    const filtrosEfectivos: FiltrosSolicitudDto = { ...filtros, page, limit };

    // Enforce country filter for admin_pais and editor
    if (usuario.rol === 'admin_pais' || usuario.rol === 'editor') {
      filtrosEfectivos.pais_id = usuario.pais_id ?? undefined;
    }

    const [solicitudes, total] = await Promise.all([
      solicitudRepository.findAll(filtrosEfectivos),
      solicitudRepository.countAll(filtrosEfectivos),
    ]);

    return { data: solicitudes, total, page, limit };
  },

  /**
   * Returns full detail of a single solicitud.
   * admin_pais and editor can only see their country's solicitudes.
   */
  async obtener(id: number, usuario: JwtPayload): Promise<SolicitudContacto> {
    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country access for admin_pais and editor
    if (usuario.rol === 'admin_pais' || usuario.rol === 'editor') {
      if (solicitud.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    return solicitud;
  },

  /**
   * Updates estado. When estado='gestionada', sets gestionado_por and fecha_gestion.
   * Registers ACTUALIZAR_ESTADO audit entry.
   */
  async actualizarEstado(
    id: number,
    data: ActualizarSolicitudDto,
    usuario: JwtPayload
  ): Promise<SolicitudContacto> {
    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country access for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (solicitud.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updateData: Partial<SolicitudContacto> = {};
    if (data.estado !== undefined) {
      updateData.estado = data.estado;
    }
    if ((data as any).observaciones_admin !== undefined) {
      updateData.observaciones_admin = (data as any).observaciones_admin;
    }

    // When marking as 'gestionada', record who managed it and when
    if (data.estado === 'gestionada') {
      updateData.gestionado_por = usuario.usuario_id;
      updateData.fecha_gestion = new Date().toISOString();
    }

    const updated = await solicitudRepository.update(id, updateData);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'ACTUALIZAR_ESTADO',
      modulo: 'solicitudes_contacto',
      registro_id: id,
      descripcion: `Estado de solicitud actualizado a: ${data.estado}`,
    });

    return updated;
  },

  /**
   * Updates observaciones_admin field.
   * Registers OBSERVACIONES audit entry.
   */
  async agregarObservaciones(
    id: number,
    observaciones: string,
    usuario: JwtPayload
  ): Promise<SolicitudContacto> {
    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country access for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (solicitud.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await solicitudRepository.update(id, {
      observaciones_admin: observaciones,
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'OBSERVACIONES',
      modulo: 'solicitudes_contacto',
      registro_id: id,
      descripcion: 'Observaciones administrativas actualizadas',
    });

    return updated;
  },

  /**
   * Soft delete. Only admin_pais and superadmin can delete; editor gets 403.
   * Registers ELIMINAR audit entry.
   */
  async eliminar(id: number, usuario: JwtPayload): Promise<void> {
    // Editor cannot delete
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const solicitud = await solicitudRepository.findById(id);
    if (!solicitud) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (solicitud.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    await solicitudRepository.softDelete(id);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'ELIMINAR',
      modulo: 'solicitudes_contacto',
      registro_id: id,
      descripcion: `Solicitud de contacto eliminada: ${solicitud.nombre}`,
    });
  },
};
