// Data Transfer Objects for CMS Multiportal Backend
import { EstadoContenido, EstadoSolicitud, RolNombre } from './models';

// ─── Core response types ───────────────────────────────────────────────────────

export interface JwtPayload {
  usuario_id: number;
  rol: RolNombre;
  pais_id: number | null;
  username: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[] | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginDto {
  username: string;
  password: string;
}

// Parte 17: recuperación y gestión de contraseña

export interface ForgotPasswordDto {
  /** Puede ser username o email */
  identifier: string;
}

export interface ResetPasswordDto {
  username: string;
  respuesta_seguridad: string;
  nueva_password: string;
}

export interface ChangePasswordDto {
  password_actual: string;
  nueva_password: string;
}

export interface AdminChangePasswordDto {
  nueva_password: string;
}

export interface SecurityQuestionDto {
  pregunta_seguridad: string;
  respuesta_seguridad: string;
}

// ─── Pais ─────────────────────────────────────────────────────────────────────

export interface CrearPaisDto {
  nombre: string;
  codigo: string;
  slug: string;
  estado?: string;
}

export interface ActualizarPaisDto {
  nombre?: string;
  codigo?: string;
  slug?: string;
  estado?: string;
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export interface CrearUsuarioDto {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password: string;
  rol_id: number;
  pais_id?: number | null;
  estado?: string;
}

export interface ActualizarUsuarioDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  username?: string;
  password?: string;
  rol_id?: number;
  pais_id?: number | null;
  estado?: string;
}

export interface FiltrosUsuarioDto {
  rol_id?: number;
  pais_id?: number;
  estado?: string;
  page?: number;
  limit?: number;
}

// ─── Noticia ──────────────────────────────────────────────────────────────────

export interface CrearNoticiaDto {
  titulo: string;
  slug?: string;
  resumen: string;
  contenido: string;
  imagen_principal_url?: string | null;
  pais_id?: number;
  estado?: string;
}

export interface ActualizarNoticiaDto {
  titulo?: string;
  slug?: string;
  resumen?: string;
  contenido?: string;
  imagen_principal_url?: string | null;
  estado?: string;
}

export interface FiltrosNoticiaDto {
  pais_id?: number;
  estado?: EstadoContenido;
  autor_id?: number;
  page?: number;
  limit?: number;
}

// ─── Testimonio ───────────────────────────────────────────────────────────────

export interface CrearTestimonioDto {
  nombre: string;
  cargo?: string | null;
  empresa?: string | null;
  contenido: string;
  foto_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  destacado?: boolean;
  pais_id?: number;
  estado?: string;
}

export interface ActualizarTestimonioDto {
  nombre?: string;
  cargo?: string | null;
  empresa?: string | null;
  contenido?: string;
  foto_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  destacado?: boolean;
  estado?: string;
}

export interface FiltrosTestimonioDto {
  pais_id?: number;
  estado?: EstadoContenido;
  destacado?: boolean;
  page?: number;
  limit?: number;
}

// ─── Solicitud de contacto ────────────────────────────────────────────────────

export interface CrearSolicitudDto {
  pais_id: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  finalidad?: string | null;
  mensaje?: string | null;
}

export interface ActualizarSolicitudDto {
  estado?: EstadoSolicitud;
  observaciones_admin?: string | null;
}

export interface FiltrosSolicitudDto {
  pais_id?: number;
  estado?: EstadoSolicitud;
  page?: number;
  limit?: number;
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

export interface RegistrarAuditoriaDto {
  usuario_id: number | null;
  accion: string;
  modulo: string;
  registro_id?: number | null;
  descripcion?: string | null;
  ip?: string | null;
}

export interface FiltrosAuditoriaDto {
  usuario_id?: number;
  modulo?: string;
  accion?: string;
  page?: number;
  limit?: number;
}
