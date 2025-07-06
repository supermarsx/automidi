import { useState, useEffect } from 'react';
import { useStore } from './store';
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

  const save = () => {
    setHost(h);
    setPort(Number(p));
    setAutoReconnect(ar);
    setReconnectInterval(Math.max(1, ri) * 1000); // Minimum 1 second, convert back to milliseconds
    setMaxReconnectAttempts(mra);
    setLogLimit(ll);
    setPingInterval(Math.max(500, pi));
    setPingEnabled(pe);
    setPingGreen(pg);
    setPingYellow(py);
    setPingOrange(po);
    onClose();
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
              <label className="form-label text-info">MAX LOG ENTRIES:</label>
              <input
                type="number"
                className="form-control retro-input"
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
