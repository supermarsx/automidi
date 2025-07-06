import { useState } from 'react';
import { useMidi } from './useMidi';
import { sysex, ledLighting } from './midiMessages';

export default function LaunchpadControls() {
  const { send } = useMidi();
  const [brightness, setBrightness] = useState(127);
  const [sleepEnabled, setSleepEnabled] = useState(false);

  // Launchpad X specific commands from programmer's reference
  const enterProgrammerMode = () => {
    send([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x0E, 0x01, 0xF7]);
  };

  const exitProgrammerMode = () => {
    send([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0C, 0x0E, 0x00, 0xF7]);
  };

  const setLedBrightness = () => {
    send(sysex(0x08, brightness));
  };

  const enableSleep = () => {
    send(sysex(0x09, sleepEnabled ? 1 : 0));
  };

  const clearAllLeds = () => {
    send(sysex(0x0E, 0x00));
  };

  const testPattern = () => {
    // Create a rainbow pattern
    const colors = [
      { id: 11, red: 127, green: 0, blue: 0 },    // Red
      { id: 12, red: 127, green: 64, blue: 0 },   // Orange
      { id: 13, red: 127, green: 127, blue: 0 },  // Yellow
      { id: 14, red: 0, green: 127, blue: 0 },    // Green
      { id: 15, red: 0, green: 0, blue: 127 },    // Blue
      { id: 16, red: 64, green: 0, blue: 127 },   // Indigo
      { id: 17, red: 127, green: 0, blue: 127 },  // Violet
      { id: 18, red: 127, green: 127, blue: 127 }, // White
    ];
    send(ledLighting(colors));
  };

  const scrollText = () => {
    // Scroll "HELLO" across the display
    const text = "HELLO";
    send(sysex(0x07, 1, 127, 0, 0, ...text.split('').map(c => c.charCodeAt(0))));
  };

  return (
    <div className="retro-panel">
      <h3>◄ Launchpad X Controls ►</h3>
      <div className="row">
        <div className="col-md-6">
          <h5 className="text-info">MODE CONTROL:</h5>
          <button className="retro-button me-2 mb-2" onClick={enterProgrammerMode}>
            PROGRAMMER MODE
          </button>
          <button className="retro-button me-2 mb-2" onClick={exitProgrammerMode}>
            LIVE MODE
          </button>
          <button className="retro-button me-2 mb-2" onClick={clearAllLeds}>
            CLEAR ALL
          </button>
        </div>
        <div className="col-md-6">
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
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
              <button className="retro-button btn-sm" onClick={setLedBrightness}>
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
            <button className="retro-button btn-sm" onClick={enableSleep}>
              APPLY
            </button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <h5 className="text-info">DEMO FUNCTIONS:</h5>
          <button className="retro-button me-2" onClick={testPattern}>
            RAINBOW TEST
          </button>
          <button className="retro-button me-2" onClick={scrollText}>
            SCROLL TEXT
          </button>
        </div>
      </div>
    </div>
  );
}