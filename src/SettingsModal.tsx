import { useState } from 'react';
import { useStore } from './store';
import './SettingsModal.css';

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
    <div className="modal">
      <div className="modal-content">
        <h3>Socket Settings</h3>
        <label>
          Host:
          <input value={h} onChange={(e) => setH(e.target.value)} />
        </label>
        <label>
          Port:
          <input
            type="number"
            value={p}
            onChange={(e) => setP(Number(e.target.value))}
          />
        </label>
        <div className="actions">
          <button onClick={save}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
