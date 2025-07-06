import { useState } from 'react';
import { useStore, type PadConfig } from './store';
import { useToastStore } from './toastStore';
import { useMidi } from './useMidi';
import LAUNCHPAD_COLORS from './launchpadColors';
import { enterProgrammerMode, clearAllLeds, noteOn, cc } from './midiMessages';

export default function ConfigManager() {
  const configs = useStore((s) => s.configs);
  const addConfig = useStore((s) => s.addConfig);
  const removeConfig = useStore((s) => s.removeConfig);
  const setPadColours = useStore((s) => s.setPadColours);
  const setPadLabels = useStore((s) => s.setPadLabels);
  const padColours = useStore((s) => s.padColours);
  const padLabels = useStore((s) => s.padLabels);
  const clearBeforeLoad = useStore((s) => s.settings.clearBeforeLoad);
  const updateConfig = useStore((s) => s.updateConfig);
  const addToast = useToastStore((s) => s.addToast);
  const { send } = useMidi();
  const [editing, setEditing] = useState<PadConfig | null>(null);
  const [editName, setEditName] = useState('');
  const [name, setName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<PadConfig | null>(null);

  const saveCurrent = () => {
    if (!name.trim()) return;
    const cfg: PadConfig = {
      id: Date.now().toString(),
      name: name.trim(),
      padColours,
      padLabels,
    };
    addConfig(cfg);
    setName('');
    addToast('Config saved', 'success');
  };

  const loadConfig = (cfg: PadConfig) => {
    setPadColours(cfg.padColours);
    if (cfg.padLabels) setPadLabels(cfg.padLabels);
    addToast('Config loaded', 'success');
  };

  const startEdit = (cfg: PadConfig) => {
    setEditing(cfg);
    setEditName(cfg.name);
  };

  const saveEdit = () => {
    if (!editing) return;
    updateConfig({ ...editing, name: editName.trim() || editing.name });
    setEditing(null);
    addToast('Config renamed', 'success');
  };

  const saveToConfig = (cfg: PadConfig) => {
    updateConfig({ ...cfg, padColours, padLabels });
    addToast('Config updated', 'success');
  };

  const loadToLaunchpad = (cfg: PadConfig) => {
    let ok = true;
    if (clearBeforeLoad) {
      ok = send(clearAllLeds());
    }
    ok = send(enterProgrammerMode()) && ok;
    for (const [id, hex] of Object.entries(cfg.padColours)) {
      const color = LAUNCHPAD_COLORS.find((c) => c.color === hex)?.value;
      if (color === undefined) continue;
      if (id.startsWith('n-')) {
        const note = Number(id.slice(2));
        if (!Number.isNaN(note)) ok = send(noteOn(note, color)) && ok;
      } else if (id.startsWith('cc-')) {
        const num = Number(id.slice(3));
        if (!Number.isNaN(num)) ok = send(cc(num, color)) && ok;
      }
    }
    addToast(
      ok ? 'Loaded to Launchpad' : 'Load failed',
      ok ? 'success' : 'error',
    );
  };

  const confirmDeleteConfig = () => {
    if (!confirmDelete) return;
    removeConfig(confirmDelete.id);
    setConfirmDelete(null);
    addToast('Config deleted', 'success');
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
    addToast('Config exported', 'success');
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target?.result as string) as PadConfig;
        addConfig({
          ...cfg,
          id: Date.now().toString(),
          padLabels: cfg.padLabels || {},
        });
        addToast('Config imported', 'success');
      } catch {
        addToast('Failed to import config', 'error');
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
              onClick={() => saveToConfig(cfg)}
            >
              SAVE
            </button>
            <button
              className="retro-button btn-sm me-1"
              onClick={() => exportConfig(cfg)}
            >
              EXPORT
            </button>
            <button
              className="retro-button btn-sm me-1"
              onClick={() => loadToLaunchpad(cfg)}
            >
              LOAD LP
            </button>
            <button
              className="retro-button btn-sm me-1"
              onClick={() => startEdit(cfg)}
            >
              EDIT
            </button>
            <button
              className="retro-button btn-sm"
              onClick={() => setConfirmDelete(cfg)}
            >
              DEL
            </button>
          </div>
        </div>
      ))}
      {editing && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setEditing(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content modal-retro">
              <div className="modal-header">
                <h5 className="modal-title">RENAME CONFIG</h5>
              </div>
              <div className="modal-body">
                <input
                  className="form-control retro-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="retro-button me-2" onClick={saveEdit}>
                  SAVE
                </button>
                <button
                  className="retro-button"
                  onClick={() => setEditing(null)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setConfirmDelete(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content modal-retro">
              <div className="modal-header">
                <h5 className="modal-title">DELETE CONFIG</h5>
              </div>
              <div className="modal-body">
                Are you sure you want to delete "{confirmDelete.name}"?
              </div>
              <div className="modal-footer">
                <button
                  className="retro-button me-2"
                  onClick={confirmDeleteConfig}
                >
                  DELETE
                </button>
                <button
                  className="retro-button"
                  onClick={() => setConfirmDelete(null)}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
