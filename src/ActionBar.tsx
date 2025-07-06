import { useState } from 'react';
import { useMidi } from './useMidi';
import SettingsModal from './SettingsModal';

export default function ActionBar() {
  const { status, reconnect, launchpadDetected } = useMidi();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="status-bar d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <span className="text-warning me-3">SYSTEM STATUS:</span>
        <span className={`connection-status ${status} me-3`}>
          SOCKET: {status.toUpperCase()}
        </span>
        {launchpadDetected && (
          <span className="text-success me-3">
            ► LAUNCHPAD X DETECTED
          </span>
        )}
        {status === 'closed' && (
          <button 
            className="retro-button btn-sm me-2"
            onClick={reconnect}
          >
            RECONNECT
          </button>
        )}
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