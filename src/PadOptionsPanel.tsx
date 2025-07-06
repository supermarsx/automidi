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
  const label = useStore((s) => s.padLabels[pad.id] || '');
  const channel = useStore((s) => s.padChannels[pad.id] || 1);
  const setPadColour = useStore((s) => s.setPadColour);
  const setPadLabel = useStore((s) => s.setPadLabel);
  const setPadChannel = useStore((s) => s.setPadChannel);
  const { send, status } = useMidi();

  const clearPad = () => {
    setPadColour(pad.id, '#000000');
    if (status === 'connected') {
      if (pad.note !== undefined) {
        send(noteOn(pad.note, 0, channel));
      } else if (pad.cc !== undefined) {
        send(cc(pad.cc, 0, channel));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = LAUNCHPAD_COLORS.find((c) => c.color === e.target.value);
    if (!selected) return;
    setPadColour(pad.id, selected.color);
    if (status === 'connected') {
      if (pad.note !== undefined) {
        send(noteOn(pad.note, selected.value, channel));
      } else if (pad.cc !== undefined) {
        send(cc(pad.cc, selected.value, channel));
      }
    }
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPadLabel(pad.id, e.target.value);
  };

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ch = Number(e.target.value);
    setPadChannel(pad.id, ch);
    const colorVal =
      LAUNCHPAD_COLORS.find((c) => c.color === colour)?.value || 0;
    if (status === 'connected') {
      if (pad.note !== undefined) {
        send(noteOn(pad.note, colorVal, ch));
      } else if (pad.cc !== undefined) {
        send(cc(pad.cc, colorVal, ch));
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
      <div className="mb-3">
        <label className="form-label text-info">MODE:</label>
        <select
          className="form-select retro-select"
          value={channel}
          onChange={handleChannelChange}
        >
          <option value={1}>Static</option>
          <option value={2}>Flashing</option>
          <option value={3}>Pulsing</option>
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label text-info">LABEL:</label>
        <input
          className="form-control retro-input"
          value={label}
          onChange={handleLabelChange}
          placeholder="Label"
        />
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
