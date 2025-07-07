import { useState } from 'react';
import MacroEditor from './MacroEditor';
import ConfirmButton from './ConfirmButton';
import { useMacroPlayer } from './useMacroPlayer';
import { useStore, type Macro } from './store';
import { useToastStore } from './toastStore';

export default function MacroList() {
  const macros = useStore((s) => s.macros);
  const removeMacro = useStore((s) => s.removeMacro);
  const updateMacro = useStore((s) => s.updateMacro);
  const addToast = useToastStore((s) => s.addToast);
  const { playMacro } = useMacroPlayer();
  const [editing, setEditing] = useState<Macro | null>(null);

  const handleSave = (macro: Macro) => {
    updateMacro(macro);
    setEditing(null);
    addToast('Macro saved', 'success');
  };

  return (
    <div className="retro-panel">
      <h3>◄ Macro Sequencer ►</h3>
      {macros.length === 0 ? (
        <div className="text-warning text-center p-3">NO MACROS LOADED</div>
      ) : (
        <div>
          {macros.map((m) => (
            <div key={m.id} className="macro-list-item">
              <span className="macro-name">{m.name}</span>
              <span className="ms-2 text-info">[{m.keys.join(' ')}]</span>
              <div>
                <button
                  className="retro-button btn-sm me-1"
                  onClick={() => playMacro(m.id)}
                >
                  PLAY
                </button>
                <button
                  className="retro-button btn-sm me-1"
                  onClick={() => playMacro(m.id, { loop: true })}
                >
                  LOOP
                </button>
                <button
                  className="retro-button btn-sm me-1"
                  onClick={() => setEditing(m)}
                >
                  EDIT
                </button>
                <ConfirmButton
                  className="btn-sm"
                  onConfirm={() => {
                    removeMacro(m.id);
                    addToast('Macro deleted', 'success');
                  }}
                >
                  DEL
                </ConfirmButton>
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
