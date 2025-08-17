import type { MessageHandler } from './types.js';

const handlePing: MessageHandler = (ws, data, _ctx) => {
  void _ctx;
  ws.send(JSON.stringify({ type: 'pong', ts: data.ts || Date.now() }));
};

export { handlePing };
