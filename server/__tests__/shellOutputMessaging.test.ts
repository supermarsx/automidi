import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import type { Server } from 'http';
import type { RunShellMessage } from '../../shared/messages';

// These tests use actual child processes to verify shell output messaging

describe('shell output messaging', () => {
  const API_KEY = 'test-key';
  let server: Server;
  let stopServer: () => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
    process.env.API_KEY = API_KEY;
    process.env.ALLOWED_CMDS = 'node';
    process.env.PORT = '0';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const wm = require('webmidi');
    wm.WebMidi.enable = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(wm.WebMidi, 'inputs', {
      value: [],
      configurable: true,
    });
    Object.defineProperty(wm.WebMidi, 'outputs', {
      value: [],
      configurable: true,
    });
    wm.WebMidi.addListener = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../dist/index.js');
    server = await mod.startServer();
    stopServer = mod.stopServer;
  });

  afterEach(async () => {
    await stopServer();
    vi.clearAllMocks();
  });

  it('broadcasts shell output chunks', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    const messages: unknown[] = [];
    ws.on('message', (data) => messages.push(JSON.parse(data.toString())));
    await new Promise((r) => ws.on('open', r));

    const cmd = 'node server/__tests__/fixtures/stdout-stderr.js';
    const msg: RunShellMessage = { type: 'runShell', cmd };
    ws.send(JSON.stringify(msg));

    await new Promise((r) => setTimeout(r, 200));

    expect(messages).toContainEqual({
      type: 'shellOutput',
      cmd,
      stream: 'stdout',
      data: 'out',
    });
    expect(messages).toContainEqual({
      type: 'shellOutput',
      cmd,
      stream: 'stderr',
      data: 'err',
    });
    ws.close();
  });
});
