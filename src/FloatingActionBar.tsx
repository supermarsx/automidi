import { useState, useEffect } from 'react';
import MidiLogger from './MidiLogger';

export default function FloatingActionBar() {
  const [showLogger, setShowLogger] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <div className={`floating-action-bar ${isScrolled ? 'scrolled' : ''}`}>
        <button 
          className="retro-button"
          onClick={() => setShowLogger(!showLogger)}
          title="Toggle MIDI Logger"
        >
          {showLogger ? 'HIDE LOG' : 'MIDI LOG'}
        </button>
      </div>
      {showLogger && <MidiLogger onClose={() => setShowLogger(false)} />}
    </>
  );
}