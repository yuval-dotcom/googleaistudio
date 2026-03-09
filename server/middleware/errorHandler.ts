import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/HttpError.js';

// Centralized error-handling middleware
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Basic logging for now; can be swapped with a real logger
  // eslint-disable-next-line no-console
  console.error(err);

  if (err instanceof HttpError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
    });
    return;
  }

  const status = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : (err as any)?.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
  });
}

