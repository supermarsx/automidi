export interface SendMidiMessage {
  type: 'send';
  port: string;
  bytes: number[];
}

export interface RunAppMessage {
  type: 'runApp';
  app: string;
}

export interface RunShellMessage {
  type: 'runShell';
  cmd: string;
}

export interface RunShellWinMessage {
  type: 'runShellWin';
  cmd: string;
}

export interface RunShellBgMessage {
  type: 'runShellBg';
  cmd: string;
}

export interface KeysTypeMessage {
  type: 'keysType';
  sequence: string[];
  interval?: number;
}

export interface NotifyMessage {
  type: 'notify';
  title?: string;
  message: string;
}

export interface PingMessage {
  type: 'ping';
  ts: number;
}

export interface PongMessage {
  type: 'pong';
  ts: number;
}

export interface GetDevicesMessage {
  type: 'getDevices';
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer?: string;
  state?: string;
}

export interface DevicesMessage {
  type: 'devices';
  inputs?: MidiDevice[];
  outputs?: MidiDevice[];
}

export interface MidiEventMessage {
  type: 'midi';
  direction: 'in' | 'out';
  message: number[];
  timestamp: number;
  source?: string;
  target?: string;
  port?: string;
  pressure?: number;
}

export type ClientMessage =
  | SendMidiMessage
  | RunAppMessage
  | RunShellMessage
  | RunShellWinMessage
  | RunShellBgMessage
  | KeysTypeMessage
  | NotifyMessage
  | PingMessage
  | GetDevicesMessage;

export type ServerMessage = PongMessage | DevicesMessage | MidiEventMessage;

export type WsMessage = ClientMessage | ServerMessage;
