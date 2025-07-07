import { useState } from 'react';
import { useMidi } from './useMidi';
import { useStore } from './store';
import { useToastStore } from './toastStore';
import LAUNCHPAD_COLORS from './launchpadColors';
import {
  enterProgrammerMode,
  exitProgrammerMode,
  setBrightness,
  setSleepMode,
  clearAllLeds,
  noteOn,
  cc,
  scrollText,
  setLayout,
  setDAWMode,
  ledLighting,
  setLedFlashing,
  setLedPulsing,
  CHANNEL_STATIC,
  midiClock,
} from './midiMessages';

export default function LaunchpadControls() {
  const { send } = useMidi();
  const padColours = useStore((s) => s.padColours);
  const padChannels = useStore((s) => s.padChannels);
  const setPadColours = useStore((s) => s.setPadColours);
  const setPadChannels = useStore((s) => s.setPadChannels);
  const clockBytes = useStore((s) => s.settings.clock ?? [0xf8]);
  const addToast = useToastStore((s) => s.addToast);
  const notify = (ok: boolean, action: string) => {
    addToast(
      ok ? `${action} sent` : `${action} failed`,
      ok ? 'success' : 'error',
    );
  };
  const [brightness, setBrightnessValue] = useState(127);
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const [scrollTextValue, setScrollTextValue] = useState('HELLO WORLD');
  const [layout, setLayoutValue] = useState(0);
  const [dawBank, setDawBank] = useState(0);
  const clearBeforeLoad = useStore((s) => s.settings.clearBeforeLoad);

  const handleEnterProgrammer = () => {
    notify(send(enterProgrammerMode()), 'Programmer mode');
  };

  const handleExitProgrammer = () => {
    notify(send(exitProgrammerMode()), 'Live mode');
  };

  const handleSetBrightness = () => {
    notify(send(setBrightness(brightness)), 'Brightness');
  };

  const handleSetSleep = () => {
    notify(send(setSleepMode(sleepEnabled)), 'Sleep mode');
  };

  const handleClearAll = () => {
    notify(send(clearAllLeds()), 'Clear all');
  };

  const handleScrollText = () => {
    notify(send(scrollText(scrollTextValue, false, 7)), 'Scroll text');
  };

  const handleSetLayout = () => {
    notify(send(setLayout(layout)), 'Layout');
  };

  const handleSetDAW = () => {
    notify(send(setDAWMode(dawBank)), 'DAW mode');
  };

  const handleClearConfig = () => {
    setPadColours({});
    setPadChannels({});
  };

  const handleLoadToLaunchpad = () => {
    let ok = true;
    if (clearBeforeLoad) {
      ok = send(clearAllLeds());
    }
    ok = send(enterProgrammerMode()) && ok;
    for (const [id, hex] of Object.entries(padColours)) {
      const color = LAUNCHPAD_COLORS.find((c) => c.color === hex)?.value;
      if (color === undefined) continue;
      const channel = padChannels[id] || CHANNEL_STATIC;
      if (id.startsWith('n-')) {
        const note = Number(id.slice(2));
        if (!Number.isNaN(note)) ok = send(noteOn(note, color, channel)) && ok;
      } else if (id.startsWith('cc-')) {
        const num = Number(id.slice(3));
        if (!Number.isNaN(num)) ok = send(cc(num, color, channel)) && ok;
      }
    }
    notify(ok, 'Load to Launchpad');
  };

  const testRainbow = () => {
    const colors = [
      { id: 11, red: 127, green: 0, blue: 0 }, // Red
      { id: 12, red: 127, green: 64, blue: 0 }, // Orange
      { id: 13, red: 127, green: 127, blue: 0 }, // Yellow
      { id: 14, red: 0, green: 127, blue: 0 }, // Green
      { id: 15, red: 0, green: 64, blue: 127 }, // Blue
      { id: 16, red: 64, green: 0, blue: 127 }, // Indigo
      { id: 17, red: 127, green: 0, blue: 127 }, // Violet
      { id: 18, red: 127, green: 127, blue: 127 }, // White
    ];
    send(ledLighting(colors));
  };

  const testFlashing = () => {
    // Test flashing LEDs
    for (let i = 11; i <= 18; i++) {
      send(setLedFlashing(i, 3)); // Red flashing
    }
  };

  const testPulsing = () => {
    // Test pulsing LEDs
    for (let i = 21; i <= 28; i++) {
      send(setLedPulsing(i, 51)); // Green pulsing
    }
  };

  const handleSendClock = () => {
    const bytes = clockBytes.length ? clockBytes : midiClock();
    notify(send(bytes), 'Clock');
  };

  return (
    <div className="retro-panel">
      <h3>◄ Launchpad Toolbox Matrix ►</h3>

      <div className="row mb-3">
        <div className="col-md-4">
          <h5 className="text-info">MODE CONTROL:</h5>
          <button
            className="retro-button me-2 mb-2"
            onClick={handleEnterProgrammer}
          >
            PROGRAMMER MODE
          </button>
          <button
            className="retro-button me-2 mb-2"
            onClick={handleExitProgrammer}
          >
            LIVE MODE
          </button>
          <div className="mb-2">
            <label className="form-label text-info">LAYOUT:</label>
            <div className="d-flex align-items-center">
              <select
                className="form-select retro-select me-2"
                value={layout}
                onChange={(e) => setLayoutValue(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                <option value={0}>Session</option>
                <option value={1}>Note</option>
                <option value={2}>Custom</option>
                <option value={3}>DAW Faders</option>
                <option value={4}>Programmer</option>
              </select>
              <button className="retro-button btn-sm" onClick={handleSetLayout}>
                SET
              </button>
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label text-info">DAW BANK:</label>
            <div className="d-flex align-items-center">
              <input
                type="number"
                className="form-control retro-input me-2"
                style={{ width: '80px' }}
                min="0"
                max="7"
                value={dawBank}
                onChange={(e) => setDawBank(Number(e.target.value))}
              />
              <button className="retro-button btn-sm" onClick={handleSetDAW}>
                SET
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <h5 className="text-info">LED CONTROL:</h5>
          <div className="mb-3">
            <label className="form-label text-info">BRIGHTNESS:</label>
            <div className="d-flex align-items-center">
              <input
                type="range"
                className="form-range me-2"
                min="0"
                max="127"
                value={brightness}
                onChange={(e) => setBrightnessValue(Number(e.target.value))}
              />
              <span className="text-info me-2">{brightness}</span>
              <button
                className="retro-button btn-sm"
                onClick={handleSetBrightness}
              >
                SET
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label className="form-check-label text-info me-2">
              SLEEP MODE:
            </label>
            <input
              type="checkbox"
              className="form-check-input me-2"
              checked={sleepEnabled}
              onChange={(e) => setSleepEnabled(e.target.checked)}
            />
            <button className="retro-button btn-sm" onClick={handleSetSleep}>
              APPLY
            </button>
          </div>
          <button className="retro-button me-2 mb-2" onClick={handleClearAll}>
            CLEAR ALL
          </button>
          <button
            className="retro-button me-2 mb-2"
            onClick={handleClearConfig}
          >
            CLEAR CONFIG
          </button>
          <button className="retro-button mb-2" onClick={handleLoadToLaunchpad}>
            LOAD INTO LAUNCHPAD
          </button>
        </div>

        <div className="col-md-4">
          <h5 className="text-info">TEXT DISPLAY:</h5>
          <div className="mb-3">
            <label className="form-label text-info">MESSAGE:</label>
            <div className="d-flex">
              <input
                type="text"
                className="form-control retro-input me-2"
                value={scrollTextValue}
                onChange={(e) => setScrollTextValue(e.target.value)}
                maxLength={32}
              />
              <button
                className="retro-button btn-sm"
                onClick={handleScrollText}
              >
                SCROLL
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <h5 className="text-info">LED EFFECTS TEST:</h5>
          <button className="retro-button me-2" onClick={testRainbow}>
            RGB RAINBOW
          </button>
          <button className="retro-button me-2" onClick={testFlashing}>
            FLASH TEST
          </button>
          <button className="retro-button me-2" onClick={testPulsing}>
            PULSE TEST
          </button>
          <button className="retro-button" onClick={handleSendClock}>
            SEND CLOCK
          </button>
        </div>
      </div>
    </div>
  );
}
