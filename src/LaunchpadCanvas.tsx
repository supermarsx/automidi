import React, { memo, useState } from 'react';
import { useStore } from './store';
import PadOptionsPanel from './PadOptionsPanel';

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

const TOP_CC = [91, 92, 93, 94, 95, 96, 97, 98, 99];
const SIDE_CC = [89, 79, 69, 59, 49, 39, 29, 19];

interface PadProps {
  id: string;
  note?: number;
  cc?: number;
  isEmpty?: boolean;
}

const Pad = memo(
  ({
    id,
    note,
    cc: ccNum,
    isEmpty,
    onSelect,
    selected,
    extraClass,
  }: PadProps & {
    onSelect: (p: { id: string; note?: number; cc?: number }) => void;
    selected?: boolean;
    extraClass?: string;
  }) => {
    const colour = useStore((s) => s.padColours[id] || '#000000');
    const label = useStore((s) => s.padLabels[id] || '');

    if (isEmpty) {
      return <div className="midi-pad-empty"></div>;
    }

    return (
      <div
        className={`midi-pad-container ${selected ? 'selected' : ''} ${
          extraClass || ''
        }`}
        id={id}
        style={{ backgroundColor: colour }}
        title={note !== undefined ? `Note ${note}` : `CC ${ccNum}`}
        onClick={() => onSelect({ id, note, cc: ccNum })}
      >
        {label && <span className="pad-label">{label}</span>}
      </div>
    );
  },
);

export function LaunchpadCanvas() {
  const [selected, setSelected] = useState<PadProps | null>(null);
  const grid: React.ReactElement[] = [];

  // Top row - 9 CC controls
  for (let x = 0; x < 9; x++) {
    const id = `cc-${TOP_CC[x]}`;
    grid.push(
      <Pad
        key={id}
        id={id}
        cc={TOP_CC[x]}
        onSelect={setSelected}
        selected={selected?.id === id}
        extraClass="top-cc"
      />,
    );
  }

  // Main 8x8 grid with side controls moved to the right
  for (let y = 0; y < 8; y++) {
    // Main 8x8 note grid
    for (let x = 0; x < 8; x++) {
      const note = NOTE_GRID[y][x];
      const id = `n-${note}`;
      grid.push(
        <Pad
          key={id}
          id={id}
          note={note}
          onSelect={setSelected}
          selected={selected?.id === id}
        />,
      );
    }

    // Side CC control (right)
    const sideId = `cc-${SIDE_CC[y]}`;
    grid.push(
      <Pad
        key={sideId}
        id={sideId}
        cc={SIDE_CC[y]}
        onSelect={setSelected}
        selected={selected?.id === sideId}
        extraClass="side-cc"
      />,
    );
  }
  return (
    <>
      <div className="midi-grid-fixed">{grid}</div>
      {selected && (
        <PadOptionsPanel pad={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}

export default memo(LaunchpadCanvas);
