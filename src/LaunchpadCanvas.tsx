import React, { memo } from 'react';
import { noteOn, cc } from './midiMessages';
import { useMidi } from './useMidi';
import { useStore } from './store';

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

// Launchpad X color palette according to spec (exact values from programmer's reference)
const LAUNCHPAD_COLORS = [
  { name: 'OFF', value: 0, color: '#000000' },
  { name: 'RED_LOW', value: 1, color: '#330000' },
  { name: 'RED_MID', value: 2, color: '#660000' },
  { name: 'RED_FULL', value: 3, color: '#FF0000' },
  { name: 'AMBER_LOW', value: 17, color: '#331100' },
  { name: 'AMBER_MID', value: 18, color: '#662200' },
  { name: 'AMBER_FULL', value: 19, color: '#FF4400' },
  { name: 'YELLOW_LOW', value: 33, color: '#333300' },
  { name: 'YELLOW_MID', value: 34, color: '#666600' },
  { name: 'YELLOW_FULL', value: 35, color: '#FFFF00' },
  { name: 'LIME_LOW', value: 49, color: '#223300' },
  { name: 'LIME_MID', value: 50, color: '#446600' },
  { name: 'LIME_FULL', value: 51, color: '#88FF00' },
  { name: 'GREEN_LOW', value: 65, color: '#003300' },
  { name: 'GREEN_MID', value: 66, color: '#006600' },
  { name: 'GREEN_FULL', value: 67, color: '#00FF00' },
  { name: 'SPRING_LOW', value: 81, color: '#003322' },
  { name: 'SPRING_MID', value: 82, color: '#006644' },
  { name: 'SPRING_FULL', value: 83, color: '#00FF88' },
  { name: 'CYAN_LOW', value: 97, color: '#003333' },
  { name: 'CYAN_MID', value: 98, color: '#006666' },
  { name: 'CYAN_FULL', value: 99, color: '#00FFFF' },
  { name: 'SKY_LOW', value: 113, color: '#002233' },
  { name: 'SKY_MID', value: 114, color: '#004466' },
  { name: 'SKY_FULL', value: 115, color: '#0088FF' },
  { name: 'BLUE_LOW', value: 129, color: '#000033' },
  { name: 'BLUE_MID', value: 130, color: '#000066' },
  { name: 'BLUE_FULL', value: 131, color: '#0000FF' },
  { name: 'PURPLE_LOW', value: 145, color: '#220033' },
  { name: 'PURPLE_MID', value: 146, color: '#440066' },
  { name: 'PURPLE_FULL', value: 147, color: '#8800FF' },
  { name: 'PINK_LOW', value: 161, color: '#330022' },
  { name: 'PINK_MID', value: 162, color: '#660044' },
  { name: 'PINK_FULL', value: 163, color: '#FF0088' },
  { name: 'ORANGE_LOW', value: 177, color: '#331100' },
  { name: 'ORANGE_MID', value: 178, color: '#662200' },
  { name: 'ORANGE_FULL', value: 179, color: '#FF4400' },
  { name: 'WHITE', value: 3, color: '#FFFFFF' }
];

function findClosestLaunchpadColor(hex: string): { value: number; color: string } {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  let closestColor = LAUNCHPAD_COLORS[0];
  let minDistance = Infinity;
  
  for (const color of LAUNCHPAD_COLORS) {
    const cr = parseInt(color.color.slice(1, 3), 16);
    const cg = parseInt(color.color.slice(3, 5), 16);
    const cb = parseInt(color.color.slice(5, 7), 16);
    
    const distance = Math.sqrt(
      Math.pow(r - cr, 2) + 
      Math.pow(g - cg, 2) + 
      Math.pow(b - cb, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }
  
  return { value: closestColor.value, color: closestColor.color };
}

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
    const selectedColor = LAUNCHPAD_COLORS.find(c => c.color === e.target.value);
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
            key={color.value} 
            value={color.color}
            style={{ backgroundColor: color.color, color: color.color === '#000000' ? '#fff' : '#000' }}
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