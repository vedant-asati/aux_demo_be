import { Request, Response, NextFunction } from 'express';
export class ProductDeletionError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = 'ProductDeletionError';
  }
}

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