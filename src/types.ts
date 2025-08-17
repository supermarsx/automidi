import type { MidiDevice } from '../shared/messages';

export interface DevicesMessage {
  type: 'devices';
  inputs?: MidiDevice[];
  outputs?: MidiDevice[];
}

export interface MidiPayload {
  type: 'midi';
  direction: 'in' | 'out';
  message: number[];
  timestamp: number;
  source?: string;
  target?: string;
  port?: string;
  pressure?: number;
}

export type MidiServerMessage = DevicesMessage | MidiPayload;

export function isDevicesMessage(msg: unknown): msg is DevicesMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Partial<DevicesMessage>;
  if (m.type !== 'devices') return false;
  if (m.inputs && !Array.isArray(m.inputs)) return false;
  if (m.outputs && !Array.isArray(m.outputs)) return false;
  return true;
}

export function isMidiPayload(msg: unknown): msg is MidiPayload {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Partial<MidiPayload>;
  if (m.type !== 'midi') return false;
  if (m.direction !== 'in' && m.direction !== 'out') return false;
  if (!Array.isArray(m.message)) return false;
  if (typeof m.timestamp !== 'number') return false;
  return true;
}
