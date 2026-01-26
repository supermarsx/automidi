import { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import { isTauri, saveFile, writeTextFile, openFile, readTextFile } from './tauriApi';
import './SettingsModal.css';

interface Props {
  onClose?: () => void;
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
  const macroConfirmTimeout = useStore((s) => s.settings.macroConfirmTimeout);
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
  const setMacroConfirmTimeout = useStore((s) => s.setMacroConfirmTimeout);
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
  const [mct, setMct] = useState(macroConfirmTimeout);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-save settings when they change
  useEffect(() => {
    if (h !== host) {
      setHost(h);
      addToast('Host updated', 'success');
    }
  }, [h, setHost, host, addToast]);

  useEffect(() => {
    setPort(Number(p));
  }, [p, setPort]);

  useEffect(() => {
    setAutoReconnect(ar);
  }, [ar, setAutoReconnect]);

  useEffect(() => {
    setReconnectInterval(Math.max(1, ri) * 1000);
  }, [ri, setReconnectInterval]);

  useEffect(() => {
    setMaxReconnectAttempts(mra);
  }, [mra, setMaxReconnectAttempts]);

  useEffect(() => {
    setLogLimit(ll);
  }, [ll, setLogLimit]);

  useEffect(() => {
    setPingInterval(Math.max(500, pi));
  }, [pi, setPingInterval]);

  useEffect(() => {
    setPingEnabled(pe);
  }, [pe, setPingEnabled]);

  useEffect(() => {
    setReconnectOnLost(rol);
  }, [rol, setReconnectOnLost]);

  useEffect(() => {
    setPingGreen(pg);
  }, [pg, setPingGreen]);

  useEffect(() => {
    setPingYellow(py);
  }, [py, setPingYellow]);

  useEffect(() => {
    setPingOrange(po);
  }, [po, setPingOrange]);

  useEffect(() => {
    setClearBeforeLoad(cbl);
  }, [cbl, setClearBeforeLoad]);

  useEffect(() => {
    setSysexColorMode(scm);
  }, [scm, setSysexColorMode]);

  useEffect(() => {
    setAutoSleep(asleep);
  }, [asleep, setAutoSleep]);

  useEffect(() => {
    setAutoLoadFirstConfig(alfc);
  }, [alfc, setAutoLoadFirstConfig]);

  useEffect(() => {
    if (thm !== theme) {
      setTheme(thm);
      addToast('Theme changed', 'success');
    }
  }, [thm, setTheme, theme, addToast]);

  useEffect(() => {
    setApiKey(ak);
  }, [ak, setApiKey]);

  useEffect(() => {
    setClock(
      clk
        .split(/\s+/)
        .map((v) => parseInt(v, 10))
        .filter((n) => !Number.isNaN(n))
        .map((n) => Math.min(255, Math.max(0, n))),
    );
  }, [clk, setClock]);

  useEffect(() => {
    setMacroConfirmTimeout(Math.max(0, mct));
  }, [mct, setMacroConfirmTimeout]);

  const save = () => {
    if (onClose) onClose();
    addToast('Settings saved', 'success');
  };

  const exportSettings = async () => {
    const data = JSON.stringify(useStore.getState().settings, null, 2);

    if (isTauri()) {
      try {
        const filePath = await saveFile({
          title: 'Export Settings',
          filters: [{ name: 'JSON', extensions: ['json'] }],
          defaultPath: 'system-config.json',
        });

        if (filePath) {
          const success = await writeTextFile(filePath, data);
          if (success) {
            addToast('Settings exported', 'success');
          } else {
            addToast('Failed to write file', 'error');
          }
        }
      } catch (error) {
        addToast(`Export failed: ${error}`, 'error');
      }
    } else {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'system-config.json';
      a.click();
      URL.revokeObjectURL(url);
      addToast('Settings exported', 'success');
    }
  };

  const importSettingsTauri = async () => {
    try {
      const filePath = await openFile({
        title: 'Import Settings',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      });

      if (filePath) {
        const content = await readTextFile(filePath);
        if (content) {
          const cfg = JSON.parse(content);
          applyImportedSettings(cfg);
          addToast('Settings imported', 'success');
        }
      }
    } catch (error) {
      addToast(`Import failed: ${error}`, 'error');
    }
  };

  const applyImportedSettings = (cfg: unknown) => {
    const settings = cfg as Record<string, unknown>;
    setHost(settings.host as string ?? h);
    setPort(settings.port as number ?? p);
    setAutoReconnect(settings.autoReconnect as boolean ?? ar);
    setReconnectInterval(settings.reconnectInterval as number ?? reconnectInterval);
    setMaxReconnectAttempts(settings.maxReconnectAttempts as number ?? mra);
    setLogLimit(settings.logLimit as number ?? ll);
    setPingInterval(settings.pingInterval as number ?? pi);
    setPingEnabled(settings.pingEnabled as boolean ?? pe);
    setReconnectOnLost(settings.reconnectOnLost as boolean ?? rol);
    setPingGreen(settings.pingGreen as number ?? pg);
    setPingYellow(settings.pingYellow as number ?? py);
    setPingOrange(settings.pingOrange as number ?? po);
    setClearBeforeLoad(settings.clearBeforeLoad as boolean ?? cbl);
    setSysexColorMode((settings.sysexColorMode as boolean) ?? scm);
    setAutoSleep((settings.autoSleep as number) ?? asleep);
    setAutoLoadFirstConfig(settings.autoLoadFirstConfig as boolean ?? alfc);
    setTheme((settings.theme as 'original' | 'oled-dark' | 'outrun' | 'matrix' | 'lightsaber') ?? thm);
    setApiKey(settings.apiKey as string ?? ak);
    setClock(Array.isArray(settings.clock) ? settings.clock as number[] : clock);
    setMacroConfirmTimeout(settings.macroConfirmTimeout as number ?? macroConfirmTimeout);
    setH(settings.host as string ?? h);
    setP(settings.port as number ?? p);
    setAr(settings.autoReconnect as boolean ?? ar);
    setRi((settings.reconnectInterval as number ?? reconnectInterval) / 1000);
    setMra(settings.maxReconnectAttempts as number ?? mra);
    setLl(settings.logLimit as number ?? ll);
    setPi(settings.pingInterval as number ?? pi);
    setPg(settings.pingGreen as number ?? pg);
    setPy(settings.pingYellow as number ?? py);
    setPo(settings.pingOrange as number ?? po);
    setPe(settings.pingEnabled as boolean ?? pe);
    setRol(settings.reconnectOnLost as boolean ?? rol);
    setCbl(settings.clearBeforeLoad as boolean ?? cbl);
    setScm((settings.sysexColorMode as boolean) ?? scm);
    setAsleep((settings.autoSleep as number) ?? asleep);
    setAlfc(settings.autoLoadFirstConfig as boolean ?? alfc);
    setThm((settings.theme as 'original' | 'oled-dark' | 'outrun' | 'matrix' | 'lightsaber') ?? thm);
    setAk(settings.apiKey as string ?? ak);
    setClk(
      (Array.isArray(settings.clock) ? settings.clock as number[] : clock)
        .map((n: number) => n.toString())
        .join(' '),
    );
    setMct(settings.macroConfirmTimeout as number ?? macroConfirmTimeout);
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const cfg = JSON.parse(ev.target?.result as string);
        applyImportedSettings(cfg);
        addToast('Settings imported', 'success');
      } catch {
        addToast('Failed to import config', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const renderSettingsContent = () => {
    return (
      <>
        <table className="retro-table w-100">
          <tbody>
            <tr>
              <td style={{ width: '30%' }}><strong>HOST ADDRESS</strong></td>
              <td>
                <input
                  className="form-control retro-input"
                  value={h}
                  onChange={(e) => setH(e.target.value)}
                  placeholder="localhost"
                  style={{ width: '100%' }}
                />
              </td>
              <td style={{ width: '25%' }}><small className="text-warning">Default: localhost</small></td>
            </tr>
            <tr>
              <td><strong>PORT NUMBER</strong></td>
              <td>
                <input
                  type="number"
                  className="form-control retro-input"
                  value={p}
                  onChange={(e) => setP(Number(e.target.value))}
                  min="1"
                  max="65535"
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">Default: 3000</small></td>
            </tr>
            <tr>
              <td><strong>API KEY</strong></td>
              <td>
                <input
                  className="form-control retro-input"
                  value={ak}
                  onChange={(e) => setAk(e.target.value)}
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">Must match server</small></td>
            </tr>
            <tr>
              <td><strong>MAX LOG ENTRIES</strong></td>
              <td>
                <input
                  type="number"
                  className="form-control retro-input"
                  value={ll}
                  onChange={(e) => setLl(Number(e.target.value))}
                  min="1"
                  max="9999"
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">Default: 9999</small></td>
            </tr>
            <tr>
              <td><strong>PING INTERVAL (MS)</strong></td>
              <td>
                <input
                  type="number"
                  className="form-control retro-input"
                  value={pi}
                  onChange={(e) => setPi(Number(e.target.value))}
                  min="500"
                  step="500"
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">Default: 15000</small></td>
            </tr>
            <tr>
              <td><strong>PING THRESHOLDS (MS)</strong></td>
              <td>
                <div className="d-flex gap-1">
                  <input
                    type="number"
                    className="form-control retro-input"
                    value={pg}
                    onChange={(e) => setPg(Number(e.target.value))}
                    min="0"
                    style={{ width: '33%' }}
                    placeholder="Green"
                  />
                  <input
                    type="number"
                    className="form-control retro-input"
                    value={py}
                    onChange={(e) => setPy(Number(e.target.value))}
                    min="0"
                    style={{ width: '33%' }}
                    placeholder="Yellow"
                  />
                  <input
                    type="number"
                    className="form-control retro-input"
                    value={po}
                    onChange={(e) => setPo(Number(e.target.value))}
                    min="0"
                    style={{ width: '33%' }}
                    placeholder="Orange"
                  />
                </div>
              </td>
              <td><small className="text-warning">10/50/250</small></td>
            </tr>
            <tr>
              <td><strong>ENABLE PING</strong></td>
              <td colSpan={2}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="pingEnabled"
                  checked={pe}
                  onChange={(e) => setPe(e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td><strong>AUTO-RECONNECT</strong></td>
              <td colSpan={2}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="autoReconnect"
                  checked={ar}
                  onChange={(e) => setAr(e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td><strong>RECONNECT ON TIMEOUT</strong></td>
              <td colSpan={2}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="reconnectOnLost"
                  checked={rol}
                  onChange={(e) => setRol(e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td><strong>CLEAR BEFORE LOAD</strong></td>
              <td colSpan={2}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="clearBeforeLoad"
                  checked={cbl}
                  onChange={(e) => setCbl(e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td><strong>SYSEX COLOR MODE</strong></td>
              <td colSpan={2}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="sysexColorMode"
                  checked={scm}
                  onChange={(e) => setScm(e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td><strong>AUTO-LOAD FIRST CONFIG</strong></td>
              <td colSpan={2}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="autoLoadFirstConfig"
                  checked={alfc}
                  onChange={(e) => setAlfc(e.target.checked)}
                />
              </td>
            </tr>
            <tr>
              <td><strong>AUTO SLEEP (SEC)</strong></td>
              <td>
                <input
                  type="number"
                  className="form-control retro-input"
                  value={asleep}
                  onChange={(e) => setAsleep(Number(e.target.value))}
                  min="0"
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">0 = disabled</small></td>
            </tr>
            <tr>
              <td><strong>THEME</strong></td>
              <td colSpan={2}>
                <select
                  className="form-select retro-select"
                  value={thm}
                  onChange={(e) =>
                    setThm(e.target.value as 'original' | 'oled-dark' | 'outrun' | 'matrix' | 'lightsaber')
                  }
                  style={{ width: '100%' }}
                >
                  <option value="original">Original (Retro)</option>
                <option value="oled-dark">OLED Dark</option>
                <option value="outrun">Outrun</option>
                <option value="matrix">Matrix</option>
                <option value="lightsaber">Lightsaber</option>
              </select>
            </td>
            </tr>
            <tr>
              <td><strong>CLOCK MESSAGE</strong></td>
              <td>
                <input
                  className="form-control retro-input"
                  value={clk}
                  onChange={(e) => setClk(e.target.value)}
                  placeholder="248"
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">Decimal bytes</small></td>
            </tr>
            <tr>
              <td><strong>MACRO CONFIRM (MS)</strong></td>
              <td>
                <input
                  type="number"
                  className="form-control retro-input"
                  value={mct}
                  onChange={(e) => setMct(Number(e.target.value))}
                  min="0"
                  style={{ width: '100%' }}
                />
              </td>
              <td><small className="text-warning">Timeout</small></td>
            </tr>
            {ar && (
              <>
                <tr>
                  <td><strong>RECONNECT INTERVAL (S)</strong></td>
                  <td>
                    <input
                      type="number"
                      className="form-control retro-input"
                      value={ri}
                      onChange={(e) => setRi(Number(e.target.value))}
                      min="1"
                      max="60"
                      step="0.5"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td><small className="text-warning">1-60 sec</small></td>
                </tr>
                <tr>
                  <td><strong>MAX RECONNECT ATTEMPTS</strong></td>
                  <td>
                    <input
                      type="number"
                      className="form-control retro-input"
                      value={mra}
                      onChange={(e) => setMra(Number(e.target.value))}
                      min="0"
                      max="99"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td><small className="text-warning">0 = unlimited</small></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </>
    );
  };

  // If onClose is not provided, render without modal wrapper (embedded mode)
  if (!onClose) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2" style={{ borderBottom: '2px solid var(--panel-border)' }}>
          <h5 style={{ margin: 0, color: 'var(--highlight)' }}>◄ CONFIGURATION ►</h5>
          <div>
            <input
              type="file"
              accept="application/json"
              ref={fileRef}
              onChange={importSettings}
              style={{ display: 'none' }}
            />
            <button className="retro-button me-2" onClick={exportSettings} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
              EXPORT
            </button>
            <button
              className="retro-button me-2"
              onClick={() => (isTauri() ? importSettingsTauri() : fileRef.current?.click())}
              style={{ padding: '6px 12px', fontSize: '0.9rem' }}
            >
              IMPORT
            </button>
            <button className="retro-button" onClick={save} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
              SAVE
            </button>
          </div>
        </div>
        {renderSettingsContent()}
      </div>
    );
  }

  return (
    <div
      className="modal d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content modal-retro">
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h5 className="modal-title" style={{ margin: 0 }}>◄ CONFIGURATION ►</h5>
            <div>
              <input
                type="file"
                accept="application/json"
                ref={fileRef}
                onChange={importSettings}
                style={{ display: 'none' }}
              />
              <button className="retro-button me-2" onClick={exportSettings} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                EXPORT
              </button>
              <button
                className="retro-button me-2"
                onClick={() => (isTauri() ? importSettingsTauri() : fileRef.current?.click())}
                style={{ padding: '6px 12px', fontSize: '0.9rem' }}
              >
                IMPORT
              </button>
              <button className="retro-button me-2" onClick={save} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                SAVE
              </button>
              <button className="retro-button" onClick={onClose} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                CLOSE
              </button>
            </div>
          </div>
          <div className="modal-body">{renderSettingsContent()}</div>
        </div>
      </div>
    </div>
  );
}
