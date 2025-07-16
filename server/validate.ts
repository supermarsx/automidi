export function isValidCmd(cmd: string, allowedCmds: string[]): boolean {
  if (typeof cmd !== 'string' || !cmd.trim()) return false;
  if (/[\n\r;&|<>`$]/.test(cmd)) return false;
  const match = cmd.trim().match(/^"([^"]+)"|([^\s]+)/);
  const base = match ? match[1] || match[2] : '';
  return Array.isArray(allowedCmds) && allowedCmds.includes(base);
}
