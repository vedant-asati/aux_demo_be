"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ProductDeletionError = void 0;
class ProductDeletionError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ProductDeletionError';
    }
}
exports.ProductDeletionError = ProductDeletionError;
const errorHandler = (error, req, res, next) => {
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map