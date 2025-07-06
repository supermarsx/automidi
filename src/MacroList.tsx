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
    <div>
      <h2>Macros</h2>
      <ul>
        {macros.map((m) => (
          <li key={m.id}>
            {m.name}
            <button onClick={() => playMacro(m.id)}>Play</button>
            <button onClick={() => playMacro(m.id, { loop: true })}>
              Loop
            </button>
            <button onClick={() => setEditing(m)}>Edit</button>
            <button onClick={() => removeMacro(m.id)}>Delete</button>
          </li>
        ))}
      </ul>
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
