import { useToastStore } from './toastStore';

export function notify(message: string) {
  const addToast = useToastStore.getState().addToast;
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(message);
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then((perm) => {
        if (perm === 'granted') {
          new Notification(message);
        } else {
          addToast(message, 'success');
        }
      });
    } else {
      addToast(message, 'success');
    }
  } else {
    addToast(message, 'success');
  }
}
