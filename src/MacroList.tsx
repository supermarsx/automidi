import { useState } from 'react';
import MacroEditor from './MacroEditor';
import { useMacroPlayer } from './useMacroPlayer';
import { useStore, type Macro } from './store';

export default function MacroList() {
  const macros = useStore((s) => s.macros);
  const removeMacro = useStore((s) => s.removeMacro);
  const updateMacro = useStore((s) => s.updateMacro);
  const { playMacro } = useMacroPlayer();
  const [editing, setEditing] = useState<Macro | null>(null);

  const handleSave = (macro: Macro) => {
    updateMacro(macro);
    setEditing(null);
  };

  return (
    <div className="retro-panel">
      <h3>◄ Macro Sequencer ►</h3>
      {macros.length === 0 ? (
        <div className="text-warning text-center p-3">
          NO MACROS LOADED
        </div>
      ) : (
        <div>
          {macros.map((m) => (
            <div key={m.id} className="macro-list-item">
              <span className="macro-name">{m.name}</span>
              <div>
                <button className="retro-button btn-sm me-1" onClick={() => playMacro(m.id)}>
                  PLAY
                </button>
                <button className="retro-button btn-sm me-1" onClick={() => playMacro(m.id, { loop: true })}>
                  LOOP
                </button>
                <button className="retro-button btn-sm me-1" onClick={() => setEditing(m)}>
                  EDIT
                </button>
                <button className="retro-button btn-sm" onClick={() => removeMacro(m.id)}>
                  DEL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && (
        <MacroEditor
          macro={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}