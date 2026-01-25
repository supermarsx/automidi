"use client";

import { useEffect, useState } from "react";
import { listMidiDevices, onDeviceChange, onMidiEvent, setMidiListening } from "./lib/midi";
import { isTauriRuntime } from "./lib/tauri";
import type { MidiDevice } from "@shared/messages";

export default function Home() {
  const [tauriReady, setTauriReady] = useState(false);
  const [inputs, setInputs] = useState<MidiDevice[]>([]);
  const [outputs, setOutputs] = useState<MidiDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastMidi, setLastMidi] = useState<string>("-");

  useEffect(() => {
    setTauriReady(isTauriRuntime());
  }, []);

  useEffect(() => {
    if (!tauriReady) return;

    let disposeEvents: Array<() => void> = [];
    let cancelled = false;

    (async () => {
      try {
        await setMidiListening(true);
        const disposeMidi = await onMidiEvent((event) => {
          setLastMidi(`${event.direction} ${event.message.join(",")}`);
        });
        const disposeDevices = await onDeviceChange((event) => {
          if (cancelled) return;
          setInputs(event.inputs ?? []);
          setOutputs(event.outputs ?? []);
        });
        disposeEvents = [disposeMidi, disposeDevices];
      } catch {
        // Silent until we wire real error reporting.
      }
    })();

    return () => {
      cancelled = true;
      disposeEvents.forEach((dispose) => dispose());
    };
  }, [tauriReady]);

  async function handleLoadDevices() {
    setLoading(true);
    try {
      const devices = await listMidiDevices();
      setInputs(devices.inputs ?? []);
      setOutputs(devices.outputs ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Automidi Desktop</h1>
      <p>Next.js 16 + Tauri migration scaffold.</p>
      <p>Status: {tauriReady ? "Tauri runtime detected" : "Browser runtime"}</p>
      <button
        type="button"
        onClick={handleLoadDevices}
        disabled={!tauriReady || loading}
        style={{ marginTop: "1rem" }}
      >
        {loading ? "Loading..." : "Load MIDI devices"}
      </button>
      <section style={{ marginTop: "1rem" }}>
        <h2>Inputs</h2>
        <ul>
          {inputs.map((input) => (
            <li key={input.id}>{input.name ?? input.id}</li>
          ))}
        </ul>
        <h2>Outputs</h2>
        <ul>
          {outputs.map((output) => (
            <li key={output.id}>{output.name ?? output.id}</li>
          ))}
        </ul>
        <h2>Last MIDI</h2>
        <p>{lastMidi}</p>
      </section>
    </main>
  );
}
