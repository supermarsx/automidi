import { useState } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';

export default function MacroBuilder() {
  const addMacro = useStore((s) => s.addMacro);
  const addToast = useToastStore((s) => s.addToast);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState('');
  const [interval, setInterval] = useState(50);

  const clear = () => setSequence('');

  const save = () => {
    const keys = sequence
      .split(/\s+/)
      .map((k) => k.trim())
      .filter(Boolean);
    if (!name.trim() || keys.length === 0) return;
    addMacro({
      id: Date.now().toString(),
      name: name.trim(),
      sequence: keys,
      interval: Math.max(0, interval),
    });
    addToast('Macro saved', 'success');
    setName('');
    clear();
  };

  return (
    <div className="retro-panel mt-3">
      <h3>◄ Macro Builder ►</h3>
      <div className="mb-2 d-flex">
        <input
          className="form-control retro-input me-2"
          placeholder="Macro name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="form-control retro-input me-2"
          placeholder="Key sequence (space separated)"
          value={sequence}
          onChange={(e) => setSequence(e.target.value)}
        />
        <input
          type="number"
          className="form-control retro-input me-2"
          style={{ width: '80px' }}
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value))}
        />
        <button
          className="retro-button btn-sm"
          onClick={clear}
          disabled={!sequence.trim()}
        >
          CLEAR
        </button>
      </div>
      <div className="mb-2">
        <button
          className="retro-button btn-sm"
          onClick={save}
          disabled={!name.trim() || !sequence.trim()}
        >
          SAVE
        </button>
        <span className="ms-2 text-info">
          {sequence.split(/\s+/).filter(Boolean).length} keys
        </span>
      </div>
    </div>
  );
}
