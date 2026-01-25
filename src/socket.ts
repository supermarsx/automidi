let sendFn: ((data: unknown) => boolean | Promise<boolean>) | null = null;

export function registerSend(fn: (data: unknown) => boolean | Promise<boolean>) {
  sendFn = fn;
}

export function sendSocketMessage(data: unknown): boolean | Promise<boolean> {
  return sendFn ? sendFn(data) : false;
}
