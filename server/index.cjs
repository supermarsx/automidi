const express = require('express');
const { WebSocketServer } = require('ws');
const { WebMidi } = require('webmidi');

const app = express();
app.use(express.json());

WebMidi.enable().then(() => {
  function listDevices() {
    const inputs = WebMidi.inputs.map((input, index) => ({ id: index, name: input.name }));
    const outputs = WebMidi.outputs.map((output, index) => ({ id: index, name: output.name }));
    return { inputs, outputs };
  }

  app.get('/midi/devices', (_req, res) => {
    res.json(listDevices());
  });

  app.post('/midi/send', (req, res) => {
    const { port = 0, data } = req.body || {};
    if (!Array.isArray(data)) {
      res.status(400).json({ error: 'data must be an array of numbers' });
      return;
    }
    const out = WebMidi.outputs[port];
    if (!out) {
      res.status(404).json({ error: `output port ${port} not found` });
      return;
    }
    try {
      out.send(data);
      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  const server = app.listen(process.env.PORT || 3000, () => {
    console.log(`Server listening on port ${server.address().port}`);
  });

  const wss = new WebSocketServer({ server });

  function sendDevices(ws) {
    ws.send(JSON.stringify({ type: 'devices', ...listDevices() }));
  }

  wss.on('connection', ws => {
    sendDevices(ws);
    ws.on('message', msg => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === 'getDevices') {
          sendDevices(ws);
        } else if (data.type === 'send') {
          const { port = 0, bytes } = data;
          const out = WebMidi.outputs[port];
          if (!out || !Array.isArray(bytes)) return;
          try {
            out.send(bytes);
          } catch (err) {
            console.error(err);
          }
        }
      } catch {
        // ignore malformed messages
      }
    });
  });

  WebMidi.addListener('portschanged', () => {
    const payload = JSON.stringify({ type: 'devices', ...listDevices() });
    for (const ws of wss.clients) {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    }
  });

  WebMidi.addListener('midimessage', e => {
    const source = e.port?.name ?? e.target?.name ?? 'unknown';
    const payload = JSON.stringify({
      type: 'midi',
      message: e.message.rawData,
      time: e.timestamp,
      source,
    });
    for (const ws of wss.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }
  });
});