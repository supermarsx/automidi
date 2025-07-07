import { useKeyMacroPlayer } from './useKeyMacroPlayer';
import { useStore } from './store';
import { useToastStore } from './toastStore';

export default function MacroList() {
  const macros = useStore((s) => s.macros);
  const removeMacro = useStore((s) => s.removeMacro);
  const addToast = useToastStore((s) => s.addToast);
  const { playMacro } = useKeyMacroPlayer();

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
              <div>
                <button
                  className="retro-button btn-sm me-1"
                  onClick={() => playMacro(m.id)}
                >
                  PLAY
                </button>
                <span className="ms-2 text-info">
                  {m.sequence.join(' ')} ({m.interval}ms)
                </span>
                <button
                  className="retro-button btn-sm"
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
    </div>
  );
}
