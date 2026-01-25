import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { useStore } from '../store';
import { useToastStore } from '../toastStore';

const initialMain = useStore.getState();
const initialToast = useToastStore.getState();

export function resetStores() {
  useStore.setState(initialMain, true);
  useToastStore.setState(initialToast, true);
}

export function renderWithStore(ui: React.ReactElement) {
  return render(ui);
}

export function wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
