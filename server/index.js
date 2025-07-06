import express from 'express';
import { WebSocketServer } from 'ws';
import { WebMidi } from 'webmidi';

const app = express();
app.use(express.json());

await WebMidi.enable();

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
WebMidi.addListener('midimessage', e => {
  const payload = JSON.stringify({ message: e.message.rawData, time: e.timestamp });
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
    }
  }
});
