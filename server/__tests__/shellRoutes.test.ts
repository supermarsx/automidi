import request from 'supertest';
import type { Express } from 'express';

jest.mock('child_process', () => ({
  exec: jest.fn(
    (_cmd: string, optsOrCb?: unknown, cb?: (err: unknown) => void) => {
      const callback =
        typeof optsOrCb === 'function'
          ? optsOrCb
          : (cb as (err: unknown) => void);
      if (callback) callback(null);
    },
  ),
  spawn: jest.fn(() => ({ unref: jest.fn() })),
}));

describe('shell routes', () => {
  const API_KEY = 'test-key';
  const ALLOW = 'echo,win,app';
  let app: Express;
  let exec: jest.Mock;
  let spawn: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ({ exec, spawn } = require('child_process'));
    exec.mockClear();
    spawn.mockClear();
    process.env.API_KEY = API_KEY;
    process.env.ALLOWED_CMDS = ALLOW;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    app = require('../index.cjs');
  });

  it('executes allowed commands', async () => {
    await request(app)
      .post('/run/app')
      .set('x-api-key', API_KEY)
      .send({ app: 'app' })
      .expect(200);
    expect(exec).toHaveBeenCalledWith('"app"', expect.any(Function));

    await request(app)
      .post('/run/shell')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'echo hi' })
      .expect(200);
    expect(exec).toHaveBeenCalledWith('echo hi', expect.any(Function));

    await request(app)
      .post('/run/shellWin')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'win something' })
      .expect(200);
    expect(spawn).toHaveBeenCalledWith('win something', {
      shell: true,
      detached: true,
      windowsHide: false,
    });

    await request(app)
      .post('/run/shellBg')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'echo hi' })
      .expect(200);
    expect(exec).toHaveBeenCalledWith(
      'echo hi',
      { windowsHide: true },
      expect.any(Function),
    );
  });

  it('rejects disallowed commands', async () => {
    await request(app)
      .post('/run/shell')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'rm -rf /' })
      .expect(403);
    expect(exec).not.toHaveBeenCalled();

    await request(app)
      .post('/run/shellWin')
      .set('x-api-key', API_KEY)
      .send({ cmd: 'malicious' })
      .expect(403);
    expect(spawn).not.toHaveBeenCalled();
  });
});
