import { useEffect, useState } from 'react';
import { useMidi } from './useMidi';
import { sysex } from './midiMessages';
import './SysexWorkbench.css';

interface CommandDef {
  code: number;
  name: string;
  params: number;
}

const COMMANDS: CommandDef[] = [
  { code: 0x00, name: 'Command 00h', params: 1 },
  { code: 0x01, name: 'Command 01h', params: 2 },
  { code: 0x02, name: 'Command 02h', params: 3 },
  { code: 0x03, name: 'Command 03h', params: 4 },
  { code: 0x04, name: 'Command 04h', params: 1 },
  { code: 0x05, name: 'Command 05h', params: 2 },
  { code: 0x06, name: 'Command 06h', params: 3 },
  { code: 0x07, name: 'Command 07h', params: 4 },
  { code: 0x08, name: 'Command 08h', params: 1 },
  { code: 0x09, name: 'Command 09h', params: 2 },
  { code: 0x0a, name: 'Command 0Ah', params: 3 },
  { code: 0x0b, name: 'Command 0Bh', params: 4 },
  { code: 0x0c, name: 'Command 0Ch', params: 1 },
  { code: 0x0d, name: 'Command 0Dh', params: 2 },
  { code: 0x0e, name: 'Command 0Eh', params: 3 },
  { code: 0x0f, name: 'Command 0Fh', params: 4 },
  { code: 0x10, name: 'Command 10h', params: 1 },
  { code: 0x11, name: 'Command 11h', params: 2 },
  { code: 0x12, name: 'Command 12h', params: 3 },
  { code: 0x13, name: 'Command 13h', params: 4 },
  { code: 0x14, name: 'Command 14h', params: 1 },
  { code: 0x15, name: 'Command 15h', params: 2 },
  { code: 0x16, name: 'Command 16h', params: 3 },
  { code: 0x17, name: 'Command 17h', params: 4 },
];

export default function SysexWorkbench() {
  const { send } = useMidi();
  const [cmd, setCmd] = useState<number>(COMMANDS[0].code);
  const [params, setParams] = useState<number[]>(() =>
    Array.from({ length: COMMANDS[0].params }, () => 0),
  );

  useEffect(() => {
    const def = COMMANDS.find((c) => c.code === cmd);
    if (!def) return;
    setParams((prev) => {
      const copy = prev.slice(0, def.params);
      while (copy.length < def.params) copy.push(0);
      return copy;
    });
  }, [cmd]);

  const handleParam = (index: number, value: string) => {
    const num = Math.max(0, Math.min(127, Number(value)));
    setParams((prev) => {
      const copy = [...prev];
      copy[index] = num;
      return copy;
    });
  };

  const bytes = sysex(cmd, ...params);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');

  return (
    <div className="sysex-workbench">
      <label>
        Command:
        <select value={cmd} onChange={(e) => setCmd(Number(e.target.value))}>
          {COMMANDS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <div className="params">
        {params.map((p, i) => (
          <input
            key={i}
            type="number"
            min={0}
            max={127}
            value={p}
            onChange={(e) => handleParam(i, e.target.value)}
          />
        ))}
      </div>
      <pre>{hex}</pre>
      <button onClick={() => send(bytes)}>Send</button>
    </div>
  );
}
