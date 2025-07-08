import { useKeyMacroPlayer } from './useKeyMacroPlayer';
import { useStore, type Macro } from './store';
import { useToastStore } from './toastStore';
import { useState } from 'react';
import MacroImportModal from './MacroImportModal';
import MacroInstructions from './MacroInstructions';

export default function MacroList() {
  const macros = useStore((s) => s.macros);
  const removeMacro = useStore((s) => s.removeMacro);
  const updateMacro = useStore((s) => s.updateMacro);
  const reorderMacro = useStore((s) => s.reorderMacro);
  const addToast = useToastStore((s) => s.addToast);
  const { playMacro } = useKeyMacroPlayer();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sequence, setSequence] = useState('');
  const [interval, setInterval] = useState(50);
  const [type, setType] = useState<
    'keys' | 'app' | 'shell' | 'shell_win' | 'shell_bg'
  >('keys');
  const [command, setCommand] = useState('');
  const [nextId, setNextId] = useState('');
  const [tags, setTags] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

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
    setTags((m.tags || []).join(', '));
  };

  const startPreview = (id: string) => {
    const m = macros.find((x) => x.id === id);
    if (!m) return;
    setPreviewId(id);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const m: Macro = {
      id: editingId,
      name: name.trim(),
      type,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
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

  const cancelEdit = () => {
    setEditingId(null);
    setTags('');
  };
  const closePreview = () => setPreviewId(null);

  const exportMacros = () => {
    const data = JSON.stringify(macros);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'macros.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Macros exported', 'success');
  };

  return (
    <div className="retro-panel">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="m-0">◄ Macro Sequencer ►</h3>
        <div>
          <button
            className="retro-button btn-sm me-1"
            onClick={() => setShowHelp(true)}
          >
            HELP
          </button>
          <button className="retro-button btn-sm me-1" onClick={exportMacros}>
            EXPORT
          </button>
          <button
            className="retro-button btn-sm"
            onClick={() => setShowImport(true)}
          >
            IMPORT
          </button>
        </div>
      </div>
      <div className="mb-2">
        <input
          className="form-control retro-input"
          placeholder="filter tag"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        />
      </div>
      {macros.length === 0 ? (
        <div className="text-warning text-center p-3">NO MACROS LOADED</div>
      ) : (
        <div>
          {macros
            .filter(
              (m) => !filterTag.trim() || m.tags?.includes(filterTag.trim()),
            )
            .map((m, idx) => (
              <div key={m.id} className="macro-list-item">
                <span className="macro-name">
                  {m.name}
                  <small className="ms-1 text-info">
                    (
                    {(() => {
                      const txt =
                        m.type === 'keys'
                          ? `${(m.sequence || []).join(' ')} (${m.interval ?? 0}ms)`
                          : m.command || '';
                      return txt.length > 20 ? `${txt.slice(0, 20)}…` : txt;
                    })()}
                    )
                  </small>
                  {m.tags && m.tags.length > 0 && (
                    <small className="ms-1 text-warning">
                      [{m.tags.join(', ')}]
                    </small>
                  )}
                </span>
                <div>
                  <button
                    className="retro-button btn-sm me-1"
                    disabled={idx === 0}
                    onClick={() => reorderMacro(idx, idx - 1)}
                  >
                    ↑
                  </button>
                  <button
                    className="retro-button btn-sm me-1"
                    disabled={idx === macros.length - 1}
                    onClick={() => reorderMacro(idx, idx + 1)}
                  >
                    ↓
                  </button>
                  <button
                    className="retro-button btn-sm me-1"
                    onClick={() => playMacro(m.id)}
                  >
                    PLAY
                  </button>
                  <button
                    className="retro-button btn-sm me-1"
                    onClick={() => startPreview(m.id)}
                  >
                    PREVIEW
                  </button>
                  <button
                    className="retro-button btn-sm me-1"
                    onClick={() => startEdit(m.id)}
                  >
                    EDIT
                  </button>
                  <button
                    className="retro-button btn-sm me-1"
                    onClick={() => {
                      removeMacro(m.id);
                      addToast('Macro deleted', 'success');
                    }}
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      {editingId && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={cancelEdit}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content modal-retro">
              <div className="modal-header">
                <h5 className="modal-title">EDIT MACRO</h5>
              </div>
              <div className="modal-body">
                <div className="d-flex flex-wrap mb-2">
                  <input
                    className="form-control retro-input me-2 mb-1"
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
              </div>
              <div className="modal-footer">
                <button className="retro-button me-2" onClick={saveEdit}>
                  SAVE
                </button>
                <button className="retro-button" onClick={cancelEdit}>
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {previewId && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={closePreview}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content modal-retro">
              <div className="modal-header">
                <h5 className="modal-title">MACRO DETAILS</h5>
              </div>
              <div className="modal-body">
                {(() => {
                  const m = macros.find((x) => x.id === previewId);
                  if (!m) return null;
                  return (
                    <div>
                      <p>
                        <strong>Name:</strong> {m.name}
                      </p>
                      <p>
                        <strong>Type:</strong> {m.type || 'keys'}
                      </p>
                      {m.type === 'keys' ? (
                        <>
                          <p>
                            <strong>Sequence:</strong>{' '}
                            {(m.sequence || []).join(' ')}
                          </p>
                          <p>
                            <strong>Interval:</strong> {m.interval ?? 0}ms
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong>
                            {m.type === 'app' ? 'App Path' : 'Command'}:
                          </strong>{' '}
                          {m.command}
                        </p>
                      )}
                      {m.nextId && (
                        <p>
                          <strong>Next Macro:</strong>{' '}
                          {macros.find((x) => x.id === m.nextId)?.name ||
                            m.nextId}
                        </p>
                      )}
                      {m.tags && m.tags.length > 0 && (
                        <p>
                          <strong>Tags:</strong> {m.tags.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="modal-footer">
                <button className="retro-button" onClick={closePreview}>
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showImport && <MacroImportModal onClose={() => setShowImport(false)} />}
      {showHelp && <MacroInstructions onClose={() => setShowHelp(false)} />}
    </div>
  );
}
