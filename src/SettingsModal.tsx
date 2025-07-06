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
  const pingThresholds = useStore((s) => s.settings.pingThresholds);
  const setHost = useStore((s) => s.setHost);
  const setPort = useStore((s) => s.setPort);
  const setAutoReconnect = useStore((s) => s.setAutoReconnect);
  const setReconnectInterval = useStore((s) => s.setReconnectInterval);
  const setMaxReconnectAttempts = useStore((s) => s.setMaxReconnectAttempts);
  const setLogLimit = useStore((s) => s.setLogLimit);
  const setPingInterval = useStore((s) => s.setPingInterval);
  const setPingThresholds = useStore((s) => s.setPingThresholds);

  const [h, setH] = useState(host);
  const [p, setP] = useState(port);
  const [ar, setAr] = useState(autoReconnect);
  const [ri, setRi] = useState(reconnectInterval / 1000); // Convert to seconds for UI
  const [mra, setMra] = useState(maxReconnectAttempts);
  const [ll, setLl] = useState(logLimit);
  const [pi, setPi] = useState(pingInterval / 1000);
  const [green, setGreen] = useState(pingThresholds.green);
  const [yellow, setYellow] = useState(pingThresholds.yellow);
  const [orange, setOrange] = useState(pingThresholds.orange);

  const save = () => {
    setHost(h);
    setPort(Number(p));
    setAutoReconnect(ar);
    setReconnectInterval(Math.max(1, ri) * 1000); // Minimum 1 second, convert back to milliseconds
    setMaxReconnectAttempts(mra);
    setLogLimit(ll);
    setPingInterval(Math.max(1, pi) * 1000);
    setPingThresholds({ green, yellow, orange });
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
                max="999"
              />
              <small className="text-warning">Default: 999</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">
                PING INTERVAL (SECONDS):
              </label>
              <input
                type="number"
                className="form-control retro-input"
                value={pi}
                onChange={(e) => setPi(Number(e.target.value))}
                min="1"
                max="60"
                step="0.5"
              />
              <small className="text-warning">Default: 15 seconds</small>
            </div>
            <div className="mb-3">
              <label className="form-label text-info">
                PING THRESHOLDS (MS):
              </label>
              <div className="d-flex gap-2">
                <input
                  type="number"
                  className="form-control retro-input"
                  value={green}
                  onChange={(e) => setGreen(Number(e.target.value))}
                  min="1"
                />
                <input
                  type="number"
                  className="form-control retro-input"
                  value={yellow}
                  onChange={(e) => setYellow(Number(e.target.value))}
                  min="1"
                />
                <input
                  type="number"
                  className="form-control retro-input"
                  value={orange}
                  onChange={(e) => setOrange(Number(e.target.value))}
                  min="1"
                />
              </div>
              <small className="text-warning">
                Green, Yellow, Orange defaults: 10/50/250
              </small>
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
