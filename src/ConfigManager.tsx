import { useState, useEffect } from 'react';
import { useStore, type PadConfig } from './store';
import { useToastStore } from './toastStore';
import { useMidi } from './useMidi';
import LAUNCHPAD_COLORS from './launchpadColors';
import {
  enterProgrammerMode,
  clearAllLeds,
  noteOn,
  cc,
  lightingSysEx,
} from './midiMessages';

export default function ConfigManager() {
  const configs = useStore((s) => s.configs);
  const addConfig = useStore((s) => s.addConfig);
  const removeConfig = useStore((s) => s.removeConfig);
  const reorderConfig = useStore((s) => s.reorderConfig);
  const setPadColours = useStore((s) => s.setPadColours);
  const setPadLabels = useStore((s) => s.setPadLabels);
  const padColours = useStore((s) => s.padColours);
  const padLabels = useStore((s) => s.padLabels);
  const padChannels = useStore((s) => s.padChannels);
  const padActions = useStore((s) => s.padActions);
  const setPadChannels = useStore((s) => s.setPadChannels);
  const setPadActions = useStore((s) => s.setPadActions);
  const clearBeforeLoad = useStore((s) => s.settings.clearBeforeLoad);
  const sysexColorMode = useStore((s) => s.settings.sysexColorMode);
  const autoLoadFirstConfig = useStore((s) => s.settings.autoLoadFirstConfig);
  const updateConfig = useStore((s) => s.updateConfig);
  const addToast = useToastStore((s) => s.addToast);
  const { send } = useMidi();
  const [editing, setEditing] = useState<PadConfig | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<PadConfig | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState<PadConfig | null>(
    null,
  );

  useEffect(() => {
    if (autoLoadFirstConfig && configs.length > 0) {
      loadConfig(configs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveCurrent = () => {
    if (!name.trim()) return;
    const cfg: PadConfig = {
      id: Date.now().toString(),
      name: name.trim(),
      padColours,
      padLabels,
      padChannels,
      padActions,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const existing = configs.find((c) => c.name === cfg.name);
    if (existing) {
      setConfirmOverwrite({ ...cfg, id: existing.id });
      return;
    }
    addConfig(cfg);
    setName('');
    setTags('');
    addToast('Config saved', 'success');
  };

  const loadConfig = (cfg: PadConfig) => {
    setPadColours(cfg.padColours);
    if (cfg.padLabels) setPadLabels(cfg.padLabels);
    if (cfg.padChannels) setPadChannels(cfg.padChannels);
    if (cfg.padActions) setPadActions(cfg.padActions);
    addToast('Config loaded', 'success');
  };

  const startEdit = (cfg: PadConfig) => {
    setEditing(cfg);
    setEditName(cfg.name);
    setEditTags((cfg.tags || []).join(', '));
  };

  const saveEdit = () => {
    if (!editing) return;
    updateConfig({
      ...editing,
      name: editName.trim() || editing.name,
      tags: editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setEditing(null);
    setEditTags('');
    addToast('Config renamed', 'success');
  };

  const saveToConfig = (cfg: PadConfig) => {
    const updated = { ...cfg, padColours, padLabels, padChannels, padActions };
    const dup = configs.find((c) => c.name === cfg.name && c.id !== cfg.id);
    if (dup) {
      setConfirmOverwrite(updated);
      return;
    }
    updateConfig(updated);
    addToast('Config updated', 'success');
  };

  const loadToLaunchpad = (cfg: PadConfig) => {
    let ok = true;
    if (clearBeforeLoad) {
      ok = send(clearAllLeds());
    }
    ok = send(enterProgrammerMode()) && ok;
    for (const [id, chMap] of Object.entries(cfg.padColours)) {
      for (const [chStr, hex] of Object.entries(chMap)) {
        const channel = Number(chStr);
        const color = LAUNCHPAD_COLORS.find((c) => c.color === hex)?.value;
        if (color === undefined) continue;
        const padId = id.startsWith('n-')
          ? Number(id.slice(2))
          : id.startsWith('cc-')
            ? Number(id.slice(3))
            : NaN;
        if (Number.isNaN(padId)) continue;
        if (sysexColorMode) {
          const type = channel === 1 ? 0 : channel === 2 ? 1 : 2;
          const data = channel === 2 ? [0, color] : [color];
          ok = send(lightingSysEx([{ type, index: padId, data }])) && ok;
        } else if (id.startsWith('n-')) {
          ok = send(noteOn(padId, color, channel)) && ok;
        } else if (id.startsWith('cc-')) {
          ok = send(cc(padId, color, channel)) && ok;
        }
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

  const confirmOverwriteConfig = () => {
    if (!confirmOverwrite) return;
    updateConfig(confirmOverwrite);
    setConfirmOverwrite(null);
    setName('');
    addToast('Config updated', 'success');
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
          padChannels: cfg.padChannels || {},
          padActions: cfg.padActions || {},
          tags: cfg.tags || [],
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
        <input
          className="form-control retro-input me-2"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags"
        />
        <button className="retro-button btn-sm" onClick={saveCurrent}>
          SAVE
        </button>
      </div>
      <div className="mb-3">
        <input type="file" accept="application/json" onChange={importConfig} />
      </div>
      <div className="mb-3">
        <input
          className="form-control retro-input"
          placeholder="filter tag"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        />
      </div>
      {configs
        .filter((c) => !filterTag.trim() || c.tags?.includes(filterTag.trim()))
        .map((cfg, idx) => (
          <div key={cfg.id} className="macro-list-item">
            <span className="macro-name">
              {cfg.name}
              {cfg.tags && cfg.tags.length > 0 && (
                <small className="ms-1 text-warning">
                  [{cfg.tags.join(', ')}]
                </small>
              )}
            </span>
            <div>
              <button
                className="retro-button btn-sm me-1"
                disabled={idx === 0}
                onClick={() => reorderConfig(idx, idx - 1)}
              >
                ↑
              </button>
              <button
                className="retro-button btn-sm me-1"
                disabled={idx === configs.length - 1}
                onClick={() => reorderConfig(idx, idx + 1)}
              >
                ↓
              </button>
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
          onClick={() => {
            setEditing(null);
            setEditTags('');
          }}
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
                <input
                  className="form-control retro-input mt-2"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="tags"
                />
              </div>
              <div className="modal-footer">
                <button className="retro-button me-2" onClick={saveEdit}>
                  SAVE
                </button>
                <button
                  className="retro-button"
                  onClick={() => {
                    setEditing(null);
                    setEditTags('');
                  }}
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
      {confirmOverwrite && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setConfirmOverwrite(null)}
        >
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content modal-retro">
              <div className="modal-header">
                <h5 className="modal-title">OVERWRITE CONFIG</h5>
              </div>
              <div className="modal-body">
                Overwrite existing config "{confirmOverwrite.name}"?
              </div>
              <div className="modal-footer">
                <button
                  className="retro-button me-2"
                  onClick={confirmOverwriteConfig}
                >
                  YES
                </button>
                <button
                  className="retro-button"
                  onClick={() => setConfirmOverwrite(null)}
                >
                  NO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
