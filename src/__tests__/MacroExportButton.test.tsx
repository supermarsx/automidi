import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import MacroExportButton from '../MacroExportButton';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('MacroExportButton', () => {
  const macros = [
    { id: '1', name: 'One', sequence: ['a'], interval: 10, tags: ['foo'] },
  ];

  beforeEach(() => {
    resetStores();
    useStore.setState((s) => ({ ...s, macros }), true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads macros as JSON', async () => {
    const user = userEvent.setup();
    const originalCreate = document.createElement.bind(document);
    const anchor = originalCreate('a');
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) =>
        tag === 'a' ? anchor : originalCreate(tag, options),
    );
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => {});
    const createObjectURL = vi.fn().mockReturnValue('blob:mock');
    const revokeObjectURL = vi.fn();
    Object.assign(URL as unknown as Record<string, unknown>, {
      createObjectURL,
      revokeObjectURL,
    });
    const stringify = vi.spyOn(JSON, 'stringify');

    renderWithStore(<MacroExportButton />);

    await user.click(screen.getByText('EXPORT'));

    expect(createObjectURL).toHaveBeenCalled();
    expect(stringify).toHaveBeenCalledWith(macros);
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(anchor.download).toBe('macros.json');
    expect(click).toHaveBeenCalled();
  });
});
