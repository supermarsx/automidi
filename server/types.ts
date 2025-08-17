export interface MidiMessage {
  type: 'send';
  port: string;
  bytes: number[];
}

export interface MidiEvent {
  type: 'midi';
  direction: 'in' | 'out';
  message: number[];
  timestamp: number;
  port: string;
  source?: string;
  target?: string;
  pressure?: number;
}
