import { useToastStore } from './toastStore';
import { sendSocketMessage } from './socket';

export function notify(message: string) {
  const addToast = useToastStore.getState().addToast;
  const ok = sendSocketMessage({ type: 'notify', message });
  if (!ok) {
    addToast(message, 'success');
  }
}
