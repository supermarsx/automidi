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
  const storeColours = useStore((s) => s.padColours[pad.id]);
  const colours = storeColours || {};
  const label = useStore((s) => s.padLabels[pad.id] || '');
  const channel = useStore((s) => s.padChannels[pad.id] || 1);
  const setPadColour = useStore((s) => s.setPadColour);
  const setPadLabel = useStore((s) => s.setPadLabel);
  const setPadChannel = useStore((s) => s.setPadChannel);
  const { send, status } = useMidi();

  const clearPad = () => {
    [1, 2, 3].forEach((ch) => setPadColour(pad.id, '#000000', ch));
    setPadLabel(pad.id, '');
    if (status === 'connected') {
      if (pad.note !== undefined) {
        send(noteOn(pad.note, 0, channel));
      } else if (pad.cc !== undefined) {
        send(cc(pad.cc, 0, channel));
      }
    }
  };

  const handleChange =
    (ch: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selected = LAUNCHPAD_COLORS.find((c) => c.color === e.target.value);
      if (!selected) return;
      setPadColour(pad.id, selected.color, ch);
      if (status === 'connected') {
        if (pad.note !== undefined) {
          send(noteOn(pad.note, selected.value, ch));
        } else if (pad.cc !== undefined) {
          send(cc(pad.cc, selected.value, ch));
        }
      }
    };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPadLabel(pad.id, e.target.value);
  };

  const handleModeClick = (ch: number) => {
    setPadChannel(pad.id, ch);
    const colorHex = colours[ch] || '#000000';
    const colorVal =
      LAUNCHPAD_COLORS.find((c) => c.color === colorHex)?.value || 0;
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
        <label className="form-label text-info">STATIC COLOR:</label>
        <select
          className="form-select retro-select"
          value={colours[1] || '#000000'}
          onChange={handleChange(1)}
          style={{ backgroundColor: colours[1] || '#000000' }}
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
        <label className="form-label text-info">FLASH COLOR:</label>
        <select
          className="form-select retro-select"
          value={colours[2] || '#000000'}
          onChange={handleChange(2)}
          style={{ backgroundColor: colours[2] || '#000000' }}
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
        <label className="form-label text-info">PULSE COLOR:</label>
        <select
          className="form-select retro-select"
          value={colours[3] || '#000000'}
          onChange={handleChange(3)}
          style={{ backgroundColor: colours[3] || '#000000' }}
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
        <div className="mode-buttons d-flex">
          <button
            className={`retro-button btn-sm me-2${channel === 1 ? ' selected' : ''}`}
            onClick={() => handleModeClick(1)}
          >
            STATIC
          </button>
          <button
            className={`retro-button btn-sm me-2${channel === 2 ? ' selected' : ''}`}
            onClick={() => handleModeClick(2)}
          >
            FLASH
          </button>
          <button
            className={`retro-button btn-sm${channel === 3 ? ' selected' : ''}`}
            onClick={() => handleModeClick(3)}
          >
            PULSE
          </button>
        </div>
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
