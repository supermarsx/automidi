import { useRef, useState } from 'react';
import type { Macro, MidiMsg } from './store';

interface Props {
  macro: Macro;
  onSave: (m: Macro) => void;
  onCancel: () => void;
}

const SCALE = 0.2; // pixels per ms

export default function MacroEditor({ macro, onSave, onCancel }: Props) {
  const [name, setName] = useState(macro.name);
  const [messages, setMessages] = useState<MidiMsg[]>(macro.messages);
  const [tab, setTab] = useState<'timeline' | 'json'>('timeline');
  const [json, setJson] = useState(() => JSON.stringify(messages, null, 2));
  const dragIndex = useRef<number | null>(null);

  const handleDrop = (idx: number) => {
    if (dragIndex.current === null || dragIndex.current === idx) return;
    setMessages((msgs) => {
      const copy = [...msgs];
      const [m] = copy.splice(dragIndex.current!, 1);
      copy.splice(idx, 0, m);
      return copy;
    });
    dragIndex.current = null;
  };

  const handleStretch = (i: number, diff: number) => {
    setMessages((msgs) => {
      const copy = [...msgs];
      const ts = Math.max(1, copy[i].ts + diff / SCALE);
      copy[i] = { ...copy[i], ts };
      return copy;
    });
  };

  const handleJsonBlur = () => {
    try {
      const arr: MidiMsg[] = JSON.parse(json);
      setMessages(arr);
    } catch {
      /* ignore */
    }
  };

  const save = () => {
    onSave({ ...macro, name, messages });
  };

  let offset = 0;
  const items = messages.map((m, i) => {
    const left = offset;
    offset += m.ts;
    return { left, width: m.ts, msg: m, index: i };
  });

  return (
    <div className="retro-panel mt-3">
      <h4 className="text-warning">◄ MACRO EDITOR ►</h4>
      <div className="mb-3">
        <label className="form-label text-info">MACRO NAME:</label>
        <input 
          className="form-control retro-input" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
      </div>
      <div className="mb-3">
        <button 
          className={`retro-button me-2 ${tab === 'timeline' ? 'active' : ''}`}
          onClick={() => setTab('timeline')}
        >
          TIMELINE
        </button>
        <button 
          className={`retro-button ${tab === 'json' ? 'active' : ''}`}
          onClick={() => setTab('json')}
        >
          JSON
        </button>
      </div>
      {tab === 'timeline' ? (
        <div className="macro-timeline" onDragOver={(e) => e.preventDefault()}>
          {items.map((item) => (
            <div
              key={item.index}
              className="timeline-event"
              draggable
              onDragStart={() => {
                dragIndex.current = item.index;
              }}
              onDrop={() => handleDrop(item.index)}
              style={{
                left: item.left * SCALE,
                width: Math.max(20, item.width * SCALE),
              }}
            >
              <span>{item.index + 1}</span>
              <div
                style={{
                  width: '6px',
                  height: '100%',
                  background: '#ffff00',
                  cursor: 'ew-resize',
                  marginLeft: '4px',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const startX = e.clientX;
                  const move = (ev: MouseEvent) => {
                    handleStretch(item.index, ev.clientX - startX);
                  };
                  const up = () => {
                    window.removeEventListener('mousemove', move);
                    window.removeEventListener('mouseup', up);
                  };
                  window.addEventListener('mousemove', move);
                  window.addEventListener('mouseup', up);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <textarea
          className="form-control retro-textarea"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          onBlur={handleJsonBlur}
          rows={10}
        />
      )}
      <div className="mt-3">
        <button className="retro-button me-2" onClick={save}>
          SAVE
        </button>
        <button className="retro-button" onClick={onCancel}>
          CANCEL
        </button>
      </div>
    </div>
  );
}