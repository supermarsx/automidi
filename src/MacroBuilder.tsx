import { useState } from 'react';
import { useStore, type Macro } from './store';
import { useToastStore } from './toastStore';
import MacroInstructions from './MacroInstructions';

export default function MacroBuilder() {
  const addMacro = useStore((s) => s.addMacro);
  const macros = useStore((s) => s.macros);
  const addToast = useToastStore((s) => s.addToast);
  const [confirmOverwrite, setConfirmOverwrite] = useState<Macro | null>(null);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState('');
  const [interval, setInterval] = useState(50);
  const [type, setType] = useState<
    'keys' | 'app' | 'shell' | 'shell_win' | 'shell_bg'
  >('keys');
  const [command, setCommand] = useState('');
  const [nextId, setNextId] = useState('');
  const [tags, setTags] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const clear = () => {
    setSequence('');
    setCommand('');
    setType('keys');
    setInterval(50);
    setNextId('');
    setTags('');
  };

  const save = () => {
    const macro: Macro = {
      id: Date.now().toString(),
      name: name.trim(),
      type,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (nextId) macro.nextId = nextId;
    if (type === 'keys') {
      const keys = sequence
        .split(/\s+/)
        .map((k) => k.trim())
        .filter(Boolean);
      if (keys.length === 0) return;
      macro.sequence = keys;
      macro.interval = Math.max(0, interval);
    } else {
      if (!command.trim()) return;
      macro.command = command.trim();
    }
    if (!macro.name) return;
    if (macros.some((m) => m.name === macro.name)) {
      setConfirmOverwrite(macro);
      return;
    }
    addMacro(macro);
    addToast('Macro saved', 'success');
    setName('');
    clear();
  };

  return (
    <div className="retro-panel mt-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="m-0">◄ Macro Builder ►</h3>
        <button
          className="retro-button btn-sm"
          onClick={() => setShowHelp(true)}
        >
          HELP
        </button>
      </div>
      <div className="mb-2 d-flex flex-wrap">
        <input
          className="form-control retro-input me-2 mb-1"
          placeholder="Macro name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="form-control retro-input me-2 mb-1"
          placeholder="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <select
          className="form-control retro-input me-2 mb-1"
          value={type}
          onChange={(e) =>
            setType(
              e.target.value as
                | 'keys'
                | 'app'
                | 'shell'
                | 'shell_win'
                | 'shell_bg',
            )
          }
        >
          <option value="keys">Keys</option>
          <option value="app">Application</option>
          <option value="shell">Shell</option>
          <option value="shell_win">Shell (Window)</option>
          <option value="shell_bg">Shell (Hidden)</option>
        </select>
        {type === 'keys' ? (
          <>
            <input
              className="form-control retro-input me-2 mb-1"
              placeholder="Key sequence"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
            />
            <input
              type="number"
              className="form-control retro-input me-2 mb-1"
              style={{ width: '80px' }}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
            />
          </>
        ) : (
          <input
            className="form-control retro-input me-2 mb-1"
            placeholder={type === 'app' ? 'App path' : 'Shell command'}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
        )}
        <select
          className="form-control retro-input me-2 mb-1"
          value={nextId}
          onChange={(e) => setNextId(e.target.value)}
        >
          <option value="">-- next macro --</option>
          {macros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button className="retro-button btn-sm mb-1" onClick={clear}>
          CLEAR
        </button>
      </div>
      <div className="mb-2">
        <button
          className="retro-button btn-sm"
          onClick={save}
          disabled={
            !name.trim() ||
            (type === 'keys' ? !sequence.trim() : !command.trim())
          }
        >
          SAVE
        </button>
        {type === 'keys' && (
          <span className="ms-2 text-info">
            {sequence.split(/\s+/).filter(Boolean).length} keys
          </span>
        )}
      </div>
      {showHelp && <MacroInstructions onClose={() => setShowHelp(false)} />}
      {confirmOverwrite && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setConfirmOverwrite(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content modal-retro">
              <div className="modal-header">
                <h5 className="modal-title">OVERWRITE MACRO</h5>
              </div>
              <div className="modal-body">
                Overwrite existing macro "{confirmOverwrite.name}"?
              </div>
              <div className="modal-footer">
                <button
                  className="retro-button me-2"
                  onClick={() => {
                    addMacro(confirmOverwrite);
                    addToast('Macro saved', 'success');
                    setName('');
                    clear();
                    setConfirmOverwrite(null);
                  }}
                >
                  YES
                </button>
                <button
                  className="retro-button"
                  onClick={() => setConfirmOverwrite(null)}
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
