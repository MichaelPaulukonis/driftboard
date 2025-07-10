import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../shared/types/index.js';

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Default error response
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  // Handle known error types
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || 'APP_ERROR';
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Log error for debugging
  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
  });

  // Send error response
  const response: ApiResponse = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { 
      details: error.stack,
      code,
    }),
  };

  res.status(statusCode).json(response);
  
  // Avoid calling next() to prevent further middleware execution
};
