import { useState } from 'react';
import { useStore } from './store';

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const host = useStore((s) => s.settings.host);
  const port = useStore((s) => s.settings.port);
  const setHost = useStore((s) => s.setHost);
  const setPort = useStore((s) => s.setPort);

  const [h, setH] = useState(host);
  const [p, setP] = useState(port);

  const save = () => {
    setHost(h);
    setPort(Number(p));
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
              />
            </div>
            <div className="mb-3">
              <label className="form-label text-info">PORT NUMBER:</label>
              <input
                type="number"
                className="form-control retro-input"
                value={p}
                onChange={(e) => setP(Number(e.target.value))}
              />
            </div>
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