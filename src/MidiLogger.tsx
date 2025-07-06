import { useEffect, useRef, useState } from 'react';
import { useLogStore } from './logStore';

interface Props {
  onClose: () => void;
}

export default function MidiLogger({ onClose }: Props) {
  const logs = useLogStore((s) => s.logs);
  const clearLogs = useLogStore((s) => s.clearLogs);
  const [filter, setFilter] = useState<'all' | 'in' | 'out'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const formatBytes = (bytes: number[]) => {
    return bytes
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');
  };

  const getMsgType = (bytes: number[]) => {
    if (bytes.length === 0) return 'EMPTY';
    const status = bytes[0];
    if (status >= 0x80 && status <= 0x8f) return 'NOTE_OFF';
    if (status >= 0x90 && status <= 0x9f) return 'NOTE_ON';
    if (status >= 0xa0 && status <= 0xaf) return 'AFTERTOUCH';
    if (status >= 0xb0 && status <= 0xbf) return 'CC';
    if (status >= 0xc0 && status <= 0xcf) return 'PROG_CHG';
    if (status >= 0xd0 && status <= 0xdf) return 'CH_PRESSURE';
    if (status >= 0xe0 && status <= 0xef) return 'PITCH_BEND';
    if (status === 0xf0) return 'SYSEX';
    if (status === 0xf1) return 'MTC';
    if (status === 0xf2) return 'SONG_POS';
    if (status === 0xf3) return 'SONG_SEL';
    if (status === 0xf6) return 'TUNE_REQ';
    if (status === 0xf7) return 'EOX';
    if (status === 0xf8) return 'CLOCK';
    if (status === 0xfa) return 'START';
    if (status === 0xfb) return 'CONTINUE';
    if (status === 0xfc) return 'STOP';
    if (status === 0xfe) return 'ACTIVE_SENSE';
    if (status === 0xff) return 'RESET';
    return 'OTHER';
  };

  const getMessageDetails = (bytes: number[]) => {
    if (bytes.length === 0) return '';
    const status = bytes[0];

    if (status >= 0x90 && status <= 0x9f && bytes.length >= 3) {
      return `Ch${(status & 0x0f) + 1} Note:${bytes[1]} Vel:${bytes[2]}`;
    }
    if (status >= 0x80 && status <= 0x8f && bytes.length >= 3) {
      return `Ch${(status & 0x0f) + 1} Note:${bytes[1]} Vel:${bytes[2]}`;
    }
    if (status >= 0xb0 && status <= 0xbf && bytes.length >= 3) {
      return `Ch${(status & 0x0f) + 1} CC:${bytes[1]} Val:${bytes[2]}`;
    }
    if (status === 0xf0) {
      return `Len:${bytes.length}`;
    }
    return '';
  };

  const messageTypes = Array.from(
    new Set(logs.map((l) => getMsgType(l.message))),
  );
  const devices = Array.from(
    new Set(
      logs
        .map((l) => (l.direction === 'in' ? l.source : l.target))
        .filter((d): d is string => !!d),
    ),
  );

  const filteredLogs = logs.filter((log) => {
    if (filter !== 'all' && log.direction !== filter) return false;
    const type = getMsgType(log.message);
    if (typeFilter !== 'all' && type !== typeFilter) return false;
    const device = log.direction === 'in' ? log.source : log.target;
    if (deviceFilter !== 'all' && device !== deviceFilter) return false;
    return true;
  });

  return (
    <div className="midi-logger">
      <div className="logger-header">
        <h5 className="text-warning">◄ MIDI DATA STREAM ►</h5>
        <div className="d-flex align-items-center">
          <select
            className="form-select retro-select me-2"
            style={{ width: 'auto', fontSize: '12px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'in' | 'out')}
          >
            <option value="all">ALL ({logs.length})</option>
            <option value="in">
              IN ({logs.filter((l) => l.direction === 'in').length})
            </option>
            <option value="out">
              OUT ({logs.filter((l) => l.direction === 'out').length})
            </option>
          </select>
          <select
            className="form-select retro-select me-2"
            style={{ width: 'auto', fontSize: '12px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">ALL TYPES</option>
            {messageTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="form-select retro-select me-2"
            style={{ width: 'auto', fontSize: '12px' }}
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
          >
            <option value="all">ALL DEVICES</option>
            {devices.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <button className="retro-button btn-sm me-2" onClick={clearLogs}>
            CLEAR
          </button>
          <button className="retro-button btn-sm" onClick={onClose}>
            HIDE
          </button>
        </div>
      </div>
      <div className="logger-content" ref={logRef}>
        {filteredLogs.length === 0 ? (
          <div className="text-center text-warning p-3">
            NO MIDI DATA {filter !== 'all' ? `(${filter.toUpperCase()})` : ''}
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div key={entry.id} className={`log-entry ${entry.direction}`}>
              <span className="log-time">{entry.formattedTime}</span>
              <span className={`log-direction ${entry.direction}`}>
                {entry.direction === 'in' ? '◄ IN' : 'OUT ►'}
              </span>
              <span className="log-type">{getMsgType(entry.message)}</span>
              <span className="log-data">{formatBytes(entry.message)}</span>
              <span className="log-details">
                {getMessageDetails(entry.message)}
              </span>
              {(entry.source || entry.target) && (
                <span className="log-source">
                  ({entry.direction === 'in' ? entry.source : entry.target})
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
