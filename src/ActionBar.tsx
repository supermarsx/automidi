import { useMidi } from './useMidi';
import { useStore } from './store';
import { isTauri } from './tauriApi';

export default function ActionBar() {
  const { status, reconnect, pingDelay, inputs, outputs } = useMidi();
  const green = useStore((s) => s.settings.pingGreen);
  const yellow = useStore((s) => s.settings.pingYellow);
  const orange = useStore((s) => s.settings.pingOrange);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);
  const selectedInput = useStore((s) => s.devices.inputId);
  const selectedOutput = useStore((s) => s.devices.outputId);
  const isTauriMode = isTauri();

  const pingClass =
    pingDelay === null
      ? 'none'
      : pingDelay <= green
        ? 'good'
        : pingDelay <= yellow
          ? 'ok'
          : pingDelay <= orange
            ? 'warn'
            : 'bad';

  const inputName = inputs.find(i => i.id === selectedInput)?.name || 'NONE';
  const outputName = outputs.find(o => o.id === selectedOutput)?.name || 'NONE';

  return (
    <div className="status-bar d-flex justify-content-between align-items-center" style={{ padding: '0 10px', marginBottom: '6px', height: '28px' }}>
      <div className="d-flex align-items-center" style={{ gap: '12px', flexWrap: 'nowrap', fontSize: '0.85rem', width: '100%' }}>
        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>SYSTEM STATUS:</span>
        <span className={`connection-status ${status}`}>
          {status.toUpperCase()}
        </span>
        <span className="d-flex align-items-center" style={{ gap: '6px' }}>
          PING:
          <span className={`ping-value ping-${pingClass}`}>
            {!pingEnabled
              ? 'N/A'
              : pingDelay === null
                ? '---'
                : `${pingDelay}ms`}
          </span>
        </span>
        <span>IN: <strong>{inputName}</strong></span>
        <span>OUT: <strong>{outputName}</strong></span>
        {status === 'closed' && !isTauriMode && (
          <button className="retro-button btn-sm" onClick={reconnect} style={{ padding: '0px 8px', fontSize: '0.8rem', marginLeft: '8px', lineHeight: '1.2' }}>
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}
