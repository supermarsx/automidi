import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useMidi } from './useMidi';

interface Props {
  value: number[][];
  onChange: Dispatch<SetStateAction<number[][]>>;
}

export default function MidiMacroEditor({ value, onChange }: Props) {
  const { listen } = useMidi();
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;
    const unsubscribe = listen((msg) => {
      if (msg.direction === 'in') {
        onChange((prev) => [...prev, msg.message]);
      }
    });
    return unsubscribe;
  }, [recording, listen, onChange]);

  const format = (bytes: number[]) =>
    bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');

  return (
    <div className="midi-macro-editor">
      <div className="mb-2">
        <button
          className="retro-button btn-sm me-2"
          onClick={() => setRecording((r) => !r)}
        >
          {recording ? 'STOP' : 'REC'}
        </button>
        <button
          className="retro-button btn-sm"
          onClick={() => onChange([])}
          disabled={value.length === 0}
        >
          CLEAR
        </button>
      </div>
      <div className="midi-macro-list">
        {value.length === 0 ? (
          <div className="text-warning">NO MIDI DATA</div>
        ) : (
          value.map((msg, idx) => (
            <div key={idx} className="text-monospace">
              {format(msg)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
