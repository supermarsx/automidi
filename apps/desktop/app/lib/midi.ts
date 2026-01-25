import type { DevicesMessage, MidiDevice, MidiEventMessage } from "@shared/messages";

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

export async function setMidiListening(enabled: boolean): Promise<void> {
  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("midiSetListening", { enabled });
}

export async function onMidiEvent(
  handler: (event: MidiEventMessage) => void,
): Promise<() => void> {
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<MidiEventMessage>("midi:event", (event) => {
    handler(event.payload);
  });
  return () => {
    unlisten();
  };
}

export async function onDeviceChange(
  handler: (event: DevicesMessage) => void,
): Promise<() => void> {
  const { listen } = await import("@tauri-apps/api/event");
  const unlisten = await listen<DevicesMessage>("midi:devices", (event) => {
    handler(event.payload);
  });
  return () => {
    unlisten();
  };
}
