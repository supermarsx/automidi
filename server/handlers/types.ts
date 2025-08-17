import type { WebSocket } from 'ws';

export interface HandlerContext {
  sendDevices: (ws?: WebSocket) => void;
  isValidByteArray: (arr: unknown) => arr is number[];
  broadcastToClients: (message: unknown) => void;
  allowedCmds: string[];
  LOG_MIDI: boolean;
}

export type MessageHandler = (
  ws: WebSocket,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  context: HandlerContext,
) => void;
