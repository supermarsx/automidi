import React, { memo } from 'react';
import { noteOn, cc, ledLighting } from './midiMessages';
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

// Launchpad X color palette according to spec (page 10-11 of programmer's reference)
const LAUNCHPAD_COLORS = {
  OFF: 0,
  RED_LOW: 1, RED_MID: 2, RED_FULL: 3,
  AMBER_LOW: 17, AMBER_MID: 18, AMBER_FULL: 19,
  YELLOW_LOW: 33, YELLOW_MID: 34, YELLOW_FULL: 35,
  LIME_LOW: 49, LIME_MID: 50, LIME_FULL: 51,
  GREEN_LOW: 65, GREEN_MID: 66, GREEN_FULL: 67,
  SPRING_LOW: 81, SPRING_MID: 82, SPRING_FULL: 83,
  CYAN_LOW: 97, CYAN_MID: 98, CYAN_FULL: 99,
  SKY_LOW: 113, SKY_MID: 114, SKY_FULL: 115,
  BLUE_LOW: 129, BLUE_MID: 130, BLUE_FULL: 131,
  PURPLE_LOW: 145, PURPLE_MID: 146, PURPLE_FULL: 147,
  PINK_LOW: 161, PINK_MID: 162, PINK_FULL: 163,
  ORANGE_LOW: 177, ORANGE_MID: 178, ORANGE_FULL: 179,
  WHITE: 3
};

function hexToLaunchpadColor(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Map to closest Launchpad color based on RGB values
  const brightness = (r + g + b) / 3;
  
  if (r > 200 && g < 100 && b < 100) {
    return brightness > 170 ? LAUNCHPAD_COLORS.RED_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.RED_MID : LAUNCHPAD_COLORS.RED_LOW;
  }
  if (r > 200 && g > 150 && b < 100) {
    return brightness > 170 ? LAUNCHPAD_COLORS.AMBER_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.AMBER_MID : LAUNCHPAD_COLORS.AMBER_LOW;
  }
  if (r > 200 && g > 200 && b < 100) {
    return brightness > 170 ? LAUNCHPAD_COLORS.YELLOW_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.YELLOW_MID : LAUNCHPAD_COLORS.YELLOW_LOW;
  }
  if (r < 150 && g > 200 && b < 100) {
    return brightness > 170 ? LAUNCHPAD_COLORS.LIME_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.LIME_MID : LAUNCHPAD_COLORS.LIME_LOW;
  }
  if (r < 100 && g > 200 && b < 100) {
    return brightness > 170 ? LAUNCHPAD_COLORS.GREEN_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.GREEN_MID : LAUNCHPAD_COLORS.GREEN_LOW;
  }
  if (r < 100 && g > 200 && b > 150) {
    return brightness > 170 ? LAUNCHPAD_COLORS.SPRING_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.SPRING_MID : LAUNCHPAD_COLORS.SPRING_LOW;
  }
  if (r < 100 && g > 150 && b > 200) {
    return brightness > 170 ? LAUNCHPAD_COLORS.CYAN_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.CYAN_MID : LAUNCHPAD_COLORS.CYAN_LOW;
  }
  if (r < 100 && g < 150 && b > 200) {
    return brightness > 170 ? LAUNCHPAD_COLORS.BLUE_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.BLUE_MID : LAUNCHPAD_COLORS.BLUE_LOW;
  }
  if (r > 150 && g < 100 && b > 200) {
    return brightness > 170 ? LAUNCHPAD_COLORS.PURPLE_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.PURPLE_MID : LAUNCHPAD_COLORS.PURPLE_LOW;
  }
  if (r > 200 && g < 150 && b > 150) {
    return brightness > 170 ? LAUNCHPAD_COLORS.PINK_FULL : 
           brightness > 85 ? LAUNCHPAD_COLORS.PINK_MID : LAUNCHPAD_COLORS.PINK_LOW;
  }
  if (r > 200 && g > 200 && b > 200) {
    return LAUNCHPAD_COLORS.WHITE;
  }
  
  return LAUNCHPAD_COLORS.OFF;
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
  const { send } = useMidi();

  if (isEmpty) {
    return <div className="midi-pad-empty"></div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPadColour(id, value);
    const colorValue = hexToLaunchpadColor(value);
    
    if (note !== undefined) {
      send(noteOn(note, colorValue));
    } else if (ccNum !== undefined) {
      send(cc(ccNum, colorValue));
    }
  };

  return (
    <input
      type="color"
      className="midi-pad"
      value={colour}
      onChange={handleChange}
      style={{ backgroundColor: colour }}
      title={note !== undefined ? `Note ${note}` : `CC ${ccNum}`}
    />
  );
});

export function LaunchpadCanvas() {
  const grid: React.ReactElement[] = [];

  // Top row - empty corner + 8 CC controls + missing button on right
  grid.push(<Pad key="empty-top-left" id="empty-top-left" isEmpty={true} />);
  for (let x = 0; x < 8; x++) {
    const id = `cc-${TOP_CC[x]}`;
    grid.push(<Pad key={id} id={id} cc={TOP_CC[x]} />);
  }
  // Right side button (CC 99 - Logo button)
  grid.push(<Pad key="cc-99" id="cc-99" cc={99} />);

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
    
    // Empty space (right)
    grid.push(<Pad key={`empty-right-${y}`} id={`empty-right-${y}`} isEmpty={true} />);
  }

  return <div className="midi-grid-fixed">{grid}</div>;
}

export default memo(LaunchpadCanvas);