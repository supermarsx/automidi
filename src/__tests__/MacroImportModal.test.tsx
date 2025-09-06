import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, cleanup } from '@testing-library/react';
import MacroImportModal from '../MacroImportModal';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';

vi.mock('idb-keyval', () => ({
  createStore: () => ({}),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

function mockFileReader(json: string) {
  vi.stubGlobal(
    'FileReader',
    class {
      public onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
      readAsText() {
        this.onload?.({
          target: { result: json },
        } as ProgressEvent<FileReader>);
      }
    },
  );
}

describe('MacroImportModal', () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    cleanup();
  });

  it('appends imported macros', async () => {
    const user = userEvent.setup();
    useStore.setState(
      (s) => ({
        ...s,
        macros: [
          { id: '1', name: 'One', sequence: ['a'], interval: 1, tags: [] },
        ],
      }),
      true,
    );

    const toImport = [
      { id: '2', name: 'Two', sequence: ['b'], interval: 1, tags: [] },
    ];
    const json = JSON.stringify(toImport);
    mockFileReader(json);

    const { container } = renderWithStore(
      <MacroImportModal onClose={() => {}} />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([json], 'macros.json', { type: 'application/json' });
    await user.upload(input, file);
    const button = screen.getByText('IMPORT');
    await waitFor(() => expect(button).not.toBeDisabled());
    await user.click(button);

    const macros = useStore.getState().macros;
    expect(macros).toHaveLength(2);
    expect(macros[0].id).toBe('1');
    expect(macros[1].id).toBe('2');
  });

  it('resolves ID collisions and preserves nextId', async () => {
    const user = userEvent.setup();
    useStore.setState(
      (s) => ({
        ...s,
        macros: [
          { id: '1', name: 'Existing', sequence: ['x'], interval: 1, tags: [] },
        ],
      }),
      true,
    );

    const toImport = [
      { id: '1', name: 'ImportOne', sequence: ['a'], interval: 1, tags: [] },
      {
        id: '2',
        name: 'ImportTwo',
        sequence: ['b'],
        interval: 1,
        tags: [],
        nextId: '1',
      },
    ];
    const json = JSON.stringify(toImport);
    mockFileReader(json);

    const { container } = renderWithStore(
      <MacroImportModal onClose={() => {}} />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([json], 'macros.json', { type: 'application/json' });
    await user.upload(input, file);
    const button = screen.getByText('IMPORT');
    await waitFor(() => expect(button).not.toBeDisabled());
    await user.click(button);

    const macros = useStore.getState().macros;
    expect(macros).toHaveLength(3);
    const importedOne = macros.find((m) => m.name === 'ImportOne')!;
    const importedTwo = macros.find((m) => m.name === 'ImportTwo')!;
    expect(importedOne.id).not.toBe('1');
    expect(importedTwo.id).toBe('2');
    expect(importedTwo.nextId).toBe(importedOne.id);
  });
});
