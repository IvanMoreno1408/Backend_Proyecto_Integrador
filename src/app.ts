import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import paisRoutes from './routes/pais.routes';
import usuarioRoutes from './routes/usuario.routes';
import noticiaRoutes from './routes/noticia.routes';
import testimonioRoutes from './routes/testimonio.routes';
import solicitudRoutes from './routes/solicitud.routes';
import archivoRoutes from './routes/archivo.routes';
import auditoriaRoutes from './routes/auditoria.routes';
import publicRoutes from './routes/public.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' }, message: 'Server is running', errors: null });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/paises', paisRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/noticias', noticiaRoutes);
app.use('/api/testimonios', testimonioRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/archivos', archivoRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Public routes — no auth required
app.use('/public', publicRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
