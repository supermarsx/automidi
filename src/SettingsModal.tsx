import { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import './SettingsModal.css';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const autoReconnect = useStore((s) => s.settings.autoReconnect);
  const reconnectInterval = useStore((s) => s.settings.reconnectInterval);
  const maxReconnectAttempts = useStore((s) => s.settings.maxReconnectAttempts);
  const logLimit = useStore((s) => s.settings.logLimit);
  const pingInterval = useStore((s) => s.settings.pingInterval);
  const pingGreen = useStore((s) => s.settings.pingGreen);
  const pingYellow = useStore((s) => s.settings.pingYellow);
  const pingOrange = useStore((s) => s.settings.pingOrange);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);
  const reconnectOnLost = useStore((s) => s.settings.reconnectOnLost);
  const clearBeforeLoad = useStore((s) => s.settings.clearBeforeLoad);
  const sysexColorMode = useStore((s) => s.settings.sysexColorMode);
  const autoSleep = useStore((s) => s.settings.autoSleep);
  const autoLoadFirstConfig = useStore((s) => s.settings.autoLoadFirstConfig);
  const theme = useStore((s) => s.settings.theme);
  const clock = useStore((s) => s.settings.clock ?? [0xf8]);
  const apiKey = useStore((s) => s.settings.apiKey);
  const setHost = useStore((s) => s.setHost);
  const setPort = useStore((s) => s.setPort);
  const setAutoReconnect = useStore((s) => s.setAutoReconnect);
  const setReconnectInterval = useStore((s) => s.setReconnectInterval);
  const setMaxReconnectAttempts = useStore((s) => s.setMaxReconnectAttempts);
  const setLogLimit = useStore((s) => s.setLogLimit);
  const setPingInterval = useStore((s) => s.setPingInterval);
  const setPingGreen = useStore((s) => s.setPingGreen);
  const setPingYellow = useStore((s) => s.setPingYellow);
  const setPingOrange = useStore((s) => s.setPingOrange);
  const setPingEnabled = useStore((s) => s.setPingEnabled);
  const setReconnectOnLost = useStore((s) => s.setReconnectOnLost);
  const setClearBeforeLoad = useStore((s) => s.setClearBeforeLoad);
  const setSysexColorMode = useStore((s) => s.setSysexColorMode);
  const setAutoSleep = useStore((s) => s.setAutoSleep);
  const setAutoLoadFirstConfig = useStore((s) => s.setAutoLoadFirstConfig);
  const setTheme = useStore((s) => s.setTheme);
  const setClock = useStore((s) => s.setClock);
  const setApiKey = useStore((s) => s.setApiKey);
  const addToast = useToastStore((s) => s.addToast);

  const [h, setH] = useState(host);
  const [p, setP] = useState(port);
  const [ar, setAr] = useState(autoReconnect);
  const [ri, setRi] = useState(reconnectInterval / 1000); // Convert to seconds for UI
  const [mra, setMra] = useState(maxReconnectAttempts);
  const [ll, setLl] = useState(logLimit);
  const [pi, setPi] = useState(pingInterval);
  const [pg, setPg] = useState(pingGreen);
  const [py, setPy] = useState(pingYellow);
  const [po, setPo] = useState(pingOrange);
  const [pe, setPe] = useState(pingEnabled);
  const [rol, setRol] = useState(reconnectOnLost);
  const [cbl, setCbl] = useState(clearBeforeLoad);
  const [scm, setScm] = useState(sysexColorMode);
  const [asleep, setAsleep] = useState(autoSleep);
  const [alfc, setAlfc] = useState(autoLoadFirstConfig);
  const [thm, setThm] = useState(theme);
  const [ak, setAk] = useState(apiKey);
  const [clk, setClk] = useState(clock.join(' '));
  const fileRef = useRef<HTMLInputElement>(null);

  const save = () => {
    setHost(h);
    setPort(Number(p));
    setAutoReconnect(ar);
    setReconnectInterval(Math.max(1, ri) * 1000); // Minimum 1 second, convert back to milliseconds
    setMaxReconnectAttempts(mra);
    setLogLimit(ll);
    setPingInterval(Math.max(500, pi));
    setPingEnabled(pe);
    setReconnectOnLost(rol);
    setPingGreen(pg);
    setPingYellow(py);
    setPingOrange(po);
    setClearBeforeLoad(cbl);
    setSysexColorMode(scm);
    setAutoSleep(asleep);
    setAutoLoadFirstConfig(alfc);
    setTheme(thm);
    setApiKey(ak);
    setClock(
      clk
        .split(/\s+/)
        .map((v) => parseInt(v, 10))
        .filter((n) => !Number.isNaN(n))
        .map((n) => Math.min(255, Math.max(0, n))),
    );
    onClose();
    addToast('Settings saved', 'success');
  };

  const exportSettings = () => {
    const data = JSON.stringify(useStore.getState().settings);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-config.json';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Config exported', 'success');
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target?.result as string);
        setHost(cfg.host ?? h);
        setPort(cfg.port ?? p);
        setAutoReconnect(cfg.autoReconnect ?? ar);
        setReconnectInterval(cfg.reconnectInterval ?? reconnectInterval);
        setMaxReconnectAttempts(cfg.maxReconnectAttempts ?? mra);
        setLogLimit(cfg.logLimit ?? ll);
        setPingInterval(cfg.pingInterval ?? pi);
        setPingEnabled(cfg.pingEnabled ?? pe);
        setReconnectOnLost(cfg.reconnectOnLost ?? rol);
        setPingGreen(cfg.pingGreen ?? pg);
        setPingYellow(cfg.pingYellow ?? py);
        setPingOrange(cfg.pingOrange ?? po);
        setClearBeforeLoad(cfg.clearBeforeLoad ?? cbl);
        setSysexColorMode(cfg.sysexColorMode ?? scm);
        setAutoSleep(cfg.autoSleep ?? asleep);
        setAutoLoadFirstConfig(cfg.autoLoadFirstConfig ?? alfc);
        setTheme(cfg.theme ?? thm);
        setApiKey(cfg.apiKey ?? ak);
        setClock(Array.isArray(cfg.clock) ? cfg.clock : clock);
        setH(cfg.host ?? h);
        setP(cfg.port ?? p);
        setAr(cfg.autoReconnect ?? ar);
        setRi((cfg.reconnectInterval ?? reconnectInterval) / 1000);
        setMra(cfg.maxReconnectAttempts ?? mra);
        setLl(cfg.logLimit ?? ll);
        setPi(cfg.pingInterval ?? pi);
        setPg(cfg.pingGreen ?? pg);
        setPy(cfg.pingYellow ?? py);
        setPo(cfg.pingOrange ?? po);
        setPe(cfg.pingEnabled ?? pe);
        setRol(cfg.reconnectOnLost ?? rol);
        setCbl(cfg.clearBeforeLoad ?? cbl);
        setScm(cfg.sysexColorMode ?? scm);
        setAsleep(cfg.autoSleep ?? asleep);
        setAlfc(cfg.autoLoadFirstConfig ?? alfc);
        setThm(cfg.theme ?? thm);
        setAk(cfg.apiKey ?? ak);
        setClk(
          (Array.isArray(cfg.clock) ? cfg.clock : clock)
            .map((n: number) => n.toString())
            .join(' '),
        );
        addToast('Config imported', 'success');
      } catch {
        addToast('Failed to import config', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content modal-retro">
          <div className="modal-header">
            <h5 className="modal-title">◄ SYSTEM CONFIGURATION ►</h5>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label text-info">HOST ADDRESS:</label>
              <input
                className="form-control retro-input"
                value={h}
                onChange={(e) => setH(e.target.value)}
                placeholder="localhost"
              />
              <small className="text-warning">Default: localhost</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">PORT NUMBER:</label>
              <input
                type="number"
                className="form-control retro-input"
                value={p}
                onChange={(e) => setP(Number(e.target.value))}
                min="1"
                max="65535"
              />
              <small className="text-warning">Default: 3000</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">API KEY:</label>
              <input
                className="form-control retro-input"
                value={ak}
                onChange={(e) => setAk(e.target.value)}
              />
              <small className="text-warning">Must match server API key</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">MAX LOG ENTRIES:</label>
              <input
                type="number"
                className="form-control retro-input"
                style={{ width: '8rem' }}
                value={ll}
                onChange={(e) => setLl(Number(e.target.value))}
                min="1"
                max="9999"
              />
              <small className="text-warning">Default: 9999</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">
                PING INTERVAL (MS):
              </label>
              <input
                type="number"
                className="form-control retro-input"
                value={pi}
                onChange={(e) => setPi(Number(e.target.value))}
                min="500"
                step="500"
              />
              <small className="text-warning">Default: 15000 (Min 500)</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">
                PING THRESHOLDS (MS):
              </label>
              <div className="d-flex gap-2">
                <input
                  type="number"
                  className="form-control retro-input"
                  value={pg}
                  onChange={(e) => setPg(Number(e.target.value))}
                  min="0"
                  style={{ width: '5rem' }}
                />
                <input
                  type="number"
                  className="form-control retro-input"
                  value={py}
                  onChange={(e) => setPy(Number(e.target.value))}
                  min="0"
                  style={{ width: '5rem' }}
                />
                <input
                  type="number"
                  className="form-control retro-input"
                  value={po}
                  onChange={(e) => setPo(Number(e.target.value))}
                  min="0"
                  style={{ width: '5rem' }}
                />
              </div>
              <small className="text-warning">
                Green, Yellow, Orange defaults: 10/50/250
              </small>
            </div>
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="pingEnabled"
                checked={pe}
                onChange={(e) => setPe(e.target.checked)}
              />
              <label
                className="form-check-label text-info"
                htmlFor="pingEnabled"
              >
                ENABLE PING
              </label>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="autoReconnect"
                  checked={ar}
                  onChange={(e) => setAr(e.target.checked)}
                />
                <label
                  className="form-check-label text-info"
                  htmlFor="autoReconnect"
                >
                  AUTO-RECONNECT ON FAILURE
                </label>
              </div>
              <small className="text-warning">
                Automatically reconnect when connection is lost
              </small>
            </div>
            <div className="mb-3">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="reconnectOnLost"
                  checked={rol}
                  onChange={(e) => setRol(e.target.checked)}
                />
                <label
                  className="form-check-label text-info"
                  htmlFor="reconnectOnLost"
                >
                  AUTO-RECONNECT WHEN PING TIMES OUT
                </label>
              </div>
              <small className="text-warning">
                Close the socket after missed pings to force reconnect
              </small>
            </div>
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="clearBeforeLoad"
                checked={cbl}
                onChange={(e) => setCbl(e.target.checked)}
              />
              <label
                className="form-check-label text-info"
                htmlFor="clearBeforeLoad"
              >
                CLEAR BEFORE LOAD
              </label>
            </div>
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="sysexColorMode"
                checked={scm}
                onChange={(e) => setScm(e.target.checked)}
              />
              <label
                className="form-check-label text-info"
                htmlFor="sysexColorMode"
              >
                SYSEX COLOR MODE
              </label>
            </div>
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="autoLoadFirstConfig"
                checked={alfc}
                onChange={(e) => setAlfc(e.target.checked)}
              />
              <label
                className="form-check-label text-info"
                htmlFor="autoLoadFirstConfig"
              >
                AUTO-LOAD FIRST CONFIG
              </label>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">AUTO SLEEP (SEC):</label>
              <input
                type="number"
                className="form-control retro-input"
                value={asleep}
                onChange={(e) => setAsleep(Number(e.target.value))}
                min="0"
              />
              <small className="text-warning">0 disables auto sleep</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">THEME:</label>
              <select
                className="form-select retro-select"
                value={thm}
                onChange={(e) =>
                  setThm(e.target.value as 'default' | 'dark' | 'light')
                }
              >
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">CLOCK MESSAGE:</label>
              <input
                className="form-control retro-input"
                value={clk}
                onChange={(e) => setClk(e.target.value)}
                placeholder="248"
              />
              <small className="text-warning">
                Space-separated decimal bytes
              </small>
            </div>
            {ar && (
              <>
                <div className="mb-3">
                  <label className="form-label text-info">
                    RECONNECT INTERVAL (SECONDS):
                  </label>
                  <input
                    type="number"
                    className="form-control retro-input"
                    value={ri}
                    onChange={(e) => setRi(Number(e.target.value))}
                    min="1"
                    max="60"
                    step="0.5"
                  />
                  <small className="text-warning">
                    Minimum: 1 second, Maximum: 60 seconds
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label text-info">
                    MAX RECONNECT ATTEMPTS:
                  </label>
                  <input
                    type="number"
                    className="form-control retro-input"
                    value={mra}
                    onChange={(e) => setMra(Number(e.target.value))}
                    min="1"
                    max="99"
                  />
                  <small className="text-warning">Default: 10</small>
                </div>
              </>
            )}
          </div>
          <div className="modal-footer">
            <input
              type="file"
              accept="application/json"
              ref={fileRef}
              onChange={importSettings}
              style={{ display: 'none' }}
            />
            <button className="retro-button me-2" onClick={exportSettings}>
              EXPORT
            </button>
            <button
              className="retro-button me-2"
              onClick={() => fileRef.current?.click()}
            >
              IMPORT
            </button>
            <button className="retro-button me-2" onClick={save}>
              SAVE CONFIG
            </button>
            <button className="retro-button" onClick={onClose}>
              ABORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
