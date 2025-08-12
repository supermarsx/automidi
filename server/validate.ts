import path from 'node:path';

export function parseCmd(cmd: string): { file: string; args: string[] } | null {
  const parts =
    cmd
      .match(/(?:[^\s'"]+|'[^']*'|"[^"]*")+/g)
      ?.map((p) => p.replace(/^['"]|['"]$/g, '')) ?? [];
  if (parts.length === 0) return null;
  const [file, ...args] = parts;
  return { file, args };
}

export function isValidCmd(cmd: string, allowedCmds: string[]): boolean {
  if (typeof cmd !== 'string' || !cmd.trim()) return false;
  if (/[;&|<>`$\r\n]/.test(cmd)) return false;
  const parsed = parseCmd(cmd.trim());
  if (!parsed) return false;
  const resolved = path.resolve(parsed.file);
  return (
    Array.isArray(allowedCmds) &&
    allowedCmds.some((allowed) => path.resolve(allowed) === resolved)
  );
}
