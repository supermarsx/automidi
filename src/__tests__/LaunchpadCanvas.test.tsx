import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import LaunchpadCanvas from '../LaunchpadCanvas';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('LaunchpadCanvas', () => {
  beforeEach(() => {
    resetStores();
  });

  it('opens pad options and updates label', async () => {
    renderWithStore(<LaunchpadCanvas />);
    const user = userEvent.setup();

    await user.click(screen.getByTitle('Note 81'));
    expect(screen.getByText('PAD n-81')).toBeInTheDocument();

    const labelInput = screen.getByPlaceholderText('Label');
    await user.type(labelInput, 'Hi');
    expect(useStore.getState().padLabels['n-81']).toBe('Hi');

    await user.click(screen.getByText('CLOSE'));
    expect(screen.queryByText('PAD n-81')).not.toBeInTheDocument();
  });
});
