import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/dtos';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: string[] | null = null
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  data: T | null,
  message: string,
  errors: string[] | null = null
): void => {
  const response: ApiResponse<T> = {
    success: statusCode < 400,
    data,
    message,
    errors,
  };
  res.status(statusCode).json(response);
};

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errors = err instanceof AppError ? err.errors : null;
  const message = err.message || 'Error interno del servidor';

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    message,
    errors,
  };

  res.status(statusCode).json(response);
};
