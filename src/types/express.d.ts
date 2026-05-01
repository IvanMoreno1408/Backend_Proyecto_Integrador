import { JwtPayload } from './dtos';

declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
      paisFiltro?: number | null;
    }
  }
}

export {};
