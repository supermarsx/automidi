import { useState } from 'react';
import type { Macro } from './store';

interface Props {
  macro: Macro;
  onSave: (m: Macro) => void;
  onCancel: () => void;
}

export default function MacroEditor({ macro, onSave, onCancel }: Props) {
  const [name, setName] = useState(macro.name);
  const [keysStr, setKeysStr] = useState(macro.keys.join(' '));
  const [timeBetween, setTimeBetween] = useState(macro.timeBetween);

  const save = () => {
    const keys = keysStr.trim().split(/\s+/).filter(Boolean);
    onSave({ ...macro, name, keys, timeBetween });
  };

  return (
    <div className="retro-panel mt-3">
      <h4 className="text-warning">\u25C4 MACRO EDITOR \u25BA</h4>
      <div className="mb-2">
        <label className="form-label text-info">NAME:</label>
        <input
          className="form-control retro-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <label className="form-label text-info">KEYS:</label>
        <input
          className="form-control retro-input"
          value={keysStr}
          onChange={(e) => setKeysStr(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <label className="form-label text-info">DELAY(ms):</label>
        <input
          type="number"
          className="form-control retro-input"
          value={timeBetween}
          onChange={(e) => setTimeBetween(parseInt(e.target.value) || 0)}
        />
      </div>
      <div className="mt-3">
        <button className="retro-button me-2" onClick={save}>
          SAVE
        </button>
        <button className="retro-button" onClick={onCancel}>
          CANCEL
        </button>
      </div>
    </div>
  );
}
