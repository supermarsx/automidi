import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen, waitFor, cleanup } from '@testing-library/react';
import MacroImportModal from '../MacroImportModal';
import { renderWithStore, resetStores } from './testUtils';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';

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

  it('imports macros, remapping IDs and appending to store', async () => {
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

  it('shows an error toast for invalid JSON', async () => {
    const user = userEvent.setup();
    mockFileReader('invalid');

    const { container } = renderWithStore(
      <MacroImportModal onClose={() => {}} />,
    );
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['invalid'], 'macros.json', {
      type: 'application/json',
    });
    await user.upload(input, file);

    expect(useToastStore.getState().toasts[0]?.message).toBe(
      'Failed to parse file',
    );
    expect(useStore.getState().macros).toHaveLength(0);
  });

  it('shows an error toast when required fields are missing', async () => {
    const user = userEvent.setup();
    const toImport = [{ id: '1' }];
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

    expect(useToastStore.getState().toasts[0]?.message).toBe(
      'Failed to parse file',
    );
    expect(useStore.getState().macros).toHaveLength(0);
  });
});
