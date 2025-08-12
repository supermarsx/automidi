import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { isValidCmd } from './dist/validate.js';

const echoPath = '/usr/bin/echo';
const lsPath = '/usr/bin/ls';
const allowed = [echoPath, lsPath, '/usr/bin/cat'];

describe('isValidCmd', () => {
  it('allows whitelisted commands', () => {
    expect(isValidCmd(`${echoPath} hello`, allowed)).toBe(true);
    expect(isValidCmd(`${lsPath} -la`, allowed)).toBe(true);
  });

  it('handles quoted commands', () => {
    expect(isValidCmd(`"${echoPath}" hello`, allowed)).toBe(true);
    expect(isValidCmd(`'${echoPath}' hello`, allowed)).toBe(true);
    expect(isValidCmd(`"${lsPath}" -la`, allowed)).toBe(true);
    expect(isValidCmd('"/usr/bin/rm" -rf /', allowed)).toBe(false);
  });

  it('handles relative paths safely', () => {
    const rel = path.relative(process.cwd(), echoPath);
    expect(isValidCmd(`${rel} hi`, allowed)).toBe(true);
    expect(isValidCmd(`'${rel}' hi`, allowed)).toBe(true);
  });

  it('handles quoted path with spaces', () => {
    const allowedPath = ['/path/my app'];
    expect(isValidCmd('"/path/my app" --option', allowedPath)).toBe(true);
    expect(isValidCmd("'/path/my app' --option", allowedPath)).toBe(true);
  });

  it('blocks unlisted commands', () => {
    expect(isValidCmd('/bin/ls', ['/usr/bin/echo'])).toBe(false);
  });

  it('blocks commands with dangerous characters', () => {
    expect(isValidCmd(`${echoPath} hello && rm -rf /`, allowed)).toBe(false);
    expect(isValidCmd(`${lsPath}; rm -rf /`, allowed)).toBe(false);
    expect(isValidCmd('/usr/bin/cat foo | grep bar', allowed)).toBe(false);
    expect(isValidCmd(`${echoPath} hi\nrm -rf /`, allowed)).toBe(false);
    expect(isValidCmd(`${echoPath} hi\r`, allowed)).toBe(false);
  });

  it('returns false for non-string or empty input', () => {
    // @ts-expect-error testing invalid type
    expect(isValidCmd(null, allowed)).toBe(false);
    expect(isValidCmd('', allowed)).toBe(false);
  });
});
