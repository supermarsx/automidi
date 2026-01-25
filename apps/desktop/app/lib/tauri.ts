export function isTauriRuntime(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI__" in window;
}

export async function pingBackend(ts: number): Promise<number> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<number>("ping", { ts });
}
