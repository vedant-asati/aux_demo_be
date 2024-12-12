// src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

// export const errorHandler = (
//   error: Error,
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   console.error(error.stack);
//   res.status(500).json({
//     message: error.message || 'Internal Server Error'
//   });
// };

// First create a custom error class
class ProductDeletionError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ProductDeletionError';
  }
}

// Error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ProductDeletionError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  // Handle other errors
  console.error(error.stack);
  return res.status(500).json({
    status: 'error',
    message: error.message || 'Internal server error'
  });
};