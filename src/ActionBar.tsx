import { useMidi } from './useMidi';
import { useStore } from './store';

export default function ActionBar() {
  const { status, reconnect, launchpadDetected, pingDelay } = useMidi();
  const pingThresholds = useStore((s) => s.settings.pingThresholds);

  const getPingClass = () => {
    if (pingDelay === null) return 'blue';
    if (pingDelay <= pingThresholds.green) return 'green';
    if (pingDelay <= pingThresholds.yellow) return 'yellow';
    if (pingDelay <= pingThresholds.orange) return 'orange';
    return 'red';
  };

  return (
    <div className="status-bar d-flex justify-content-between align-items-center">
      <div className="d-flex align-items-center">
        <span className="text-warning me-3">SYSTEM STATUS:</span>
        <span className={`connection-status ${status} me-3`}>
          SOCKET: {status.toUpperCase()}
        </span>
        <span className="text-info me-3 d-flex align-items-center">
          PING:
          <span className={`ping-value ms-2 ${getPingClass()}`}>
            {pingDelay === null ? '---' : `${pingDelay}ms`}
          </span>
        </span>
        {launchpadDetected && (
          <span className="text-success me-3">► LAUNCHPAD X DETECTED</span>
        )}
        {status === 'closed' && (
          <button className="retro-button btn-sm me-2" onClick={reconnect}>
            RECONNECT
          </button>
        )}
      </div>
    </div>
  );
}
