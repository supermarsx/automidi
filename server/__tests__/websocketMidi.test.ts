import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import WebSocket from 'ws';
import type { Server } from 'http';
import type { SendMidiMessage, RunShellMessage } from '../../shared/messages';

describe('WebSocket MIDI handling', () => {
  const API_KEY = 'test-key';
  let server: Server;
  let stopServer: () => Promise<void>;
  let send: ReturnType<typeof vi.fn>;
  let exec: ReturnType<typeof vi.fn>;
  let spawn: ReturnType<typeof vi.fn>;
  let prevAllowed: string | undefined;
  let prevRateLimit: string | undefined;
  let prevRateInterval: string | undefined;

  beforeEach(async () => {
    vi.resetModules();
    process.env.API_KEY = API_KEY;
    prevAllowed = process.env.ALLOWED_CMDS;
    process.env.ALLOWED_CMDS = 'echo';
    prevRateLimit = process.env.CMD_RATE_LIMIT;
    prevRateInterval = process.env.CMD_RATE_INTERVAL_MS;
    process.env.CMD_RATE_LIMIT = '2';
    process.env.CMD_RATE_INTERVAL_MS = '100';
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

    // Spy on child_process methods before requiring the server so they are used internally
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cp = require('child_process');
    exec = vi.spyOn(cp, 'exec').mockImplementation(() => undefined);
    spawn = vi.spyOn(cp, 'spawn').mockImplementation(() => ({
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../dist/index.js');
    server = await mod.startServer();
    stopServer = mod.stopServer;
  });

  afterEach(async () => {
    await stopServer();
    vi.clearAllMocks();
    if (prevAllowed === undefined) delete process.env.ALLOWED_CMDS;
    else process.env.ALLOWED_CMDS = prevAllowed;
    if (prevRateLimit === undefined) delete process.env.CMD_RATE_LIMIT;
    else process.env.CMD_RATE_LIMIT = prevRateLimit;
    if (prevRateInterval === undefined) delete process.env.CMD_RATE_INTERVAL_MS;
    else process.env.CMD_RATE_INTERVAL_MS = prevRateInterval;
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

  it('rate limits runShell commands', async () => {
    const port = (server.address() as { port: number }).port;
    const ws = new WebSocket(`ws://localhost:${port}?key=${API_KEY}`);
    await new Promise((r) => ws.on('open', r));

    const limit = Number(process.env.CMD_RATE_LIMIT);
    const msg: RunShellMessage = { type: 'runShell', cmd: 'echo test' };
    for (let i = 0; i < limit + 2; i++) {
      ws.send(JSON.stringify(msg));
    }

    await new Promise((r) => setTimeout(r, 50));
    expect(spawn).toHaveBeenCalledTimes(limit);

    ws.close();
    await new Promise((r) => ws.on('close', r));
  });
});
