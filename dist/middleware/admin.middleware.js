"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = void 0;
const adminMiddleware = (req, res, next) => {
    if (req.body.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
//# sourceMappingURL=admin.middleware.js.map