import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import MacroExportButton from '../MacroExportButton';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';
import * as tauriFiles from '../tauriFiles';

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
    const saveSpy = vi
      .spyOn(tauriFiles, 'saveJsonFile')
      .mockResolvedValue(true);

    renderWithStore(<MacroExportButton />);

    await user.click(screen.getByText('EXPORT'));

    expect(saveSpy).toHaveBeenCalledWith('macros.json', macros);
  });
});
