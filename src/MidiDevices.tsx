import { useMidi } from './useMidi';
import './MidiDevices.css';

export default function MidiDevices() {
  const { inputs, outputs } = useMidi();

  return (
    <div className="midi-devices">
      <h2>MIDI Devices</h2>
      <div className="device-lists">
        <div>
          <h3>Inputs</h3>
          <ul>
            {inputs.map((input) => (
              <li key={input.id || input.name}>{input.name ?? input.id}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Outputs</h3>
          <ul>
            {outputs.map((output) => (
              <li key={output.id || output.name}>{output.name ?? output.id}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
