import React, { memo } from 'react';
import { noteOn, cc } from './midiMessages';
import { useMidi } from './useMidi';
import { useStore } from './store';
import LAUNCHPAD_COLORS from './launchpadColors';

// MIDI mappings for Launchpad X according to programmer's reference
const NOTE_GRID: number[][] = [
  [81, 82, 83, 84, 85, 86, 87, 88],
  [71, 72, 73, 74, 75, 76, 77, 78],
  [61, 62, 63, 64, 65, 66, 67, 68],
  [51, 52, 53, 54, 55, 56, 57, 58],
  [41, 42, 43, 44, 45, 46, 47, 48],
  [31, 32, 33, 34, 35, 36, 37, 38],
  [21, 22, 23, 24, 25, 26, 27, 28],
  [11, 12, 13, 14, 15, 16, 17, 18],
];

const TOP_CC = [104, 105, 106, 107, 108, 109, 110, 111];
const SIDE_CC = [89, 79, 69, 59, 49, 39, 29, 19];

interface PadProps {
  id: string;
  note?: number;
  cc?: number;
  isEmpty?: boolean;
}

const Pad = memo(({ id, note, cc: ccNum, isEmpty }: PadProps) => {
  const colour = useStore((s) => s.padColours[id] || '#000000');
  const setPadColour = useStore((s) => s.setPadColour);
  const { send, status } = useMidi();

  if (isEmpty) {
    return <div className="midi-pad-empty"></div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedColor = LAUNCHPAD_COLORS.find(
      (c) => c.color === e.target.value,
    );
    if (!selectedColor) return;

    setPadColour(id, selectedColor.color);

    if (status === 'connected') {
      if (note !== undefined) {
        send(noteOn(note, selectedColor.value));
      } else if (ccNum !== undefined) {
        send(cc(ccNum, selectedColor.value));
      }
    }
  };

  return (
    <div className="midi-pad-container">
      <select
        className="midi-pad-select"
        value={colour}
        onChange={handleChange}
        style={{ backgroundColor: colour }}
        title={note !== undefined ? `Note ${note}` : `CC ${ccNum}`}
      >
        {LAUNCHPAD_COLORS.map((color) => (
          <option
            key={color.name}
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
  );
});

export function LaunchpadCanvas() {
  const grid: React.ReactElement[] = [];

  // Top row - empty corner + 8 CC controls
  grid.push(<Pad key="empty-top-left" id="empty-top-left" isEmpty={true} />);
  for (let x = 0; x < 8; x++) {
    const id = `cc-${TOP_CC[x]}`;
    grid.push(<Pad key={id} id={id} cc={TOP_CC[x]} />);
  }

  // Main 8x8 grid with side controls
  for (let y = 0; y < 8; y++) {
    // Side CC control (left)
    const sideId = `cc-${SIDE_CC[y]}`;
    grid.push(<Pad key={sideId} id={sideId} cc={SIDE_CC[y]} />);

    // Main 8x8 note grid
    for (let x = 0; x < 8; x++) {
      const note = NOTE_GRID[y][x];
      const id = `n-${note}`;
      grid.push(<Pad key={id} id={id} note={note} />);
    }
  }

  return <div className="midi-grid-fixed">{grid}</div>;
}

export default memo(LaunchpadCanvas);
