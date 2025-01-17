"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const auction_routes_1 = __importDefault(require("./routes/auction.routes"));
const bid_routes_1 = __importDefault(require("./routes/bid.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
const websocket_1 = __importDefault(require("./websocket"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const prisma = new client_1.PrismaClient();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'; // Replace with your actual Vercel URL
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// app.use(cors({
//   origin: [FRONTEND_URL, 'https://auctionx.loca.lt'], // Allow both Vercel and localtunnel URLs
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
app.use(express_1.default.json());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/auctions', auction_routes_1.default);
app.use('/bids', bid_routes_1.default);
app.use('/products', product_routes_1.default);
// Error handling
app.use(error_middleware_1.errorHandler);
// WebSocket setup
(0, websocket_1.default)(server);
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map