# Requirements Document

## Introduction

El CMS Multiportal Backend es un sistema administrativo multipaís construido con Node.js + Express y Supabase (PostgreSQL). Una sola aplicación API REST permite administrar contenido —noticias, testimonios y solicitudes de contacto— para los portales de Colombia, Chile y Ecuador. El sistema implementa control de acceso basado en roles (superadmin, admin_pais, editor), aislamiento de datos por país y auditoría de operaciones. También expone endpoints públicos para que los visitantes puedan enviar solicitudes de contacto y consultar contenido publicado.

---

## Glossary

- **API**: Interfaz de programación de aplicaciones REST expuesta por el backend.
- **AuthService**: Módulo responsable de autenticación, emisión y validación de JWT.
- **PaisService**: Módulo responsable de la gestión de países/portales.
- **UsuarioService**: Módulo responsable de la gestión de usuarios administrativos.
- **NoticiaService**: Módulo responsable de la gestión del ciclo de vida de noticias.
- **TestimonioService**: Módulo responsable de la gestión del ciclo de vida de testimonios.
- **SolicitudService**: Módulo responsable de la gestión de solicitudes de contacto.
- **ArchivoService**: Módulo responsable del almacenamiento y registro de archivos.
- **AuditoriaService**: Módulo responsable del registro de la bitácora de auditoría.
- **JWT**: JSON Web Token usado como mecanismo de autenticación sin estado.
- **superadmin**: Rol con acceso total a todos los países y módulos del sistema.
- **admin_pais**: Rol con acceso restringido al portal del país asignado.
- **editor**: Rol con capacidad de crear y editar contenido, sin gestión de usuarios.
- **visitante**: Usuario no autenticado que consume endpoints públicos.
- **pais_id**: Identificador de país asociado a un recurso o usuario.
- **slug**: Identificador textual único y legible por humanos (URL-friendly).
- **estado**: Campo que indica el ciclo de vida de un recurso (ej. pendiente, publicado, despublicado, eliminado).
- **password_hash**: Representación cifrada de la contraseña del usuario almacenada en base de datos.
- **Repositorio**: Capa de acceso a datos que abstrae las consultas a Supabase/PostgreSQL.

---

## Requirements

---

### Requirement 1: Autenticación — Inicio de sesión

**User Story:** Como usuario administrativo, quiero iniciar sesión con mis credenciales, para que el sistema me entregue un JWT válido que autorice mis peticiones posteriores.

#### Acceptance Criteria

1. WHEN un usuario envía `username` y `password` válidos al endpoint de login, THE AuthService SHALL verificar el `password_hash` almacenado y emitir un JWT firmado con tiempo de expiración de 8 horas.
2. WHEN un usuario envía credenciales incorrectas, THE AuthService SHALL retornar un error HTTP 401 con un mensaje descriptivo sin revelar cuál campo es incorrecto.
3. WHEN un usuario con `estado = inactivo` intenta iniciar sesión, THE AuthService SHALL rechazar la solicitud con HTTP 403 y un mensaje que indique que la cuenta está deshabilitada.
4. THE AuthService SHALL registrar en `bitacora_auditoria` cada intento de login exitoso con la IP del solicitante, el `usuario_id` y la acción `LOGIN`.
5. WHEN el JWT es emitido, THE AuthService SHALL incluir en el payload el `usuario_id`, `rol`, `pais_id` y `username`.

---

### Requirement 2: Autenticación — Cierre de sesión

**User Story:** Como usuario administrativo, quiero cerrar sesión, para que mi sesión quede invalidada en el sistema.

#### Acceptance Criteria

1. WHEN un usuario autenticado envía una solicitud de logout, THE AuthService SHALL registrar en `bitacora_auditoria` la acción `LOGOUT` con el `usuario_id` e IP.
2. THE AuthService SHALL retornar HTTP 200 confirmando el cierre de sesión.
3. IF el token enviado en la solicitud de logout no es válido o está expirado, THEN THE AuthService SHALL retornar HTTP 401.

---

### Requirement 3: Autorización basada en roles y país

**User Story:** Como sistema, quiero aplicar control de acceso por rol y país en cada endpoint protegido, para que cada usuario solo acceda a los recursos que le corresponden.

#### Acceptance Criteria

1. WHEN una solicitud llega a un endpoint protegido sin JWT, THE API SHALL rechazarla con HTTP 401.
2. WHEN una solicitud llega con un JWT expirado o con firma inválida, THE API SHALL rechazarla con HTTP 401.
3. WHILE el rol del usuario es `admin_pais` o `editor`, THE API SHALL filtrar automáticamente todos los recursos retornados al `pais_id` asignado al usuario.
4. WHEN un `admin_pais` o `editor` intenta acceder a un recurso de un país distinto al suyo, THE API SHALL retornar HTTP 403.
5. WHILE el rol del usuario es `superadmin`, THE API SHALL permitir el acceso a recursos de todos los países sin restricción de `pais_id`.
6. WHEN un `editor` intenta ejecutar una operación de gestión de usuarios, THE API SHALL retornar HTTP 403.

---

### Requirement 4: Gestión de países/portales

**User Story:** Como superadmin, quiero gestionar los países/portales del sistema, para que pueda activar, desactivar y consultar los portales disponibles.

#### Acceptance Criteria

1. THE PaisService SHALL garantizar que el campo `codigo` de cada país sea único en la base de datos.
2. THE PaisService SHALL garantizar que el campo `slug` de cada país sea único en la base de datos.
3. WHEN el superadmin solicita la lista de países, THE PaisService SHALL retornar todos los registros de la tabla `paises` ordenados por nombre ascendente.
4. WHEN el superadmin crea un país con `codigo` o `slug` duplicado, THE PaisService SHALL retornar HTTP 409 con un mensaje que identifique el campo en conflicto.
5. WHEN el superadmin actualiza el `estado` de un país, THE PaisService SHALL persistir el cambio y registrar la acción en `bitacora_auditoria`.
6. IF un `admin_pais` o `editor` intenta crear, editar o eliminar un país, THEN THE API SHALL retornar HTTP 403.

---

### Requirement 5: Gestión de usuarios administrativos

**User Story:** Como superadmin, quiero gestionar los usuarios del sistema, para que pueda crear, editar, activar/desactivar y asignar roles y países a los administradores.

#### Acceptance Criteria

1. THE UsuarioService SHALL garantizar que el campo `email` de cada usuario sea único en la base de datos.
2. THE UsuarioService SHALL garantizar que el campo `username` de cada usuario sea único en la base de datos.
3. WHEN se crea un usuario con rol `admin_pais` o `editor` sin `pais_id`, THE UsuarioService SHALL retornar HTTP 422 indicando que el campo `pais_id` es obligatorio para ese rol.
4. WHEN se crea un usuario con rol `superadmin`, THE UsuarioService SHALL permitir que `pais_id` sea nulo.
5. WHEN el superadmin crea un usuario, THE UsuarioService SHALL almacenar la contraseña como `password_hash` usando bcrypt con un factor de costo mínimo de 10.
6. WHEN el superadmin desactiva un usuario, THE UsuarioService SHALL cambiar su `estado` a `inactivo` y registrar la acción en `bitacora_auditoria`.
7. IF un `admin_pais` o `editor` intenta crear, editar o eliminar usuarios, THEN THE API SHALL retornar HTTP 403.

---

### Requirement 6: Gestión de noticias — Operaciones CRUD

**User Story:** Como admin_pais o editor, quiero crear, editar y eliminar noticias de mi portal, para que el contenido del sitio esté actualizado.

#### Acceptance Criteria

1. WHEN un usuario autorizado crea una noticia, THE NoticiaService SHALL persistir el registro con `estado = borrador`, `autor_id` del usuario autenticado y el `pais_id` correspondiente.
2. THE NoticiaService SHALL garantizar que el `slug` de cada noticia sea único dentro del mismo `pais_id`.
3. WHEN se intenta crear una noticia con un `slug` duplicado para el mismo país, THE NoticiaService SHALL retornar HTTP 409 indicando el conflicto de slug.
4. WHEN un usuario autorizado edita una noticia, THE NoticiaService SHALL actualizar únicamente los campos enviados en la solicitud y registrar la acción en `bitacora_auditoria`.
5. WHEN un usuario autorizado elimina una noticia, THE NoticiaService SHALL cambiar su `estado` a `eliminado` (soft delete) y registrar la acción en `bitacora_auditoria`.
6. IF un `editor` intenta eliminar una noticia, THEN THE API SHALL retornar HTTP 403.

---

### Requirement 7: Gestión de noticias — Publicación

**User Story:** Como admin_pais, quiero publicar y despublicar noticias, para que controle qué contenido es visible en el portal público.

#### Acceptance Criteria

1. WHEN un `admin_pais` o `superadmin` publica una noticia, THE NoticiaService SHALL cambiar su `estado` a `publicado` y registrar la `fecha_publicacion` con la marca de tiempo actual.
2. WHEN un `admin_pais` o `superadmin` despublica una noticia, THE NoticiaService SHALL cambiar su `estado` a `despublicado` y registrar la acción en `bitacora_auditoria`.
3. IF un `editor` intenta publicar o despublicar una noticia, THEN THE API SHALL retornar HTTP 403.
4. WHILE el rol del usuario es `admin_pais`, THE NoticiaService SHALL permitir publicar únicamente noticias cuyo `pais_id` coincida con el del usuario.

---

### Requirement 8: Gestión de noticias — Listado administrativo

**User Story:** Como usuario administrativo, quiero listar las noticias de mi portal con filtros, para que pueda encontrar y gestionar el contenido eficientemente.

#### Acceptance Criteria

1. WHEN un usuario administrativo solicita el listado de noticias, THE NoticiaService SHALL retornar los registros paginados con un máximo de 20 elementos por página por defecto.
2. WHILE el rol del usuario es `admin_pais` o `editor`, THE NoticiaService SHALL retornar únicamente las noticias cuyo `pais_id` coincida con el del usuario.
3. WHEN se aplica un filtro por `estado`, THE NoticiaService SHALL retornar únicamente las noticias que coincidan con el estado solicitado.
4. WHEN se aplica un filtro por `pais_id` (solo superadmin), THE NoticiaService SHALL retornar únicamente las noticias del país indicado.

---

### Requirement 9: Gestión de testimonios — Operaciones CRUD

**User Story:** Como admin_pais o editor, quiero crear, editar y eliminar testimonios de éxito, para que el portal muestre casos reales de clientes.

#### Acceptance Criteria

1. WHEN un usuario autorizado crea un testimonio, THE TestimonioService SHALL persistir el registro con `estado = borrador`, `autor_id` del usuario autenticado y el `pais_id` correspondiente.
2. WHEN un usuario autorizado edita un testimonio, THE TestimonioService SHALL actualizar únicamente los campos enviados y registrar la acción en `bitacora_auditoria`.
3. WHEN un usuario autorizado elimina un testimonio, THE TestimonioService SHALL cambiar su `estado` a `eliminado` (soft delete) y registrar la acción en `bitacora_auditoria`.
4. IF un `editor` intenta eliminar un testimonio, THEN THE API SHALL retornar HTTP 403.
5. WHEN se crea un testimonio, THE TestimonioService SHALL validar que los campos `nombre`, `cargo`, `empresa` y `contenido` estén presentes; IF alguno falta, THEN THE TestimonioService SHALL retornar HTTP 422 con los campos faltantes identificados.

---

### Requirement 10: Gestión de testimonios — Publicación y destacado

**User Story:** Como admin_pais, quiero publicar, despublicar y marcar testimonios como destacados, para que controle qué testimonios son visibles y cuáles se resaltan en el portal.

#### Acceptance Criteria

1. WHEN un `admin_pais` o `superadmin` publica un testimonio, THE TestimonioService SHALL cambiar su `estado` a `publicado` y registrar la `fecha_publicacion` con la marca de tiempo actual.
2. WHEN un `admin_pais` o `superadmin` despublica un testimonio, THE TestimonioService SHALL cambiar su `estado` a `despublicado` y registrar la acción en `bitacora_auditoria`.
3. WHEN un `admin_pais` o `superadmin` marca un testimonio como `destacado = true`, THE TestimonioService SHALL persistir el cambio.
4. IF un `editor` intenta publicar, despublicar o modificar el campo `destacado` de un testimonio, THEN THE API SHALL retornar HTTP 403.
5. WHILE el rol del usuario es `admin_pais`, THE TestimonioService SHALL permitir publicar únicamente testimonios cuyo `pais_id` coincida con el del usuario.

---

### Requirement 11: Gestión de testimonios — Listado administrativo

**User Story:** Como usuario administrativo, quiero listar los testimonios de mi portal con filtros, para que pueda gestionar el contenido eficientemente.

#### Acceptance Criteria

1. WHEN un usuario administrativo solicita el listado de testimonios, THE TestimonioService SHALL retornar los registros paginados con un máximo de 20 elementos por página por defecto.
2. WHILE el rol del usuario es `admin_pais` o `editor`, THE TestimonioService SHALL retornar únicamente los testimonios cuyo `pais_id` coincida con el del usuario.
3. WHEN se aplica un filtro por `estado`, THE TestimonioService SHALL retornar únicamente los testimonios que coincidan con el estado solicitado.
4. WHEN se aplica un filtro por `destacado = true`, THE TestimonioService SHALL retornar únicamente los testimonios marcados como destacados.

---

### Requirement 12: Gestión de solicitudes de contacto — Recepción pública

**User Story:** Como visitante, quiero enviar una solicitud de contacto desde el portal de mi país, para que un administrador pueda atender mi consulta.

#### Acceptance Criteria

1. WHEN un visitante envía una solicitud de contacto con `pais_id`, `nombre`, `correo`, `telefono`, `finalidad` y `mensaje` válidos, THE SolicitudService SHALL persistir el registro con `estado = pendiente` y retornar HTTP 201.
2. IF alguno de los campos obligatorios (`pais_id`, `nombre`, `correo`, `mensaje`) está ausente o vacío, THEN THE SolicitudService SHALL retornar HTTP 422 con los campos faltantes identificados.
3. IF el campo `correo` no tiene formato de dirección de correo electrónico válida, THEN THE SolicitudService SHALL retornar HTTP 422 indicando el error de formato.
4. WHEN una solicitud de contacto es creada, THE SolicitudService SHALL registrar la marca de tiempo en `created_at`.

---

### Requirement 13: Gestión de solicitudes de contacto — Administración

**User Story:** Como admin_pais o superadmin, quiero listar, ver el detalle, actualizar el estado y gestionar solicitudes de contacto, para que pueda dar seguimiento a las consultas de los visitantes.

#### Acceptance Criteria

1. WHEN un usuario administrativo solicita el listado de solicitudes, THE SolicitudService SHALL retornar los registros paginados con un máximo de 20 elementos por página por defecto, ordenados por `created_at` descendente.
2. WHILE el rol del usuario es `admin_pais` o `editor`, THE SolicitudService SHALL retornar únicamente las solicitudes cuyo `pais_id` coincida con el del usuario.
3. WHEN un `admin_pais` o `superadmin` actualiza el `estado` de una solicitud a `gestionada`, THE SolicitudService SHALL registrar el `gestionado_por` con el `usuario_id` del usuario autenticado, la `fecha_gestion` con la marca de tiempo actual y la acción en `bitacora_auditoria`.
4. WHEN un `admin_pais` o `superadmin` agrega `observaciones_admin` a una solicitud, THE SolicitudService SHALL persistir el texto y registrar la acción en `bitacora_auditoria`.
5. WHEN un `admin_pais` o `superadmin` elimina una solicitud, THE SolicitudService SHALL realizar un soft delete cambiando el `estado` a `eliminado` y registrar la acción en `bitacora_auditoria`.
6. IF un `editor` intenta actualizar el estado o eliminar una solicitud, THEN THE API SHALL retornar HTTP 403.
7. WHEN se aplica un filtro por `estado`, THE SolicitudService SHALL retornar únicamente las solicitudes que coincidan con el estado solicitado.

---

### Requirement 14: Endpoints públicos — Contenido publicado

**User Story:** Como visitante, quiero consultar noticias y testimonios publicados de un portal específico, para que pueda ver el contenido vigente del sitio.

#### Acceptance Criteria

1. WHEN un visitante solicita las noticias de un país mediante su `slug`, THE NoticiaService SHALL retornar únicamente las noticias con `estado = publicado` para ese país, paginadas con un máximo de 20 elementos por página.
2. WHEN un visitante solicita los testimonios de un país mediante su `slug`, THE TestimonioService SHALL retornar únicamente los testimonios con `estado = publicado` para ese país, paginados con un máximo de 20 elementos por página.
3. WHEN un visitante solicita el detalle de una noticia por su `slug` y el `slug` del país, THE NoticiaService SHALL retornar el registro completo solo si su `estado = publicado`; IF el estado no es `publicado`, THEN THE NoticiaService SHALL retornar HTTP 404.
4. THE API SHALL exponer los endpoints públicos de consulta sin requerir autenticación JWT.

---

### Requirement 15: Gestión de archivos

**User Story:** Como usuario administrativo, quiero subir archivos (imágenes) asociados a noticias o testimonios, para que el contenido pueda incluir recursos visuales.

#### Acceptance Criteria

1. WHEN un usuario autorizado sube un archivo, THE ArchivoService SHALL almacenar el archivo en el servicio de almacenamiento configurado y registrar el registro en la tabla `archivos` con `nombre_archivo`, `url`, `tipo_archivo`, `modulo`, `referencia_id` y `subido_por`.
2. IF el tipo de archivo subido no es una imagen (JPEG, PNG, WebP o GIF), THEN THE ArchivoService SHALL retornar HTTP 422 indicando los tipos permitidos.
3. IF el tamaño del archivo supera 5 MB, THEN THE ArchivoService SHALL retornar HTTP 422 indicando el límite de tamaño.
4. WHEN un archivo es registrado, THE ArchivoService SHALL retornar la `url` pública del archivo en la respuesta HTTP 201.

---

### Requirement 16: Bitácora de auditoría

**User Story:** Como superadmin, quiero consultar la bitácora de auditoría, para que pueda rastrear las acciones realizadas por los usuarios en el sistema.

#### Acceptance Criteria

1. THE AuditoriaService SHALL registrar en `bitacora_auditoria` cada operación de escritura (crear, editar, eliminar, cambiar estado, publicar) con `usuario_id`, `accion`, `modulo`, `registro_id`, `descripcion` e `ip`.
2. WHEN el superadmin solicita la bitácora, THE AuditoriaService SHALL retornar los registros paginados con un máximo de 50 elementos por página, ordenados por `created_at` descendente.
3. WHEN se aplica un filtro por `modulo` o `usuario_id`, THE AuditoriaService SHALL retornar únicamente los registros que coincidan con los filtros aplicados.
4. IF un `admin_pais` o `editor` intenta acceder a la bitácora de auditoría, THEN THE API SHALL retornar HTTP 403.

---

### Requirement 17: Integridad y consistencia de datos

**User Story:** Como sistema, quiero garantizar la integridad referencial y la consistencia de los datos, para que el modelo de datos sea confiable en todo momento.

#### Acceptance Criteria

1. THE API SHALL garantizar que toda operación de escritura que falle por restricción de integridad referencial retorne HTTP 409 con un mensaje descriptivo.
2. WHEN se elimina un país, THE PaisService SHALL verificar que no existan usuarios, noticias, testimonios o solicitudes activas asociadas; IF existen, THEN THE PaisService SHALL retornar HTTP 409 indicando las dependencias existentes.
3. THE API SHALL retornar respuestas en formato JSON con estructura consistente: `{ "success": boolean, "data": object|array|null, "message": string, "errors": array|null }` para todas las respuestas.
4. THE API SHALL incluir en cada respuesta de error el código HTTP apropiado y un campo `message` descriptivo en español.
