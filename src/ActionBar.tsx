import { useState } from 'react';
import { useMidi } from './useMidi';
import SettingsModal from './SettingsModal';

export default function ActionBar() {
  const { status } = useMidi();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="status-bar d-flex justify-content-between align-items-center">
      <div>
        <span className="text-warning">SYSTEM STATUS:</span>
        <span className={`connection-status ${status} ms-2`}>
          SOCKET: {status.toUpperCase()}
        </span>
      </div>
      <button 
        className="retro-button"
        onClick={() => setShowSettings(true)}
      >
        ◄ CONFIG ►
      </button>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}