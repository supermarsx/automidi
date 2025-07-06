import { useMidi } from './useMidi';
import { useStore } from './store';

export default function MidiDevices() {
  const { inputs, outputs } = useMidi();
  const selectedInput = useStore((s) => s.devices.inputId);
  const selectedOutput = useStore((s) => s.devices.outputId);
  const setInputId = useStore((s) => s.setInputId);
  const setOutputId = useStore((s) => s.setOutputId);

  return (
    <div className="retro-panel">
      <h3>◄ MIDI Device Matrix ►</h3>
      <div className="row">
        <div className="col-6">
          <h5 className="text-info">INPUT CHANNELS:</h5>
          <select 
            className="form-select retro-select mb-2"
            value={selectedInput || ''}
            onChange={(e) => setInputId(e.target.value || null)}
          >
            <option value="">SELECT INPUT DEVICE</option>
            {inputs.map((input) => (
              <option key={input.id} value={input.id}>
                {input.name ?? `DEVICE_${input.id}`}
              </option>
            ))}
          </select>
          <div className="device-list">
            {inputs.length === 0 ? (
              <div className="device-item text-warning">NO INPUT DEVICES DETECTED</div>
            ) : (
              inputs.map((input) => (
                <div 
                  key={input.id || input.name} 
                  className={`device-item ${selectedInput == input.id ? 'selected' : ''}`}
                >
                  ► {input.name ?? `DEVICE_${input.id}`}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="col-6">
          <h5 className="text-info">OUTPUT CHANNELS:</h5>
          <select 
            className="form-select retro-select mb-2"
            value={selectedOutput || ''}
            onChange={(e) => setOutputId(e.target.value || null)}
          >
            <option value="">SELECT OUTPUT DEVICE</option>
            {outputs.map((output) => (
              <option key={output.id} value={output.id}>
                {output.name ?? `DEVICE_${output.id}`}
              </option>
            ))}
          </select>
          <div className="device-list">
            {outputs.length === 0 ? (
              <div className="device-item text-warning">NO OUTPUT DEVICES DETECTED</div>
            ) : (
              outputs.map((output) => (
                <div 
                  key={output.id || output.name} 
                  className={`device-item ${selectedOutput == output.id ? 'selected' : ''}`}
                >
                  ► {output.name ?? `DEVICE_${output.id}`}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}