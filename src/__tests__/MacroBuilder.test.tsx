import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import MacroBuilder from '../MacroBuilder';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('MacroBuilder', () => {
  beforeEach(() => {
    resetStores();
  });

  it('saves a new macro and shows a toast', async () => {
    renderWithStore(<MacroBuilder />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Macro name'), 'My Macro');
    await user.type(screen.getByPlaceholderText('Key sequence'), 'A B');
    await user.click(screen.getByText('SAVE'));

    const macros = useStore.getState().macros;
    expect(macros).toHaveLength(1);
    expect(macros[0].name).toBe('My Macro');
    expect(useToastStore.getState().toasts[0].message).toBe('Macro saved');
  });
});
