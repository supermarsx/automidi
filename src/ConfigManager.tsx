import { useState } from 'react';
import { useStore, type PadConfig } from './store';

export default function ConfigManager() {
  const configs = useStore((s) => s.configs);
  const addConfig = useStore((s) => s.addConfig);
  const removeConfig = useStore((s) => s.removeConfig);
  const setPadColours = useStore((s) => s.setPadColours);
  const padColours = useStore((s) => s.padColours);
  const updateConfig = useStore((s) => s.updateConfig);
  const [editing, setEditing] = useState<PadConfig | null>(null);
  const [editName, setEditName] = useState('');
  const [name, setName] = useState('');

  const saveCurrent = () => {
    if (!name.trim()) return;
    const cfg: PadConfig = {
      id: Date.now().toString(),
      name: name.trim(),
      padColours,
    };
    addConfig(cfg);
    setName('');
  };

  const loadConfig = (cfg: PadConfig) => {
    setPadColours(cfg.padColours);
  };

  const startEdit = (cfg: PadConfig) => {
    setEditing(cfg);
    setEditName(cfg.name);
  };

  const saveEdit = () => {
    if (!editing) return;
    updateConfig({ ...editing, name: editName.trim() || editing.name });
    setEditing(null);
  };

  const exportConfig = (cfg: PadConfig) => {
    const data = JSON.stringify(cfg);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cfg.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target?.result as string) as PadConfig;
        addConfig({ ...cfg, id: Date.now().toString() });
      } catch {
        /* ignore */
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="retro-panel">
      <h3>◄ Custom Configs ►</h3>
      <div className="mb-3 d-flex">
        <input
          className="form-control retro-input me-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Config name"
        />
        <button className="retro-button btn-sm" onClick={saveCurrent}>
          SAVE
        </button>
      </div>
      <div className="mb-3">
        <input type="file" accept="application/json" onChange={importConfig} />
      </div>
      {configs.map((cfg) => (
        <div key={cfg.id} className="macro-list-item">
          <span className="macro-name">{cfg.name}</span>
          <div>
            <button
              className="retro-button btn-sm me-1"
              onClick={() => loadConfig(cfg)}
            >
              LOAD
            </button>
            <button
              className="retro-button btn-sm me-1"
              onClick={() => exportConfig(cfg)}
            >
              EXPORT
            </button>
            <button
              className="retro-button btn-sm me-1"
              onClick={() => startEdit(cfg)}
            >
              EDIT
            </button>
            <button
              className="retro-button btn-sm"
              onClick={() => removeConfig(cfg.id)}
            >
              DEL
            </button>
          </div>
        </div>
      ))}
      {editing && (
        <div className="retro-panel mt-3">
          <h4 className="text-warning">EDIT CONFIG</h4>
          <div className="mb-3">
            <input
              className="form-control retro-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <button className="retro-button me-2" onClick={saveEdit}>
            SAVE
          </button>
          <button className="retro-button" onClick={() => setEditing(null)}>
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}
