import { WebMidi } from 'webmidi';
import type { MessageHandler } from './types.js';

const handleGetDevices: MessageHandler = (ws, _data, ctx) => {
  ctx.sendDevices(ws);
};

const handleSend: MessageHandler = (_ws, data, ctx) => {
  const { port = '', bytes } = data;
  const out = WebMidi.getOutputById(String(port));
  if (!out) {
    console.error('Invalid output port:', { port });
    return;
  }
  if (!ctx.isValidByteArray(bytes)) {
    console.error('Invalid bytes array:', { bytes });
    return;
  }
  try {
    out.send(bytes);
    if (ctx.LOG_MIDI)
      console.log(`Sent MIDI via WebSocket to ${out.name}:`, bytes);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outMsg: any = {
      type: 'midi',
      direction: 'out',
      message: bytes,
      timestamp: Date.now(),
      target: out.name,
      port: port,
    };
    if (
      bytes.length >= 3 &&
      ((bytes[0] & 0xf0) === 0xa0 || (bytes[0] & 0xf0) === 0xd0)
    ) {
      outMsg.pressure = bytes[2];
    }
    ctx.broadcastToClients(outMsg);
  } catch (err) {
    console.error('WebSocket MIDI send error:', err);
  }
};

export { handleGetDevices, handleSend };
