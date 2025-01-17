"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = setupWebSocket;
exports.getWebSocketService = getWebSocketService;
const websocket_service_1 = require("../services/websocket.service");
let wsService;
function setupWebSocket(server) {
    if (!wsService) {
        wsService = new websocket_service_1.WebSocketService(server);
    }
    return wsService;
}
function getWebSocketService() {
    if (!wsService) {
        throw new Error('WebSocket service not initialized');
    }
    return wsService;
}
//# sourceMappingURL=index.js.map