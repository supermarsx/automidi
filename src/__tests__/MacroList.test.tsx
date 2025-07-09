import { describe, it, expect, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import MacroList from '../MacroList';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('MacroList', () => {
  beforeEach(() => {
    resetStores();
    useStore.setState(
      (s) => ({
        ...s,
        macros: [
          {
            id: '1',
            name: 'One',
            sequence: ['a'],
            interval: 10,
            tags: ['foo'],
          },
          {
            id: '2',
            name: 'Two',
            sequence: ['b'],
            interval: 10,
            tags: ['bar'],
          },
        ],
      }),
      true,
    );
  });

  it('filters by tag and deletes a macro', async () => {
    renderWithStore(<MacroList />);
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('filter tag'), 'foo');
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.queryByText('Two')).not.toBeInTheDocument();

    await user.click(screen.getByText('DEL'));
    expect(useStore.getState().macros).toHaveLength(1);
  });
});
