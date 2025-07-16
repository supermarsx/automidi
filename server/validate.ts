export function isValidCmd(cmd: string, allowedCmds: string[]): boolean {
  if (typeof cmd !== 'string' || !cmd.trim()) return false;
  if (/[;&|<>`$]/.test(cmd)) return false;
  const cleaned = cmd.trim().replace(/^"(.*)"$/, '$1');
  const base = cleaned.split(/\s+/)[0];
  return Array.isArray(allowedCmds) && allowedCmds.includes(base);
}
