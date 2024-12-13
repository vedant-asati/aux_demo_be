import { WebSocketService } from "../services/websocket.service";

let wsService: WebSocketService;

export default function setupWebSocket(server: any) {
  if (!wsService) {
    wsService = new WebSocketService(server);
  }
  return wsService;
}

export function getWebSocketService() {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
}