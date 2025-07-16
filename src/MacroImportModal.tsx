import { useState } from 'react';
import { useStore, type Macro } from './store';
import { useToastStore } from './toastStore';

interface Props {
  onClose: () => void;
}

export default function MacroImportModal({ onClose }: Props) {
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<Macro[] | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('Invalid format');
        setData(parsed as Macro[]);
      } catch {
        setData(null);
        addToast('Failed to parse file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!data) return;
    const base = Date.now();
    const idMap = new Map<string, string>();
    data.forEach((m, idx) => {
      idMap.set(m.id, (base + idx).toString());
    });
    const imported = data.map((m) => {
      const newId = idMap.get(m.id) as string;
      const next = m.nextId ? (idMap.get(m.nextId) ?? m.nextId) : undefined;
      return { ...m, id: newId, ...(next ? { nextId: next } : {}) };
    });
    useStore.setState((s) => ({ ...s, macros: imported }));
    addToast('Macros imported', 'success');
    onClose();
  };

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content modal-retro">
          <div className="modal-header">
            <h5 className="modal-title">IMPORT MACROS</h5>
          </div>
          <div className="modal-body">
            <input
              type="file"
              accept="application/json"
              onChange={handleFile}
            />
          </div>
          <div className="modal-footer">
            <button
              className="retro-button me-2"
              onClick={confirmImport}
              disabled={!data}
            >
              IMPORT
            </button>
            <button className="retro-button" onClick={onClose}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
