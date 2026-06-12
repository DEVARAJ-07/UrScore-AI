import { WebSocket, WebSocketServer } from 'ws';

interface ScanUpdate {
  scanId: string;
  status: string;
  progress: number;
  logs: string[];
}

export class WebSocketGateway {
  private wss: WebSocketServer;
  private connections: Map<string, Set<WebSocket>> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.init();
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      let registeredScanId: string | null = null;

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          if (data.type === 'SUBSCRIBE' && data.scanId) {
            registeredScanId = data.scanId;
            if (!this.connections.has(registeredScanId!)) {
              this.connections.set(registeredScanId!, new Set());
            }
            this.connections.get(registeredScanId!)!.add(ws);
            
            // Send acknowledgement
            ws.send(JSON.stringify({
              type: 'SUBSCRIBED',
              scanId: registeredScanId,
              message: `Subscribed to real-time updates for scan ${registeredScanId}`
            }));
          }
        } catch (err) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid subscription message format' }));
        }
      });

      ws.on('close', () => {
        if (registeredScanId && this.connections.has(registeredScanId)) {
          const set = this.connections.get(registeredScanId);
          if (set) {
            set.delete(ws);
            if (set.size === 0) {
              this.connections.delete(registeredScanId);
            }
          }
        }
      });
    });
  }

  public sendScanUpdate(scanId: string, update: Partial<ScanUpdate>) {
    const clients = this.connections.get(scanId);
    if (clients) {
      const payload = JSON.stringify({
        type: 'SCAN_UPDATE',
        scanId,
        ...update
      });
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }
  }
}

let gatewayInstance: WebSocketGateway | null = null;

export const initGateway = (wss: WebSocketServer): WebSocketGateway => {
  gatewayInstance = new WebSocketGateway(wss);
  return gatewayInstance;
};

export const getGateway = (): WebSocketGateway => {
  if (!gatewayInstance) {
    throw new Error('WebSocketGateway is not initialized yet.');
  }
  return gatewayInstance;
};
