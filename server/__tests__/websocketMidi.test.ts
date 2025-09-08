import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import type { Server } from 'http';
import type { SendMidiMessage } from '../../shared/messages';

describe('WebSocket MIDI handling', () => {
  const API_KEY = 'test-key';
  let server: Server;
  let stopServer: () => Promise<void>;
  let send: ReturnType<typeof vi.fn>;
  let exec: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.resetModules();
    process.env.API_KEY = API_KEY;
    process.env.ALLOWED_CMDS = '';
    process.env.PORT = '0';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wm = require('webmidi');
    wm.WebMidi.enable = vi.fn().mockResolvedValue(undefined);
    send = vi.fn();
    const output = { id: '1', name: 'out', send };
    Object.defineProperty(wm.WebMidi, 'inputs', {
      value: [],
      configurable: true,
    });
    Object.defineProperty(wm.WebMidi, 'outputs', {
      value: [output],
      configurable: true,
    });
    wm.WebMidi.addListener = vi.fn();
    wm.WebMidi.getOutputById = vi.fn((id: string) =>
      id === '1' ? output : undefined,
    );

    exec = vi.fn();
    vi.doMock('child_process', () => ({ exec }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../dist/index.js');
    server = await mod.startServer();
    stopServer = mod.stopServer;
  });

  afterEach(async () => {
    await stopServer();
    vi.clearAllMocks();
  });

  it('ignores invalid midi messages', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    const msg: SendMidiMessage = { type: 'send', port: '1', bytes: [256] };
    ws.send(JSON.stringify(msg));

    await new Promise((r) => setTimeout(r, 10));
    expect(send).not.toHaveBeenCalled();
    ws.close();
  });

  it('rejects malformed messages', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    ws.send(JSON.stringify({ type: 'runShell' }));

    await new Promise((r) => setTimeout(r, 10));
    expect(exec).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();

    ws.close();
    await new Promise((r) => ws.on('close', r));
    warn.mockRestore();
  });
});
