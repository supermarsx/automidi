import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { WebSocketServer } from 'ws';
import type { WebSocket } from 'ws';
import { WebMidi } from 'webmidi';
import keySender from 'node-key-sender';
import notifier from 'toasted-notifier';
import cors from 'cors';
import { exec, spawn } from 'child_process';

import { isValidCmd } from './validate.js';
import type { MidiEvent, MidiMessage } from './types.js';

const CMD_RATE_LIMIT = Number(process.env.CMD_RATE_LIMIT || 5);
const CMD_RATE_INTERVAL_MS = Number(process.env.CMD_RATE_INTERVAL_MS || 1000);

type TokenBucket = {
  count: number;
  last: number;
};

function createBucket(): TokenBucket {
  return { count: 0, last: Date.now() };
}

function consumeToken(bucket: TokenBucket): boolean {
  const now = Date.now();
  if (now - bucket.last > CMD_RATE_INTERVAL_MS) {
    bucket.count = 0;
    bucket.last = now;
  }
  if (bucket.count >= CMD_RATE_LIMIT) {
    return false;
  }
  bucket.count += 1;
  return true;
}

const API_KEY = process.env.API_KEY || undefined;
if (process.env.LOG_API_KEY === 'true') {
  console.log('API key:', API_KEY);
} else if (API_KEY) {
  console.log('Server started with API key set.');
} else {
  console.log('Server started with no API key required.');
}

const allowedCmds = (process.env.ALLOWED_CMDS || '')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

const LOG_MIDI = process.env.LOG_MIDI === 'true';

const app = express();
app.use(express.json());
app.use(cors());

function checkKey(req: Request, res: Response, next: NextFunction) {
  if (!API_KEY) {
    next();
    return;
  }
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

app.use(checkKey);

function isValidByteArray(arr: unknown): arr is number[] {
  return (
    Array.isArray(arr) &&
    arr.every(
      (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 255,
    )
  );
}

async function startServer() {
  try {
    await WebMidi.enable({ sysex: true });
    if (LOG_MIDI) console.log('WebMidi enabled successfully (with SysEx)');

    function listDevices() {
      const inputs = WebMidi.inputs.map((input) => ({
        id: input.id,
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state,
      }));
      const outputs = WebMidi.outputs.map((output) => ({
        id: output.id,
        name: output.name,
        manufacturer: output.manufacturer,
        state: output.state,
      }));
      return { inputs, outputs };
    }

    // Initialize device list
    listDevices();

    app.get('/midi/devices', (_req, res) => {
      res.json(listDevices());
    });

    app.post('/midi/send', (req, res) => {
      const { port = '', data } = req.body || {};
      if (!isValidByteArray(data)) {
        res.status(400).json({
          error: 'data must be an array of numbers between 0 and 255',
        });
        return;
      }
      const out = WebMidi.getOutputById(String(port));
      if (!out) {
        res.status(404).json({ error: `output port ${port} not found` });
        return;
      }
      try {
        out.send(data);
        if (LOG_MIDI) console.log(`Sent MIDI to ${out.name}:`, data);
        res.json({ ok: true });
      } catch (err) {
        console.error('MIDI send error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // Deprecated REST routes retained for backwards compatibility
    // Prefer using WebSocket messages instead of these endpoints
    app.post('/notify', (req, res) => {
      const { title = 'Automidi', message } = req.body || {};
      if (!message) {
        res.status(400).json({ error: 'message is required' });
        return;
      }
      notifier.notify({ title, message }, (err) => {
        if (err) console.error('Notification error:', err);
      });
      res.json({ ok: true });
    });

    app.post('/keys/type', async (req, res) => {
      const { sequence = [], interval = 50 } = req.body || {};
      if (!Array.isArray(sequence)) {
        res.status(400).json({ error: 'sequence must be an array of keys' });
        return;
      }
      try {
        for (const key of sequence) {
          await keySender.sendKey(key);
          if (interval > 0) {
            await new Promise((r) => setTimeout(r, interval));
          }
        }
        res.json({ ok: true });
      } catch (err) {
        console.error('Key send error:', err);
        res.status(500).json({ error: err.message });
      }
    });

    const server = app.listen(process.env.PORT || 3000, () => {
      const addr = server.address();
      const port = typeof addr === 'string' ? addr : addr?.port;
      console.log(`Server listening on port ${port}`);
    });

    const wss = new WebSocketServer({
      server,
      verifyClient: (info, done) => {
        const url = new URL(info.req.url || '', 'http://localhost');
        if (API_KEY && url.searchParams.get('key') !== API_KEY) {
          done(false, 401, 'Unauthorized');
        } else {
          done(true);
        }
      },
    });

    function broadcastToClients(message: unknown) {
      const payload = JSON.stringify(message);
      for (const ws of wss.clients) {
        if (ws.readyState === ws.OPEN) {
          ws.send(payload);
        }
      }
    }

    function sendDevices(ws?: WebSocket) {
      const devices = listDevices();
      const message = { type: 'devices', ...devices };
      if (ws) {
        ws.send(JSON.stringify(message));
      } else {
        broadcastToClients(message);
      }
    }

    // Remove all listeners from every input
    function cleanupMidiListeners() {
      WebMidi.inputs.forEach((input) => {
        input.removeListener();
      });
    }

    // Set up MIDI input listeners for all devices
    function setupMidiListeners() {
      cleanupMidiListeners();
      WebMidi.inputs.forEach((input) => {
        if (LOG_MIDI)
          console.log(`Setting up listener for input: ${input.name}`);

        // Listen to all MIDI messages
        input.addListener('midimessage', (e) => {
          const bytes = Array.from(e.message.data || e.data || []);
          const message: MidiEvent = {
            type: 'midi',
            direction: 'in',
            message: bytes,
            timestamp: e.timestamp || Date.now(),
            source: input.name,
            port: input.id,
          };
          // For aftertouch messages (poly or channel), capture the pressure
          if (
            bytes.length >= 3 &&
            ((bytes[0] & 0xf0) === 0xa0 || (bytes[0] & 0xf0) === 0xd0)
          ) {
            message.pressure = bytes[2];
          }
          if (LOG_MIDI) console.log('MIDI IN:', message);
          broadcastToClients(message);
        });

        // Listen to specific message types for better logging
        input.addListener('noteon', (e) => {
          if (LOG_MIDI) {
            const velocity = (e as unknown as { velocity?: number }).velocity;
            console.log(
              `Note ON from ${input.name}: ${e.note.name}${e.note.octave} vel:${velocity}`,
            );
          }
        });

        input.addListener('noteoff', (e) => {
          if (LOG_MIDI)
            console.log(
              `Note OFF from ${input.name}: ${e.note.name}${e.note.octave}`,
            );
        });

        input.addListener('controlchange', (e) => {
          if (LOG_MIDI)
            console.log(
              `CC from ${input.name}: CC${e.controller.number} val:${e.value}`,
            );
        });
      });
    }

    // Initial setup
    setupMidiListeners();

    wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      (ws as WebSocket & { bucket: TokenBucket }).bucket = createBucket();
      sendDevices(ws);

      ws.on('message', (msg) => {
        try {
          const data = JSON.parse(msg.toString()) as {
            type?: string;
            [key: string]: unknown;
          };
          console.log('Received WebSocket message:', data);

          if (
            data.type === 'runApp' ||
            data.type === 'runShell' ||
            data.type === 'runShellWin' ||
            data.type === 'runShellBg'
          ) {
            const bucket = (ws as WebSocket & { bucket: TokenBucket }).bucket;
            if (!consumeToken(bucket)) {
              console.warn('Command rate limit exceeded');
              return;
            }
          }

          if (data.type === 'getDevices') {
            sendDevices(ws);
          } else if (data.type === 'send') {
            const { port = '', bytes } = data as unknown as MidiMessage;
            const out = WebMidi.getOutputById(String(port));
            if (!out) {
              console.error('Invalid output port:', { port });
              return;
            }
            if (!isValidByteArray(bytes)) {
              console.error('Invalid bytes array:', { bytes });
              return;
            }
            try {
              out.send(bytes);
              if (LOG_MIDI)
                console.log(`Sent MIDI via WebSocket to ${out.name}:`, bytes);

              // Broadcast the outgoing message to all clients for logging
              const outMsg: MidiEvent = {
                type: 'midi',
                direction: 'out',
                message: bytes,
                timestamp: Date.now(),
                target: out.name,
                port,
              };
              if (
                bytes.length >= 3 &&
                ((bytes[0] & 0xf0) === 0xa0 || (bytes[0] & 0xf0) === 0xd0)
              ) {
                outMsg.pressure = bytes[2];
              }
              broadcastToClients(outMsg);
            } catch (err) {
              console.error('WebSocket MIDI send error:', err);
            }
          } else if (data.type === 'runApp') {
            const { app: appPath } = data as { app?: string };
            if (!appPath) return;
            if (!isValidCmd(appPath, allowedCmds)) return;
            exec(`"${appPath}"`, (err) => {
              if (err) console.error('App exec error:', err);
            });
          } else if (data.type === 'runShell') {
            const { cmd } = data as { cmd?: string };
            if (!cmd) return;
            if (!isValidCmd(cmd, allowedCmds)) return;
            exec(cmd, (err) => {
              if (err) console.error('Shell exec error:', err);
            });
          } else if (data.type === 'runShellWin') {
            const { cmd } = data as { cmd?: string };
            if (!cmd) return;
            if (!isValidCmd(cmd, allowedCmds)) return;
            try {
              const child = spawn(cmd, {
                shell: true,
                detached: true,
                windowsHide: false,
              });
              child.unref();
            } catch (err) {
              console.error('ShellWin spawn error:', err);
            }
          } else if (data.type === 'runShellBg') {
            const { cmd } = data as { cmd?: string };
            if (!cmd) return;
            if (!isValidCmd(cmd, allowedCmds)) return;
            exec(cmd, { windowsHide: true }, (err) => {
              if (err) console.error('ShellBg exec error:', err);
            });
          } else if (data.type === 'keysType') {
            const { sequence = [], interval = 50 } = data as {
              sequence?: string[];
              interval?: number;
            };
            (async () => {
              try {
                for (const key of sequence) {
                  await keySender.sendKey(key);
                  if (interval > 0)
                    await new Promise((r) => setTimeout(r, interval));
                }
              } catch (err) {
                console.error('Key send error:', err);
              }
            })();
          } else if (data.type === 'notify') {
            const { title = 'Automidi', message } = data as {
              title?: string;
              message?: string;
            };
            if (!message) return;
            notifier.notify({ title, message }, (err) => {
              if (err) console.error('Notification error:', err);
            });
          } else if (data.type === 'ping') {
            ws.send(
              JSON.stringify({
                type: 'pong',
                ts: (data as { ts?: number }).ts || Date.now(),
              }),
            );
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });

    // Listen for device changes
    WebMidi.addListener('portschanged', () => {
      if (LOG_MIDI) console.log('MIDI ports changed');
      cleanupMidiListeners();
      listDevices();
      setupMidiListeners(); // Re-setup listeners for new devices
      sendDevices(); // Broadcast to all clients
    });
    return server;
  } catch (err) {
    console.error('Failed to enable WebMidi:', err);
    throw err;
  }
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Server failed to start:', err);
    process.exit(1);
  });
}

export { app, startServer };
