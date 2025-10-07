import type { Request, Response, NextFunction } from "express";

// Error response interface
interface ErrorResponse {
  message: string;
  error?: string;
  details?: any;
  status: number;
}

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('🚨 [ERROR-MIDDLEWARE] Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).session?.user?.id || 'anonymous'
  });

  // Default error response
  let errorResponse: ErrorResponse = {
    message: "Internal Server Error",
    status: 500
  };

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    errorResponse = {
      message: err.message,
      status: err.statusCode,
      details: err.details
    };
  }
  // Handle known error types
  else if (err.name === 'ValidationError') {
    errorResponse = {
      message: "Validation Error",
      error: err.message,
      status: 400
    };
  }
  else if (err.name === 'CastError') {
    errorResponse = {
      message: "Invalid data format",
      error: err.message,
      status: 400
    };
  }
  else if (err.name === 'JsonWebTokenError') {
    errorResponse = {
      message: "Invalid token",
      error: err.message,
      status: 401
    };
  }
  else if (err.name === 'TokenExpiredError') {
    errorResponse = {
      message: "Token expired",
      error: err.message,
      status: 401
    };
  }
  else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    errorResponse = {
      message: "Database error",
      status: 500
    };
  }
  else if (err.message.includes('ECONNREFUSED')) {
    errorResponse = {
      message: "Database connection failed",
      status: 503
    };
  }
  // Handle unexpected errors in production
  else if (process.env.NODE_ENV === 'production') {
    errorResponse = {
      message: "Something went wrong",
      status: 500
    };
  }
  // Include full error in development
  else {
    errorResponse = {
      message: err.message,
      error: err.stack,
      status: 500
    };
  }

  res.status(errorResponse.status).json(errorResponse);
}

// 404 handler for unmatched routes
export function notFoundHandler(req: Request, res: Response) {
  console.warn('🔍 [ERROR-MIDDLEWARE] Route not found:', {
    url: req.url,
    method: req.method,
    user: (req as any).session?.user?.id || 'anonymous'
  });

  res.status(404).json({
    message: "Route not found",
    error: `Cannot ${req.method} ${req.url}`,
    status: 404
  });
}

// Async error wrapper for route handlers
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Validation error creator
export function createValidationError(message: string, details?: any) {
  return new AppError(message, 400, details);
}

// Database error creator
export function createDatabaseError(message: string, details?: any) {
  return new AppError(message, 500, details);
}

// Authorization error creator
export function createAuthError(message: string) {
  return new AppError(message, 401);
}

// Forbidden error creator
export function createForbiddenError(message: string) {
  return new AppError(message, 403);
}