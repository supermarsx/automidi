import { useState } from 'react';
import { useStore } from './store';
import type { Macro } from './store/macros';
import { useToastStore } from './toastStore';
import { isTauri, openFile, readTextFile } from './tauriApi';

interface Props {
  onClose: () => void;
}

export default function MacroImportModal({ onClose }: Props) {
  const addToast = useToastStore((s) => s.addToast);
  const [data, setData] = useState<Macro[] | null>(null);

  const handleTauriImport = async () => {
    try {
      const filePath = await openFile({
        title: 'Import Macros',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (filePath) {
        const content = await readTextFile(filePath);
        if (content) {
          const parsed = JSON.parse(content);
          if (
            !Array.isArray(parsed) ||
            parsed.some(
              (m) =>
                typeof m !== 'object' ||
                typeof m.id !== 'string' ||
                typeof m.name !== 'string',
            )
          ) {
            throw new Error('Invalid format');
          }
          setData(parsed as Macro[]);
          addToast('File loaded successfully', 'success');
        }
      }
    } catch (error) {
      setData(null);
      addToast(`Failed to import: ${error}`, 'error');
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (
          !Array.isArray(parsed) ||
          parsed.some(
            (m) =>
              typeof m !== 'object' ||
              typeof m.id !== 'string' ||
              typeof m.name !== 'string',
          )
        ) {
          throw new Error('Invalid format');
        }
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
    const existing = useStore.getState().macros;
    const usedIds = new Set(existing.map((m) => m.id));
    const idMap = new Map<string, string>();
    const generated = new Set<string>(usedIds);
    let counter = 0;
    const base = Date.now();
    const getId = () => {
      let id = '';
      do {
        id = (base + counter++).toString();
      } while (generated.has(id));
      generated.add(id);
      return id;
    };
    data.forEach((m) => {
      if (generated.has(m.id)) {
        idMap.set(m.id, getId());
      } else {
        idMap.set(m.id, m.id);
        generated.add(m.id);
      }
    });
    const imported = data.map((m) => {
      const newId = idMap.get(m.id) as string;
      const next = m.nextId ? (idMap.get(m.nextId) ?? m.nextId) : undefined;
      return { ...m, id: newId, ...(next ? { nextId: next } : {}) };
    });
    useStore.setState((s) => ({ ...s, macros: [...s.macros, ...imported] }));
    addToast('Macros added', 'success');
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
            {isTauri() ? (
              <div>
                <button
                  className="retro-button w-100 mb-3"
                  onClick={handleTauriImport}
                >
                  SELECT FILE
                </button>
                {data && (
                  <div className="alert alert-success">
                    ✓ Loaded {data.length} macro{data.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <input
                type="file"
                accept="application/json"
                onChange={handleFile}
              />
            )}
            <p className="mt-2">
              Imported macros will be added to your current list.
            </p>
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
