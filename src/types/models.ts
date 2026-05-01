// Domain model interfaces for CMS Multiportal Backend

export type RolNombre = 'superadmin' | 'admin_pais' | 'editor';

export type EstadoContenido = 'borrador' | 'publicado' | 'despublicado' | 'eliminado';

export type EstadoSolicitud = 'pendiente' | 'en_proceso' | 'gestionada' | 'cerrada' | 'eliminado';

export interface Pais {
  id: number;
  nombre: string;
  codigo: string;
  slug: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface Rol {
  id: number;
  nombre: RolNombre;
  descripcion: string | null;
  created_at: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  password_hash: string;
  rol_id: number;
  pais_id: number | null;
  estado: string;
  ultimo_acceso: string | null;
  created_at: string;
  updated_at: string;
}

export interface Noticia {
  id: number;
  pais_id: number;
  autor_id: number;
  titulo: string;
  slug: string;
  resumen: string;
  contenido: string;
  imagen_principal_url: string | null;
  estado: EstadoContenido;
  fecha_publicacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonio {
  id: number;
  pais_id: number;
  autor_id: number;
  nombre: string;
  cargo: string | null;
  empresa: string | null;
  contenido: string;
  foto_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  estado: EstadoContenido;
  destacado: boolean;
  fecha_publicacion: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitudContacto {
  id: number;
  pais_id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  finalidad: string | null;
  mensaje: string | null;
  estado: EstadoSolicitud;
  observaciones_admin: string | null;
  fecha_gestion: string | null;
  gestionado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface Archivo {
  id: number;
  nombre_archivo: string;
  url: string;
  tipo_archivo: string;
  modulo: string;
  referencia_id: number | null;
  subido_por: number;
  created_at: string;
}

export interface BitacoraAuditoria {
  id: number;
  usuario_id: number | null;
  accion: string;
  modulo: string;
  registro_id: number | null;
  descripcion: string | null;
  ip: string | null;
  created_at: string;
}
