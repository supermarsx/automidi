import { useState, useEffect } from 'react';
import MidiLogger from './MidiLogger';
import SettingsModal from './SettingsModal';
import { useMidi } from './useMidi';
import { useLogStore } from './logStore';

export default function FloatingActionBar() {
  const [showLogger, setShowLogger] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const logCount = useLogStore((s) => s.logs.length);
  const addMessage = useLogStore((s) => s.addMessage);
  const { listen } = useMidi();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unlisten = listen(addMessage);
    return unlisten;
  }, [listen, addMessage]);

  return (
    <>
      <div className={`floating-action-bar ${isScrolled ? 'scrolled' : ''}`}>
        {!showLogger && (
          <button
            className="retro-button"
            onClick={() => setShowLogger(true)}
            title="Toggle MIDI Logger"
          >
            MIDI LOG ({logCount})
          </button>
        )}
        <button
          className="retro-button"
          onClick={() => setShowSettings(true)}
          title="Open Configuration"
        >
          CONFIG
        </button>
      </div>
      {showLogger && <MidiLogger onClose={() => setShowLogger(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
