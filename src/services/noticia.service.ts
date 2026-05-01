import { noticiaRepository } from '../repositories/noticia.repository';
import { paisRepository } from '../repositories/pais.repository';
import { auditoriaRepository } from '../repositories/auditoria.repository';
import { AppError } from '../middlewares/errorHandler';
import { Noticia } from '../types/models';
import {
  CrearNoticiaDto,
  ActualizarNoticiaDto,
  FiltrosNoticiaDto,
  JwtPayload,
  PaginatedResponse,
} from '../types/dtos';

const MAX_LIMIT = 20;

export const noticiaService = {
  async listar(
    filtros: FiltrosNoticiaDto,
    usuario: JwtPayload
  ): Promise<PaginatedResponse<Noticia>> {
    const page = filtros.page ?? 1;
    const limit = Math.min(filtros.limit ?? MAX_LIMIT, MAX_LIMIT);

    // Enforce country filter for admin_pais and editor
    const filtrosEfectivos: FiltrosNoticiaDto = { ...filtros, page, limit };
    if (usuario.rol === 'admin_pais' || usuario.rol === 'editor') {
      filtrosEfectivos.pais_id = usuario.pais_id ?? undefined;
    }

    const [noticias, total] = await Promise.all([
      noticiaRepository.findAll(filtrosEfectivos),
      noticiaRepository.countAll(filtrosEfectivos),
    ]);

    return { data: noticias, total, page, limit };
  },

  async crear(data: CrearNoticiaDto, usuario: JwtPayload): Promise<Noticia> {
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

    // Validate slug uniqueness per country
    const existing = await noticiaRepository.findBySlugAndPais(data.slug, pais_id);
    if (existing) {
      throw new AppError('Ya existe una noticia con ese slug en este país', 409);
    }

    const noticia = await noticiaRepository.insert({
      titulo: data.titulo,
      slug: data.slug,
      resumen: data.resumen,
      contenido: data.contenido,
      imagen_principal_url: data.imagen_principal_url ?? null,
      pais_id,
      autor_id: usuario.usuario_id,
      estado: 'borrador',
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'CREAR',
      modulo: 'noticias',
      registro_id: noticia.id,
      descripcion: `Noticia creada: ${noticia.titulo}`,
    });

    return noticia;
  },

  async actualizar(
    id: number,
    data: ActualizarNoticiaDto,
    usuario: JwtPayload
  ): Promise<Noticia> {
    const noticia = await noticiaRepository.findById(id);
    if (!noticia) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais and editor
    if (usuario.rol === 'admin_pais' || usuario.rol === 'editor') {
      if (noticia.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    // Validate slug uniqueness if slug is being changed
    if (data.slug && data.slug !== noticia.slug) {
      const slugConflict = await noticiaRepository.findBySlugAndPais(data.slug, noticia.pais_id);
      if (slugConflict) {
        throw new AppError('Ya existe una noticia con ese slug en este país', 409);
      }
    }

    const updated = await noticiaRepository.update(id, data);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'EDITAR',
      modulo: 'noticias',
      registro_id: id,
      descripcion: `Noticia actualizada: ${updated.titulo}`,
    });

    return updated;
  },

  async eliminar(id: number, usuario: JwtPayload): Promise<void> {
    // Only admin_pais and superadmin can delete; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const noticia = await noticiaRepository.findById(id);
    if (!noticia) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (noticia.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    await noticiaRepository.softDelete(id);

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'ELIMINAR',
      modulo: 'noticias',
      registro_id: id,
      descripcion: `Noticia eliminada: ${noticia.titulo}`,
    });
  },

  async publicar(id: number, usuario: JwtPayload): Promise<Noticia> {
    // Only admin_pais and superadmin can publish; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const noticia = await noticiaRepository.findById(id);
    if (!noticia) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (noticia.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await noticiaRepository.update(id, {
      estado: 'publicado',
      fecha_publicacion: new Date().toISOString(),
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'PUBLICAR',
      modulo: 'noticias',
      registro_id: id,
      descripcion: `Noticia publicada: ${noticia.titulo}`,
    });

    return updated;
  },

  async despublicar(id: number, usuario: JwtPayload): Promise<Noticia> {
    // Only admin_pais and superadmin can unpublish; editor cannot
    if (usuario.rol === 'editor') {
      throw new AppError('No tiene permisos para realizar esta acción', 403);
    }

    const noticia = await noticiaRepository.findById(id);
    if (!noticia) {
      throw new AppError('Recurso no encontrado', 404);
    }

    // Validate country ownership for admin_pais
    if (usuario.rol === 'admin_pais') {
      if (noticia.pais_id !== usuario.pais_id) {
        throw new AppError('Acceso denegado al recurso de otro país', 403);
      }
    }

    const updated = await noticiaRepository.update(id, {
      estado: 'despublicado',
    });

    await auditoriaRepository.registrar({
      usuario_id: usuario.usuario_id,
      accion: 'DESPUBLICAR',
      modulo: 'noticias',
      registro_id: id,
      descripcion: `Noticia despublicada: ${noticia.titulo}`,
    });

    return updated;
  },

  async obtenerPublica(paisSlug: string, noticiaSlug: string): Promise<Noticia> {
    // Resolve pais by slug
    const pais = await paisRepository.findBySlug(paisSlug);
    if (!pais) {
      throw new AppError('Recurso no encontrado', 404);
    }

    const noticia = await noticiaRepository.findBySlugAndPais(noticiaSlug, pais.id);
    if (!noticia || noticia.estado !== 'publicado') {
      throw new AppError('Recurso no encontrado', 404);
    }

    return noticia;
  },
};
