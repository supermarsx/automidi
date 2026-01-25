import { useToastStore } from './toastStore';
import { sendSocketMessage } from './socket';

export interface NotifyOptions {
  message: string;
  title?: string;
}

export function notify({ message, title }: NotifyOptions) {
  const addToast = useToastStore.getState().addToast;
  const ok = sendSocketMessage({ type: 'notify', title, message });
  if (!ok) {
    addToast(message, 'success');
  }
}
