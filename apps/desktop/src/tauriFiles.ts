export function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export async function saveJsonFile(
  defaultName: string,
  data: unknown,
): Promise<boolean> {
  const payload = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  if (isTauriRuntime()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!path) return false;
    await writeTextFile(path, payload);
    return true;
  }

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function openJsonFile(): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const { readTextFile } = await import('@tauri-apps/plugin-fs');
  const path = await open({
    multiple: false,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!path || Array.isArray(path)) return null;
  return readTextFile(path);
}
