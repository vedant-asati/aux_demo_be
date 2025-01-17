"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bid_controller_1 = require("../controllers/bid.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public Routes
router.get('/', (req, res) => {
    res.send(200);
});
// Protected Routes
router.post('/', auth_middleware_1.authMiddleware, bid_controller_1.createBid);
exports.default = router;
//# sourceMappingURL=bid.routes.js.map