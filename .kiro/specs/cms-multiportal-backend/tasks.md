# Implementation Tasks — CMS Multiportal Backend

## Task Overview

Implementation plan following the phased development approach:
- **Phase 1**: Project setup, authentication, users, countries
- **Phase 2**: News management
- **Phase 3**: Testimonials management
- **Phase 4**: Contact requests management
- **Phase 5**: Files, audit log, and public endpoints

---

## Phase 1: Project Setup, Authentication, Users & Countries

- [x] 1. Initialize TypeScript project structure
  - [x] 1.1 Initialize Node.js project with `npm init` and install core dependencies: `express`, `@supabase/supabase-js`, `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `helmet`, `express-rate-limit`, `multer`, `dotenv`
  - [x] 1.2 Install TypeScript dev dependencies: `typescript`, `ts-node`, `ts-node-dev`, `@types/express`, `@types/node`, `@types/jsonwebtoken`, `@types/bcryptjs`, `@types/cors`, `@types/multer`
  - [x] 1.3 Install testing dependencies: `jest`, `ts-jest`, `fast-check`, `supertest`, `@types/jest`, `@types/supertest`
  - [x] 1.4 Create `tsconfig.json` with `strict: true`, `target: ES2020`, `module: commonjs`, `outDir: ./dist`, `rootDir: ./src`
  - [x] 1.5 Create `jest.config.ts` configured for `ts-jest` with test path patterns for `unit`, `property`, and `integration`
  - [x] 1.6 Add `scripts` to `package.json`: `build`, `start`, `dev` (ts-node-dev), `test`, `test:property`, `test:integration`, `test:coverage`
  - [x] 1.7 Create `.env.example` with required variables: `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `JWT_EXPIRES_IN`
  - [x] 1.8 Create the full folder structure: `src/config/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/routes/`, `src/middlewares/`, `src/types/`, `tests/unit/`, `tests/property/`, `tests/integration/`

- [x] 2. Create TypeScript type definitions
  - [x] 2.1 Create `src/types/models.ts` with interfaces: `Pais`, `Rol`, `RolNombre`, `Usuario`, `Noticia`, `Testimonio`, `SolicitudContacto`, `Archivo`, `BitacoraAuditoria`, `EstadoContenido`, `EstadoSolicitud`
  - [x] 2.2 Create `src/types/dtos.ts` with: `JwtPayload`, `ApiResponse<T>`, `PaginatedResponse<T>`, and all input DTOs for each module (CreateNoticiaDto, UpdateNoticiaDto, FiltrosNoticiaDto, etc.)
  - [x] 2.3 Create `src/types/express.d.ts` to extend Express `Request` with `usuario?: JwtPayload` and `paisFiltro?: number | null`

- [x] 3. Configure core infrastructure
  - [x] 3.1 Create `src/config/env.ts` that validates required environment variables on startup and throws if any are missing
  - [x] 3.2 Create `src/config/supabase.ts` that initializes and exports the Supabase client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  - [x] 3.3 Create `src/config/jwt.ts` that exports JWT sign and verify helpers typed with `JwtPayload`
  - [x] 3.4 Create `src/middlewares/errorHandler.ts` with `AppError` class and `errorHandler` middleware that returns `ApiResponse` format
  - [x] 3.5 Create `src/app.ts` that configures Express with `cors`, `helmet`, `express.json`, `express-rate-limit`, mounts all routers, and registers `errorHandler` last
  - [x] 3.6 Create `src/server.ts` as the entry point that imports `app.ts` and starts listening on `PORT`

- [x] 4. Implement authentication module
  - [x] 4.1 Create `src/repositories/usuario.repository.ts` with `findByUsername(username)` and `findById(id)` methods using Supabase client, joining with `roles` table
  - [x] 4.2 Create `src/repositories/auditoria.repository.ts` with `registrar(entrada: RegistrarAuditoriaDto)` method
  - [x] 4.3 Create `src/services/auth.service.ts` with `login(username, password, ip)` that verifies `password_hash` with bcrypt, emits JWT with `usuario_id`, `rol`, `pais_id`, `username` in payload, and calls `auditoriaRepository.registrar` with action `LOGIN`
  - [x] 4.4 Add `logout(usuario_id, ip)` to `auth.service.ts` that registers `LOGOUT` action in `bitacora_auditoria`
  - [x] 4.5 Create `src/middlewares/auth.middleware.ts` with `verifyToken` that extracts Bearer token, verifies with `jwt.verify`, and injects `req.usuario`
  - [x] 4.6 Create `src/middlewares/role.middleware.ts` with `requireRole(...roles: RolNombre[])` factory that checks `req.usuario.rol` against allowed roles
  - [x] 4.7 Create `src/middlewares/pais.middleware.ts` with `applyPaisFilter` that sets `req.paisFiltro` based on user role
  - [x] 4.8 Create `src/controllers/auth.controller.ts` with `login` and `logout` handlers that validate input with Zod and return `ApiResponse`
  - [x] 4.9 Create `src/routes/auth.routes.ts` with `POST /api/auth/login` (public) and `POST /api/auth/logout` (protected with `verifyToken`)
  - [x] 4.10 Write unit tests in `tests/unit/services/auth.service.test.ts` covering: successful login, wrong password (401), inactive user (403), JWT payload fields
  - [x] 4.11 Write unit tests in `tests/unit/middlewares/auth.middleware.test.ts` covering: missing token (401), expired token (401), invalid signature (401), valid token injects `req.usuario`
  - [x] 4.12 Write property test in `tests/property/auth.property.test.ts` for Property 1 (JWT payload completeness and 8h expiry) and Property 2 (audit log on login/logout) with 100 runs each

- [x] 5. Implement countries (paises) module
  - [x] 5.1 Create `src/repositories/pais.repository.ts` with `findAll()`, `findById(id)`, `findBySlug(slug)`, `insert(data)`, `update(id, data)`, `checkDependencies(id)` methods
  - [x] 5.2 Create `src/services/pais.service.ts` with `listar()`, `crear(data, usuario)`, `actualizar(id, data, usuario)`, `eliminar(id, usuario)` enforcing uniqueness of `codigo` and `slug`, checking dependencies before delete, and registering audit entries
  - [x] 5.3 Create `src/controllers/pais.controller.ts` with handlers for list, create, update, delete using Zod validation
  - [x] 5.4 Create `src/routes/pais.routes.ts` with `GET /api/paises` (superadmin), `POST /api/paises` (superadmin), `PUT /api/paises/:id` (superadmin), `DELETE /api/paises/:id` (superadmin)
  - [x] 5.5 Write unit tests in `tests/unit/services/pais.service.test.ts` covering: list ordered by name, duplicate codigo/slug returns 409, delete with dependencies returns 409
  - [x] 5.6 Write property test in `tests/property/pais.property.test.ts` for Property 6 (uniqueness) and Property 7 (ordered by name) with 100 runs each

- [x] 6. Implement users (usuarios) module
  - [x] 6.1 Extend `src/repositories/usuario.repository.ts` with `findAll(filtros)`, `insert(data)`, `update(id, data)` methods
  - [x] 6.2 Create `src/services/usuario.service.ts` with `listar(filtros)`, `crear(data, usuario)`, `actualizar(id, data, usuario)`, `desactivar(id, usuario)` enforcing unique email/username, bcrypt hashing with cost 10, pais_id required for non-superadmin roles, and audit entries
  - [x] 6.3 Create `src/controllers/usuario.controller.ts` with handlers for list, create, update, deactivate using Zod validation
  - [x] 6.4 Create `src/routes/usuario.routes.ts` with all CRUD routes protected by `verifyToken` and `requireRole('superadmin')`
  - [x] 6.5 Write unit tests in `tests/unit/services/usuario.service.test.ts` covering: duplicate email/username (409), missing pais_id for admin_pais (422), password stored as bcrypt hash, editor cannot manage users (403)
  - [x] 6.6 Write property test in `tests/property/auth.property.test.ts` for Property 9 (bcrypt cost ≥ 10) with 100 runs

---

## Phase 2: News Management

- [x] 7. Implement news (noticias) module
  - [x] 7.1 Create `src/repositories/noticia.repository.ts` with `findAll(filtros)`, `findById(id)`, `findBySlugAndPais(slug, pais_id)`, `insert(data)`, `update(id, data)`, `softDelete(id)`, `countAll(filtros)` methods
  - [x] 7.2 Create `src/services/noticia.service.ts` with:
    - `listar(filtros, usuario)` — paginated, filtered by `pais_id` based on role, excludes `estado = 'eliminado'`
    - `crear(data, usuario)` — sets `estado = 'borrador'`, `autor_id`, `pais_id`, validates slug uniqueness per country
    - `actualizar(id, data, usuario)` — partial update, validates country ownership, registers audit
    - `eliminar(id, usuario)` — soft delete (estado = 'eliminado'), only admin_pais/superadmin
    - `publicar(id, usuario)` — sets `estado = 'publicado'`, `fecha_publicacion = now()`, only admin_pais/superadmin
    - `despublicar(id, usuario)` — sets `estado = 'despublicado'`, only admin_pais/superadmin
  - [x] 7.3 Create `src/controllers/noticia.controller.ts` with handlers for all operations using Zod validation
  - [x] 7.4 Create `src/routes/noticia.routes.ts`:
    - `GET /api/noticias` — verifyToken + applyPaisFilter
    - `POST /api/noticias` — verifyToken + requireRole('superadmin','admin_pais','editor')
    - `GET /api/noticias/:id` — verifyToken
    - `PUT /api/noticias/:id` — verifyToken + requireRole('superadmin','admin_pais','editor')
    - `DELETE /api/noticias/:id` — verifyToken + requireRole('superadmin','admin_pais')
    - `PATCH /api/noticias/:id/publicar` — verifyToken + requireRole('superadmin','admin_pais')
    - `PATCH /api/noticias/:id/despublicar` — verifyToken + requireRole('superadmin','admin_pais')
  - [x] 7.5 Write unit tests in `tests/unit/services/noticia.service.test.ts` covering: created with borrador state, duplicate slug same country (409), same slug different country (allowed), editor cannot delete (403), editor cannot publish (403), soft delete sets estado=eliminado, publish sets fecha_publicacion
  - [x] 7.6 Write property tests in `tests/property/noticia.property.test.ts` for:
    - Property 4 (country isolation for admin_pais/editor)
    - Property 10 (created with borrador + correct autor_id + pais_id)
    - Property 11 (slug uniqueness per country)
    - Property 12 (partial update only modifies sent fields)
    - Property 13 (soft delete preserves record with estado=eliminado)
    - Property 14 (publish sets fecha_publicacion within ±5s)
    - Property 15 (pagination limits to max 20 per page)
    - Property 16 (filter by estado returns only matching records)
    with 100 runs each

---

## Phase 3: Testimonials Management

- [x] 8. Implement testimonials (testimonios) module
  - [x] 8.1 Create `src/repositories/testimonio.repository.ts` with `findAll(filtros)`, `findById(id)`, `insert(data)`, `update(id, data)`, `softDelete(id)`, `countAll(filtros)` methods
  - [x] 8.2 Create `src/services/testimonio.service.ts` with:
    - `listar(filtros, usuario)` — paginated, filtered by `pais_id` based on role, supports `destacado` filter
    - `crear(data, usuario)` — validates required fields (`nombre`, `contenido`), sets `estado = 'borrador'`, `autor_id`, `pais_id`
    - `actualizar(id, data, usuario)` — partial update, validates country ownership, registers audit
    - `eliminar(id, usuario)` — soft delete, only admin_pais/superadmin
    - `publicar(id, usuario)` — sets `estado = 'publicado'`, `fecha_publicacion = now()`, only admin_pais/superadmin
    - `despublicar(id, usuario)` — sets `estado = 'despublicado'`, only admin_pais/superadmin
    - `marcarDestacado(id, destacado, usuario)` — toggles `destacado` field, only admin_pais/superadmin
  - [x] 8.3 Create `src/controllers/testimonio.controller.ts` with handlers for all operations using Zod validation
  - [x] 8.4 Create `src/routes/testimonio.routes.ts` with same pattern as noticia routes plus `PATCH /:id/destacado`
  - [x] 8.5 Write unit tests in `tests/unit/services/testimonio.service.test.ts` covering: missing required fields (422), editor cannot delete/publish/destacar (403), soft delete, publish sets fecha_publicacion, destacado toggle persists
  - [x] 8.6 Write property tests in `tests/property/testimonio.property.test.ts` for:
    - Property 4 (country isolation)
    - Property 10 (created with borrador state)
    - Property 12 (partial update)
    - Property 13 (soft delete)
    - Property 14 (publish timestamp)
    - Property 15 (pagination)
    - Property 16 (filter by estado)
    - Property 17 (missing required fields returns 422 with field list)
    with 100 runs each

---

## Phase 4: Contact Requests Management

- [x] 9. Implement contact requests (solicitudes_contacto) module
  - [x] 9.1 Create `src/repositories/solicitud.repository.ts` with `findAll(filtros)`, `findById(id)`, `insert(data)`, `update(id, data)`, `softDelete(id)`, `countAll(filtros)` methods
  - [x] 9.2 Create `src/services/solicitud.service.ts` with:
    - `crearPublica(data)` — public endpoint, validates required fields and email format, sets `estado = 'pendiente'`
    - `listar(filtros, usuario)` — paginated, ordered by `created_at` DESC, filtered by `pais_id` based on role
    - `obtener(id, usuario)` — returns full detail, validates country access
    - `actualizarEstado(id, data, usuario)` — updates `estado`, sets `gestionado_por` and `fecha_gestion` when estado = 'gestionada', registers audit
    - `agregarObservaciones(id, observaciones, usuario)` — updates `observaciones_admin`, registers audit
    - `eliminar(id, usuario)` — soft delete, only admin_pais/superadmin
  - [x] 9.3 Create `src/controllers/solicitud.controller.ts` with handlers for all operations using Zod validation (including email format validation)
  - [x] 9.4 Create `src/routes/solicitud.routes.ts`:
    - `POST /api/solicitudes` — public (no auth)
    - `GET /api/solicitudes` — verifyToken + applyPaisFilter
    - `GET /api/solicitudes/:id` — verifyToken
    - `PATCH /api/solicitudes/:id/estado` — verifyToken + requireRole('superadmin','admin_pais')
    - `PATCH /api/solicitudes/:id/observaciones` — verifyToken + requireRole('superadmin','admin_pais')
    - `DELETE /api/solicitudes/:id` — verifyToken + requireRole('superadmin','admin_pais')
  - [x] 9.5 Write unit tests in `tests/unit/services/solicitud.service.test.ts` covering: created with pendiente state, missing required fields (422), invalid email format (422), editor cannot update state (403), gestionado_por set when estado=gestionada, soft delete
  - [x] 9.6 Write property tests in `tests/property/solicitud.property.test.ts` for:
    - Property 4 (country isolation)
    - Property 13 (soft delete)
    - Property 15 (pagination)
    - Property 16 (filter by estado)
    - Property 18 (valid public request persists with pendiente)
    - Property 19 (missing required fields returns 422 with field list)
    with 100 runs each

---

## Phase 5: Files, Audit Log & Public Endpoints

- [x] 10. Implement file upload (archivos) module
  - [x] 10.1 Create `src/repositories/archivo.repository.ts` with `insert(data)` and `findById(id)` methods
  - [x] 10.2 Create `src/services/archivo.service.ts` with `subir(file, meta, usuario)` that validates MIME type (jpeg/png/webp/gif) and file size (≤5MB), uploads to Supabase Storage, and registers in `archivos` table
  - [x] 10.3 Create `src/controllers/archivo.controller.ts` with `subir` handler using multer middleware
  - [x] 10.4 Create `src/routes/archivo.routes.ts` with `POST /api/archivos` protected by `verifyToken`
  - [x] 10.5 Write unit tests in `tests/unit/services/archivo.service.test.ts` covering: invalid MIME type (422 with allowed types), file > 5MB (422), valid upload returns url
  - [x] 10.6 Write property test in `tests/property/archivo.property.test.ts` for Property 20 (invalid MIME type rejected) with 100 runs

- [x] 11. Implement audit log (bitacora_auditoria) module
  - [x] 11.1 Extend `src/repositories/auditoria.repository.ts` with `findAll(filtros)` and `countAll(filtros)` methods
  - [x] 11.2 Create `src/services/auditoria.service.ts` with `listar(filtros)` returning paginated results (max 50/page) ordered by `created_at` DESC, supporting filters by `modulo` and `usuario_id`
  - [x] 11.3 Create `src/controllers/auditoria.controller.ts` with `listar` handler
  - [x] 11.4 Create `src/routes/auditoria.routes.ts` with `GET /api/auditoria` protected by `verifyToken + requireRole('superadmin')`
  - [x] 11.5 Write unit tests in `tests/unit/services/auditoria.service.test.ts` covering: admin_pais/editor cannot access (403), pagination max 50, filter by modulo, filter by usuario_id

- [x] 12. Implement public endpoints
  - [x] 12.1 Create `src/routes/public.routes.ts` with:
    - `GET /public/:paisSlug/noticias` — returns published news for country, paginated
    - `GET /public/:paisSlug/noticias/:noticiaSlug` — returns single published news (404 if not published)
    - `GET /public/:paisSlug/testimonios` — returns published testimonials for country, paginated
  - [x] 12.2 Add public route handlers to `noticia.controller.ts` (`obtenerPublica`, `listarPublicas`) and `testimonio.controller.ts` (`listarPublicas`)
  - [x] 12.3 Mount `public.routes.ts` in `app.ts` without any auth middleware
  - [x] 12.4 Write integration tests in `tests/integration/public.integration.test.ts` covering: returns only published content, returns 404 for unpublished news slug, no auth required

- [x] 13. Cross-cutting: response format and property tests
  - [x] 13.1 Create a `sendResponse` helper in `src/middlewares/errorHandler.ts` that always returns `ApiResponse<T>` format
  - [x] 13.2 Ensure all controllers use `sendResponse` helper for consistent output
  - [x] 13.3 Write property test in `tests/property/response.property.test.ts` for Property 21 (all responses have consistent JSON structure) with 100 runs
  - [x] 13.4 Write property test in `tests/property/auth.property.test.ts` for Property 3 (protected endpoints reject requests without valid JWT) with 100 runs
  - [x] 13.5 Write property test for Property 5 (superadmin accesses resources from all countries) with 100 runs
  - [x] 13.6 Write property test for Property 8 (state changes persist and generate audit entry) with 100 runs

- [x] 14. Integration tests and final verification
  - [x] 14.1 Write integration tests in `tests/integration/auth.integration.test.ts` covering full auth flow: login → use token → logout → token rejected
  - [x] 14.2 Run full test suite (`npm test`) and ensure all unit and property tests pass
  - [x] 14.3 Run `npm run build` and verify TypeScript compiles without errors
  - [x] 14.4 Verify test coverage meets targets: Services ≥90%, Middlewares ≥95%, Controllers ≥80%
