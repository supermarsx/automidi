import { useStore } from './store';
import { useMidi } from './useMidi';
import { noteOn, cc } from './midiMessages';
import LAUNCHPAD_COLORS from './launchpadColors';

interface PadInfo {
  id: string;
  note?: number;
  cc?: number;
}

interface Props {
  pad: PadInfo;
  onClose: () => void;
}

export default function PadOptionsPanel({ pad, onClose }: Props) {
  const colour = useStore((s) => s.padColours[pad.id] || '#000000');
  const setPadColour = useStore((s) => s.setPadColour);
  const { send, status } = useMidi();

  const clearPad = () => {
    setPadColour(pad.id, '#000000');
    if (status === 'connected') {
      if (pad.note !== undefined) {
        send(noteOn(pad.note, 0));
      } else if (pad.cc !== undefined) {
        send(cc(pad.cc, 0));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = LAUNCHPAD_COLORS.find((c) => c.color === e.target.value);
    if (!selected) return;
    setPadColour(pad.id, selected.color);
    if (status === 'connected') {
      if (pad.note !== undefined) {
        send(noteOn(pad.note, selected.value));
      } else if (pad.cc !== undefined) {
        send(cc(pad.cc, selected.value));
      }
    }
  };

  return (
    <div className="pad-options-panel" onClick={(e) => e.stopPropagation()}>
      <h4>PAD {pad.id}</h4>
      <div className="mb-3">
        <label className="form-label text-info">COLOR:</label>
        <select
          className="form-select retro-select"
          value={colour}
          onChange={handleChange}
          style={{ backgroundColor: colour }}
        >
          {LAUNCHPAD_COLORS.map((color) => (
            <option
              key={color.value}
              value={color.color}
              style={{
                backgroundColor: color.color,
                color: color.color === '#000000' ? '#fff' : '#000',
              }}
            >
              {color.name}
            </option>
          ))}
        </select>
      </div>
      <button className="retro-button me-2" onClick={clearPad}>
        CLEAR
      </button>
      <button className="retro-button" onClick={onClose}>
        CLOSE
      </button>
    </div>
  );
}
