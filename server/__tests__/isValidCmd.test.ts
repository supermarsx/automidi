import { describe, it, expect } from 'vitest';
import { isValidCmd } from '../dist/validate.js';

describe('isValidCmd rejects tricky inputs', () => {
  const allowed = ['echo', 'app'];

  it('rejects quoted paths not in allow list', () => {
    expect(isValidCmd('"/evil path"', allowed)).toBe(false);
  });

  it('rejects commands with only spaces', () => {
    expect(isValidCmd('   ', allowed)).toBe(false);
  });

  it('rejects unicode lookalike commands', () => {
    expect(isValidCmd('ｅｃｈｏ hi', allowed)).toBe(false);
  });
});
