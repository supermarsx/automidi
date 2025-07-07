import { useState } from 'react';
import { useKeyRecorder } from './useKeyRecorder';
import { useStore } from './store';
import { useToastStore } from './toastStore';

export default function MacroBuilder() {
  const addMacro = useStore((s) => s.addMacro);
  const addToast = useToastStore((s) => s.addToast);
  const [name, setName] = useState('');
  const [recording, setRecording] = useState(false);
  const [timeBetween, setTimeBetween] = useState(100);
  const { keys, clear } = useKeyRecorder(recording);

  const toggleRecord = () => setRecording((r) => !r);

  const save = () => {
    if (!name.trim() || keys.length === 0) return;
    addMacro({
      id: Date.now().toString(),
      name: name.trim(),
      keys,
      timeBetween,
    });
    addToast('Macro saved', 'success');
    setName('');
    setTimeBetween(100);
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
        <button className="retro-button btn-sm me-2" onClick={toggleRecord}>
          {recording ? 'STOP' : 'RECORD'}
        </button>
        <button
          className="retro-button btn-sm"
          onClick={clear}
          disabled={keys.length === 0}
        >
          CLEAR
        </button>
      </div>
      <div className="mb-2 d-flex align-items-center">
        <label className="form-label text-info me-2 mb-0">DELAY(ms):</label>
        <input
          type="number"
          className="form-control retro-input me-2"
          style={{ width: '100px' }}
          value={timeBetween}
          onChange={(e) => setTimeBetween(parseInt(e.target.value) || 0)}
        />
        <span className="text-info">{keys.join(' ')}</span>
      </div>
      <div className="mb-2">
        <button
          className="retro-button btn-sm"
          onClick={save}
          disabled={!name.trim() || keys.length === 0}
        >
          SAVE
        </button>
        <span className="ms-2 text-info">{keys.length} keys</span>
      </div>
    </div>
  );
}
