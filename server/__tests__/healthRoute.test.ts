import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';

describe('health route', () => {
  let server: Server;
  let stopServer: () => Promise<void>;

  beforeEach(async () => {
    vi.resetModules();
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

  it('returns ok', async () => {
    const agent = request(server);
    await agent.get('/health').expect(200).expect({ ok: true });
  });
});
