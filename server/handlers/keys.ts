import keySender from 'node-key-sender';
import type { MessageHandler } from './types.js';

const handleKeysType: MessageHandler = async (_ws, data, _ctx) => {
  const { sequence = [], interval = 50 } = data;
  void _ctx;
  try {
    for (const key of sequence) {
      await keySender.sendKey(key);
      if (interval > 0) {
        await new Promise((r) => setTimeout(r, interval));
      }
    }
  } catch (err) {
    console.error('Key send error:', err);
  }
};

export { handleKeysType };
