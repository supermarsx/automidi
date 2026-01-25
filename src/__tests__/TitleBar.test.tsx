import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import TitleBar from '../TitleBar';

// Mock Tauri API
const mockMinimize = vi.fn().mockResolvedValue(undefined);
const mockToggleMaximize = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);

const mockGetCurrentWindow = vi.fn(() => ({
  minimize: mockMinimize,
  toggleMaximize: mockToggleMaximize,
  close: mockClose,
}));

// Setup global Tauri mock
beforeEach(() => {
  vi.clearAllMocks();
  
  // Mock window.__TAURI__
  (global as any).window = {
    __TAURI__: {
      window: {
        getCurrentWindow: mockGetCurrentWindow,
      },
    },
  };
});

afterEach(() => {
  cleanup();
});

describe('TitleBar', () => {
  it('renders title bar with logo and controls', () => {
    render(<TitleBar />);
    
    expect(screen.getByText(/AutoMIDI v2.0/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /−/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /□/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /✕/i })).toBeInTheDocument();
  });

  it('calls minimize when minimize button is clicked', async () => {
    render(<TitleBar />);
    
    const minimizeButton = screen.getByRole('button', { name: /−/i });
    fireEvent.click(minimizeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockGetCurrentWindow).toHaveBeenCalled();
    expect(mockMinimize).toHaveBeenCalled();
  });

  it('calls toggleMaximize when maximize button is clicked', async () => {
    render(<TitleBar />);
    
    const maximizeButton = screen.getByRole('button', { name: /□/i });
    fireEvent.click(maximizeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockGetCurrentWindow).toHaveBeenCalled();
    expect(mockToggleMaximize).toHaveBeenCalled();
  });

  it('calls close when close button is clicked', async () => {
    render(<TitleBar />);
    
    const closeButton = screen.getByRole('button', { name: /✕/i });
    fireEvent.click(closeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(mockGetCurrentWindow).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it('handles missing Tauri API gracefully', async () => {
    // Remove Tauri API
    delete (global as any).window.__TAURI__;
    
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<TitleBar />);
    
    const minimizeButton = screen.getByRole('button', { name: /−/i });
    fireEvent.click(minimizeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleWarn).toHaveBeenCalledWith('[TitleBar] Tauri API not available');
    expect(mockMinimize).not.toHaveBeenCalled();
    
    consoleWarn.mockRestore();
  });

  it('handles minimize errors', async () => {
    mockMinimize.mockRejectedValueOnce(new Error('Minimize failed'));
    
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TitleBar />);
    
    const minimizeButton = screen.getByRole('button', { name: /−/i });
    fireEvent.click(minimizeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleError).toHaveBeenCalledWith(
      '[TitleBar] Minimize failed:',
      expect.any(Error)
    );
    
    consoleError.mockRestore();
  });

  it('handles maximize errors', async () => {
    mockToggleMaximize.mockRejectedValueOnce(new Error('Maximize failed'));
    
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TitleBar />);
    
    const maximizeButton = screen.getByRole('button', { name: /□/i });
    fireEvent.click(maximizeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleError).toHaveBeenCalledWith(
      '[TitleBar] Maximize failed:',
      expect.any(Error)
    );
    
    consoleError.mockRestore();
  });

  it('handles close errors', async () => {
    mockClose.mockRejectedValueOnce(new Error('Close failed'));
    
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TitleBar />);
    
    const closeButton = screen.getByRole('button', { name: /✕/i });
    fireEvent.click(closeButton);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(consoleError).toHaveBeenCalledWith(
      '[TitleBar] Close failed:',
      expect.any(Error)
    );
    
    consoleError.mockRestore();
  });

  it('prevents event propagation on button clicks', async () => {
    render(<TitleBar />);
    
    const minimizeButton = screen.getByRole('button', { name: /−/i });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const stopPropagation = vi.spyOn(event, 'stopPropagation');
    const preventDefault = vi.spyOn(event, 'preventDefault');
    
    minimizeButton.dispatchEvent(event);
    
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });
});
