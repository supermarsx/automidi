let sendFn: ((data: unknown) => boolean) | null = null;

export function registerSend(fn: (data: unknown) => boolean) {
  sendFn = fn;
}

export function sendSocketMessage(data: unknown): boolean {
  return sendFn ? sendFn(data) : false;
}
