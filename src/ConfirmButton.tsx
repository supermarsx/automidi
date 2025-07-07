import { useEffect, useState } from 'react';
import { useToastStore } from './toastStore';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onConfirm: () => void;
  confirmDuration?: number;
}

export default function ConfirmButton({
  onConfirm,
  confirmDuration = 2000,
  className = '',
  ...rest
}: Props) {
  const [armed, setArmed] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), confirmDuration);
    return () => clearTimeout(t);
  }, [armed, confirmDuration]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!armed) {
      setArmed(true);
      addToast('Press again to confirm', 'success');
      if (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'granted'
      ) {
        new Notification('Confirm action', { body: 'Press again to confirm' });
      }
    } else {
      setArmed(false);
      onConfirm();
    }
  };

  return (
    <button
      {...rest}
      onClick={handleClick}
      className={`retro-button ${className} ${armed ? 'confirm-armed' : ''}`.trim()}
    >
      {rest.children}
    </button>
  );
}
