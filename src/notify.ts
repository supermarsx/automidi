import { useToastStore } from './toastStore';
import { useStore } from './store';

export async function notify(message: string) {
  const addToast = useToastStore.getState().addToast;
  const { host, port, apiKey } = useStore.getState().settings;
  try {
    const res = await fetch(`http://${host}:${port}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Request failed');
  } catch (err) {
    console.error('OS notification failed:', err);
    addToast(message, 'success');
  }
}
