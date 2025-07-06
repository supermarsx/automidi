import { useMidi } from './useMidi';

export default function MidiDevices() {
  const { inputs, outputs } = useMidi();

  return (
    <div className="retro-panel">
      <h3>◄ MIDI Device Matrix ►</h3>
      <div className="row">
        <div className="col-6">
          <h5 className="text-info">INPUT CHANNELS:</h5>
          <div className="device-list">
            {inputs.length === 0 ? (
              <div className="device-item text-warning">NO INPUT DEVICES DETECTED</div>
            ) : (
              inputs.map((input) => (
                <div key={input.id || input.name} className="device-item">
                  ► {input.name ?? `DEVICE_${input.id}`}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="col-6">
          <h5 className="text-info">OUTPUT CHANNELS:</h5>
          <div className="device-list">
            {outputs.length === 0 ? (
              <div className="device-item text-warning">NO OUTPUT DEVICES DETECTED</div>
            ) : (
              outputs.map((output) => (
                <div key={output.id || output.name} className="device-item">
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