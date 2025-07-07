import { useKeyMacroPlayer } from './useKeyMacroPlayer';
import { useStore, type Macro } from './store';
import { useToastStore } from './toastStore';
import { useState } from 'react';

export default function MacroList() {
  const macros = useStore((s) => s.macros);
  const removeMacro = useStore((s) => s.removeMacro);
  const updateMacro = useStore((s) => s.updateMacro);
  const addToast = useToastStore((s) => s.addToast);
  const { playMacro } = useKeyMacroPlayer();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState('');
  const [interval, setInterval] = useState(50);
  const [type, setType] = useState<'keys' | 'app' | 'shell'>('keys');
  const [command, setCommand] = useState('');
  const [nextId, setNextId] = useState('');

  const startEdit = (id: string) => {
    const m = macros.find((x) => x.id === id);
    if (!m) return;
    setEditingId(id);
    setName(m.name);
    setSequence(m.sequence?.join(' ') || '');
    setInterval(m.interval ?? 50);
    setType(m.type || 'keys');
    setCommand(m.command || '');
    setNextId(m.nextId || '');
  };

  const saveEdit = () => {
    if (!editingId) return;
    const m: Macro = { id: editingId, name: name.trim(), type };
    if (nextId) m.nextId = nextId;
    if (type === 'keys') {
      const keys = sequence
        .split(/\s+/)
        .map((k) => k.trim())
        .filter(Boolean);
      if (keys.length === 0) return;
      m.sequence = keys;
      m.interval = Math.max(0, interval);
    } else {
      if (!command.trim()) return;
      m.command = command.trim();
    }
    updateMacro(m);
    addToast('Macro updated', 'success');
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  return (
    <div className="retro-panel">
      <h3>◄ Macro Sequencer ►</h3>
      {macros.length === 0 ? (
        <div className="text-warning text-center p-3">NO MACROS LOADED</div>
      ) : (
        <div>
          {macros.map((m) => (
            <div key={m.id} className="macro-list-item">
              {editingId === m.id ? (
                <div className="w-100">
                  <div className="d-flex flex-wrap mb-1">
                    <input
                      className="form-control retro-input me-2 mb-1"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <select
                      className="form-control retro-input me-2 mb-1"
                      value={type}
                      onChange={(e) =>
                        setType(e.target.value as 'keys' | 'app' | 'shell')
                      }
                    >
                      <option value="keys">Keys</option>
                      <option value="app">Application</option>
                      <option value="shell">Shell</option>
                    </select>
                    {type === 'keys' ? (
                      <>
                        <input
                          className="form-control retro-input me-2 mb-1"
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
                      {macros.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      className="retro-button btn-sm me-1"
                      onClick={saveEdit}
                    >
                      SAVE
                    </button>
                    <button
                      className="retro-button btn-sm"
                      onClick={cancelEdit}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="macro-name">{m.name}</span>
                  <div>
                    <button
                      className="retro-button btn-sm me-1"
                      onClick={() => playMacro(m.id)}
                    >
                      PLAY
                    </button>
                    <span className="ms-2 text-info">
                      {m.type === 'keys'
                        ? `${m.sequence?.join(' ')} (${m.interval}ms)`
                        : m.command}
                    </span>
                    <button
                      className="retro-button btn-sm ms-1"
                      onClick={() => startEdit(m.id)}
                    >
                      EDIT
                    </button>
                    <button
                      className="retro-button btn-sm ms-1"
                      onClick={() => {
                        removeMacro(m.id);
                        addToast('Macro deleted', 'success');
                      }}
                    >
                      DEL
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
