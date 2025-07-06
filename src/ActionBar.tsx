import { useState } from 'react';
import { useMidi } from './useMidi';
import SettingsModal from './SettingsModal';
import './ActionBar.css';

export default function ActionBar() {
  const { status } = useMidi();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="action-bar">
      <span className={`status ${status}`}>Socket: {status}</span>
      <button onClick={() => setShowSettings(true)}>Settings</button>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}
