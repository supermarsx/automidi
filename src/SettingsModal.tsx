import { useState } from 'react';
import { useStore } from './store';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const autoReconnect = useStore((s) => s.settings.autoReconnect);
  const reconnectInterval = useStore((s) => s.settings.reconnectInterval);
  const setHost = useStore((s) => s.setHost);
  const setPort = useStore((s) => s.setPort);
  const setAutoReconnect = useStore((s) => s.setAutoReconnect);
  const setReconnectInterval = useStore((s) => s.setReconnectInterval);

  const [h, setH] = useState(host);
  const [p, setP] = useState(port);
  const [ar, setAr] = useState(autoReconnect);
  const [ri, setRi] = useState(reconnectInterval / 1000); // Convert to seconds for UI

  const save = () => {
    setHost(h);
    setPort(Number(p));
    setAutoReconnect(ar);
    setReconnectInterval(ri * 1000); // Convert back to milliseconds
    onClose();
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog">
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
                <label className="form-check-label text-info" htmlFor="autoReconnect">
                  AUTO-RECONNECT ON FAILURE
                </label>
              </div>
            </div>
            {ar && (
              <div className="mb-3">
                <label className="form-label text-info">RECONNECT INTERVAL (SECONDS):</label>
                <input
                  type="number"
                  className="form-control retro-input"
                  value={ri}
                  onChange={(e) => setRi(Number(e.target.value))}
                  min="1"
                  max="60"
                  step="0.5"
                />
              </div>
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