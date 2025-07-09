function isValidCmd(cmd, allowedCmds) {
  if (typeof cmd !== 'string' || !cmd.trim()) return false;
  if (/[;&|<>`$]/.test(cmd)) return false;
  const base = cmd.trim().split(/\s+/)[0];
  return Array.isArray(allowedCmds) && allowedCmds.includes(base);
}

module.exports = { isValidCmd };
