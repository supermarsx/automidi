import { useStore, type PadColourMap, type PadActions } from './store';
import { useMidi } from './useMidi';
import { noteOn, cc, lightingSysEx } from './midiMessages';
import LAUNCHPAD_COLORS, { getLaunchpadColorValue } from './launchpadColors';

interface PadInfo {
  id: string;
  note?: number;
  cc?: number;
}

interface Props {
  pad: PadInfo;
  onClose: () => void;
}

const EMPTY_COLORS: PadColourMap = {};
const EMPTY_ACTIONS: PadActions = {};

export default function PadOptionsPanel({ pad, onClose }: Props) {
  const storeColours = useStore((s) => s.padColours[pad.id]);
  const colours = storeColours || EMPTY_COLORS;
  const label = useStore((s) => s.padLabels[pad.id] || '');
  const channel = useStore((s) => s.padChannels[pad.id] || 1);
  const action = useStore((s) => s.padActions[pad.id] || EMPTY_ACTIONS);
  const sysexColorMode = useStore((s) => s.settings.sysexColorMode);
  const setPadColour = useStore((s) => s.setPadColour);
  const setPadLabel = useStore((s) => s.setPadLabel);
  const setPadChannel = useStore((s) => s.setPadChannel);
  const setPadAction = useStore((s) => s.setPadAction);
  const macros = useStore((s) => s.macros);
  const { send, status } = useMidi();

  const clearPad = () => {
    [1, 2, 3].forEach((ch) => setPadColour(pad.id, '#000000', ch));
    setPadLabel(pad.id, '');
    if (status === 'connected') {
      const id = pad.note ?? pad.cc;
      if (id !== undefined) {
        if (sysexColorMode) {
          send(lightingSysEx([{ type: 0, index: id, data: [0] }]));
        } else if (pad.note !== undefined) {
          send(noteOn(id, 0, channel));
        } else if (pad.cc !== undefined) {
          send(cc(id, 0, channel));
        }
      }
    }
  };

  const handleChange =
    (ch: number) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = getLaunchpadColorValue(e.target.value);
      if (value === undefined) return;
      setPadColour(pad.id, e.target.value, ch);
      if (status === 'connected') {
        const id = pad.note ?? pad.cc;
        if (id !== undefined) {
          if (sysexColorMode) {
            const type = ch === 1 ? 0 : ch === 2 ? 1 : 2;
            const data = ch === 2 ? [0, value] : [value];
            send(lightingSysEx([{ type, index: id, data }]));
          } else if (pad.note !== undefined) {
            send(noteOn(id, value, ch));
          } else if (pad.cc !== undefined) {
            send(cc(id, value, ch));
          }
        }
      }
    };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPadLabel(pad.id, e.target.value);
  };

  const handleActionChange =
    (type: 'noteOn' | 'noteOff') =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPadAction(pad.id, { ...action, [type]: e.target.value || undefined });
    };

  const handleModeClick = (ch: number) => {
    setPadChannel(pad.id, ch);
    const colorHex = colours[ch] || '#000000';
    const colorVal = getLaunchpadColorValue(colorHex) || 0;
    if (status === 'connected') {
      const id = pad.note ?? pad.cc;
      if (id !== undefined) {
        if (sysexColorMode) {
          const type = ch === 1 ? 0 : ch === 2 ? 1 : 2;
          const data = ch === 2 ? [0, colorVal] : [colorVal];
          send(lightingSysEx([{ type, index: id, data }]));
        } else if (pad.note !== undefined) {
          send(noteOn(id, colorVal, ch));
        } else if (pad.cc !== undefined) {
          send(cc(id, colorVal, ch));
        }
      }
    }
  };

  return (
    <div className="pad-options-panel" onClick={(e) => e.stopPropagation()}>
      <h4>PAD {pad.id}</h4>
      <div className="mb-3">
        <label className="form-label text-info">LABEL:</label>
        <input
          className="form-control retro-input"
          value={label}
          onChange={handleLabelChange}
          placeholder="Label"
        />
      </div>
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
        <label className="form-label text-info">ON NOTE ON:</label>
        <select
          className="form-select retro-select"
          value={action.noteOn || ''}
          onChange={handleActionChange('noteOn')}
        >
          <option value="">NONE</option>
          {macros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="form-label text-info">ON NOTE OFF:</label>
        <select
          className="form-select retro-select"
          value={action.noteOff || ''}
          onChange={handleActionChange('noteOff')}
        >
          <option value="">NONE</option>
          {macros.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id={`confirm-${pad.id}`}
          checked={action.confirm || false}
          onChange={(e) =>
            setPadAction(pad.id, { ...action, confirm: e.target.checked })
          }
        />
        <label
          className="form-check-label text-info"
          htmlFor={`confirm-${pad.id}`}
        >
          CONFIRM BEFORE PLAY
        </label>
      </div>
      <div className="form-check mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id={`toast-${pad.id}`}
          checked={action.confirmToast || false}
          onChange={(e) =>
            setPadAction(pad.id, {
              ...action,
              confirmToast: e.target.checked,
            })
          }
        />
        <label
          className="form-check-label text-info"
          htmlFor={`toast-${pad.id}`}
        >
          TOAST CONFIRMATION
        </label>
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
