import React, { memo } from 'react';
import { noteOn, cc } from './midiMessages';
import { useMidi } from './useMidi';
import { useStore } from './store';
import './LaunchpadCanvas.css';

// MIDI mappings for Launchpad X
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
const SIDE_CC = [91, 92, 93, 94, 95, 96, 97, 98];

function hexToVelocity(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return Math.round(((r + g + b) / (255 * 3)) * 127);
}

interface PadProps {
  id: string;
  note?: number;
  cc?: number;
}

const Pad = memo(({ id, note, cc: ccNum }: PadProps) => {
  const colour = useStore((s) => s.padColours[id] || '#000000');
  const setPadColour = useStore((s) => s.setPadColour);
  const { send } = useMidi();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPadColour(id, value);
    const vel = hexToVelocity(value);
    if (note !== undefined) send(noteOn(note, vel));
    else if (ccNum !== undefined) send(cc(ccNum, vel));
  };

  return (
    <input
      type="color"
      className="pad"
      value={colour}
      onChange={handleChange}
    />
  );
});

export function LaunchpadCanvas() {
  const grid: React.ReactElement[] = [];

  // top-left corner
  grid.push(<div key="tl" />);

  // top row
  for (let x = 0; x < 8; x++) {
    const id = `cc-${TOP_CC[x]}`;
    grid.push(<Pad key={id} id={id} cc={TOP_CC[x]} />);
  }

  // top-right corner
  grid.push(<div key="tr" />);

  for (let y = 0; y < 8; y++) {
    // left blank column
    grid.push(<div key={`l-${y}`} />);
    for (let x = 0; x < 8; x++) {
      const note = NOTE_GRID[y][x];
      const id = `n-${note}`;
      grid.push(<Pad key={id} id={id} note={note} />);
    }
    const id = `cc-${SIDE_CC[y]}`;
    grid.push(<Pad key={id} id={id} cc={SIDE_CC[y]} />);
  }

  // bottom-right corner
  grid.push(<div key="br" />);

  return <div className="launchpad-grid">{grid}</div>;
}

export default memo(LaunchpadCanvas);
