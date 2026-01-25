import { useMidi } from './useMidi';
import { useStore } from './store';
import { isTauri } from './tauriApi';

export default function ActionBar() {
  const { status, reconnect, launchpadDetected, pingDelay } = useMidi();
  const green = useStore((s) => s.settings.pingGreen);
  const yellow = useStore((s) => s.settings.pingYellow);
  const orange = useStore((s) => s.settings.pingOrange);
  const pingEnabled = useStore((s) => s.settings.pingEnabled);
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

  return (
    <div className="status-bar d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <span className="text-warning me-3">SYSTEM STATUS:</span>
        {isTauriMode && (
          <span className="text-success me-3">
            ◆ TAURI DESKTOP MODE
          </span>
        )}
        <span className={`connection-status ${status} me-3`}>
          {isTauriMode ? 'IPC' : 'SOCKET'}: {status.toUpperCase()}
        </span>
        <span className="text-info me-3 d-flex align-items-center">
          PING:
          <span className={`ping-value ms-2 ping-${pingClass}`}>
            {!pingEnabled
              ? 'N/A'
              : pingDelay === null
                ? '---'
                : `${pingDelay}ms`}
          </span>
        </span>
        {launchpadDetected && (
          <span className="text-success me-3">► LAUNCHPAD X DETECTED</span>
        )}
        {status === 'closed' && !isTauriMode && (
          <button className="retro-button btn-sm me-2" onClick={reconnect}>
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}
