import { useToastStore } from './toastStore';
import { sendSocketMessage } from './socket';
import { isTauri, invoke } from './tauri';

export interface NotifyOptions {
  message: string;
  title?: string;
}

export async function notify({ message, title }: NotifyOptions) {
  const addToast = useToastStore.getState().addToast;
  
  if (isTauri()) {
    try {
      await invoke('notify', { title, message });
    } catch (error) {
      console.error('Tauri notification failed:', error);
      addToast(message, 'success');
    }
  } else {
    const ok = sendSocketMessage({ type: 'notify', title, message });
    if (!ok) {
      addToast(message, 'success');
    }
  }
}
