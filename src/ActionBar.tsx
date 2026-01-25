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
    <div className="status-bar d-flex justify-content-between align-items-center" style={{ padding: '8px 16px' }}>
      <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: '0.95rem' }}>
        <span className={`connection-status ${status}`}>
          {status.toUpperCase()}
        </span>
        <span className="d-flex align-items-center">
          PING:
          <span className={`ping-value ms-1 ping-${pingClass}`}>
            {!pingEnabled
              ? 'N/A'
              : pingDelay === null
                ? '---'
                : `${pingDelay}ms`}
          </span>
        </span>
        <span>IN: {inputName}</span>
        <span>OUT: {outputName}</span>
        {status === 'closed' && !isTauriMode && (
          <button className="retro-button btn-sm" onClick={reconnect} style={{ padding: '4px 12px', fontSize: '0.9rem' }}>
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}
