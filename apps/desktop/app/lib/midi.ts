import type { MidiDevice } from "@shared/messages";

export type MidiDevices = {
  inputs: MidiDevice[];
  outputs: MidiDevice[];
};

export async function listMidiDevices(): Promise<MidiDevices> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<MidiDevices>("midi_list_devices");
}

export async function sendMidi(portId: string, bytes: number[]): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("midi_send", { portId, bytes });
}
