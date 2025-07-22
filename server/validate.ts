export function isValidCmd(cmd: string, allowedCmds: string[]): boolean {
  if (typeof cmd !== 'string' || !cmd.trim()) return false;
  if (/[;&|<>`$\r\n]/.test(cmd)) return false;
  const trimmed = cmd.trim();
  const quotedMatch = trimmed.match(/^"([^"\n\r]+)"(?:\s|$)/);
  const base = quotedMatch ? quotedMatch[1] : trimmed.split(/\s+/)[0];
  return Array.isArray(allowedCmds) && allowedCmds.includes(base);
}
