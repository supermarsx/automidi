import { useEffect, useRef, useState } from 'react';
import { useMidi } from './useMidi';

interface LogEntry {
  id: number;
  timestamp: string;
  direction: 'in' | 'out';
  data: number[];
  source?: string;
}

export default function MidiLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { listen } = useMidi();
  const logRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    const unlisten = listen((msg) => {
      const entry: LogEntry = {
        id: idCounter.current++,
        timestamp: new Date().toLocaleTimeString(),
        direction: 'in',
        data: Array.from(msg.data),
        source: msg.source,
      };
      setLogs(prev => [...prev.slice(-99), entry]); // Keep last 100 entries
    });
    return unlisten;
  }, [listen]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const formatBytes = (bytes: number[]) => {
    return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  };

  const getMsgType = (bytes: number[]) => {
    if (bytes.length === 0) return 'EMPTY';
    const status = bytes[0];
    if (status >= 0x80 && status <= 0x8F) return 'NOTE_OFF';
    if (status >= 0x90 && status <= 0x9F) return 'NOTE_ON';
    if (status >= 0xB0 && status <= 0xBF) return 'CC';
    if (status === 0xF0) return 'SYSEX';
    return 'OTHER';
  };

  if (!isVisible) {
    return (
      <button 
        className="retro-button position-fixed"
        style={{ bottom: '20px', right: '20px', zIndex: 1000 }}
        onClick={() => setIsVisible(true)}
      >
        MIDI LOG
      </button>
    );
  }

  return (
    <div className="midi-logger">
      <div className="logger-header">
        <h5 className="text-warning">◄ MIDI DATA STREAM ►</h5>
        <div>
          <button className="retro-button btn-sm me-2" onClick={clearLogs}>
            CLEAR
          </button>
          <button className="retro-button btn-sm" onClick={() => setIsVisible(false)}>
            HIDE
          </button>
        </div>
      </div>
      <div className="logger-content" ref={logRef}>
        {logs.length === 0 ? (
          <div className="text-center text-warning p-3">
            NO MIDI DATA RECEIVED
          </div>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} className={`log-entry ${entry.direction}`}>
              <span className="log-time">{entry.timestamp}</span>
              <span className={`log-direction ${entry.direction}`}>
                {entry.direction === 'in' ? '◄ IN' : 'OUT ►'}
              </span>
              <span className="log-type">{getMsgType(entry.data)}</span>
              <span className="log-data">{formatBytes(entry.data)}</span>
              {entry.source && (
                <span className="log-source">({entry.source})</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}