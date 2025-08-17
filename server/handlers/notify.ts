import notifier from 'toasted-notifier';
import type { MessageHandler } from './types.js';

const handleNotify: MessageHandler = (_ws, data, _ctx) => {
  const { title = 'Automidi', message } = data;
  void _ctx;
  if (!message) return;
  notifier.notify({ title, message }, (err) => {
    if (err) console.error('Notification error:', err);
  });
};

export { handleNotify };
