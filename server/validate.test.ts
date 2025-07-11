import { describe, it, expect } from 'vitest';
import validate from './validate.js';

const { isValidCmd } = validate;

const allowed = ['echo', 'ls', 'cat'];

describe('isValidCmd', () => {
  it('allows whitelisted commands', () => {
    expect(isValidCmd('echo hello', allowed)).toBe(true);
    expect(isValidCmd('ls -la', allowed)).toBe(true);
  });

  it('blocks unlisted commands', () => {
    expect(isValidCmd('rm -rf /', allowed)).toBe(false);
  });

  it('blocks commands with dangerous characters', () => {
    expect(isValidCmd('echo hello && rm -rf /', allowed)).toBe(false);
    expect(isValidCmd('ls; rm -rf /', allowed)).toBe(false);
    expect(isValidCmd('cat foo | grep bar', allowed)).toBe(false);
  });

  it('returns false for non-string or empty input', () => {
    // @ts-expect-error testing invalid type
    expect(isValidCmd(null, allowed)).toBe(false);
    expect(isValidCmd('', allowed)).toBe(false);
  });
});
