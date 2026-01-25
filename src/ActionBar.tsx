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
    <div className="status-bar d-flex justify-content-between align-items-center" style={{ padding: '10px 20px', marginBottom: '12px' }}>
      <div className="d-flex align-items-center" style={{ gap: '16px', flexWrap: 'wrap', fontSize: '0.95rem' }}>
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
          <button className="retro-button btn-sm" onClick={reconnect} style={{ padding: '3px 10px', fontSize: '0.85rem', marginLeft: '8px' }}>
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}
