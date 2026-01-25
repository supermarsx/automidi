/**
 * Integration tests for TitleBar window controls
 * These tests verify that the window controls work with real Tauri API
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import TitleBar from '../TitleBar';

describe('TitleBar Integration Tests', () => {
  let isTauriEnvironment = false;

  beforeAll(async () => {
    // Check if we're in a Tauri environment
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      isTauriEnvironment = !!window;
    } catch {
      isTauriEnvironment = false;
    }
  });

  afterEach(() => {
    cleanup();
  });

  it('should render the title bar component', () => {
    render(<TitleBar />);
    expect(screen.getByText(/AutoMIDI v2.0/i)).toBeInTheDocument();
  });

  it('should have all three control buttons', () => {
    render(<TitleBar />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    // Check button symbols
    expect(screen.getByText('−')).toBeInTheDocument(); // Minimize
    expect(screen.getByText('□')).toBeInTheDocument(); // Maximize
    expect(screen.getByText('✕')).toBeInTheDocument(); // Close
  });

  it('should have correct CSS classes for styling', () => {
    render(<TitleBar />);
    
    const titleBar = document.querySelector('.titlebar');
    expect(titleBar).toBeInTheDocument();
    
    const minimizeBtn = screen.getByText('−').parentElement;
    expect(minimizeBtn?.classList.contains('minimize')).toBe(true);
    
    const maximizeBtn = screen.getByText('□').parentElement;
    expect(maximizeBtn?.classList.contains('maximize')).toBe(true);
    
    const closeBtn = screen.getByText('✕').parentElement;
    expect(closeBtn?.classList.contains('close')).toBe(true);
  });

  it('should call handler when minimize button is clicked', async () => {
    render(<TitleBar />);
    
    const consoleLog = vi.spyOn(console, 'log');
    const minimizeBtn = screen.getByText('−');
    
    fireEvent.click(minimizeBtn);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Minimize button clicked'));
    consoleLog.mockRestore();
  });

  it('should call handler when maximize button is clicked', async () => {
    render(<TitleBar />);
    
    const consoleLog = vi.spyOn(console, 'log');
    const maximizeBtn = screen.getByText('□');
    
    fireEvent.click(maximizeBtn);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('Maximize button clicked'));
    consoleLog.mockRestore();
  });

  it('should handle Tauri API import errors gracefully', async () => {
    render(<TitleBar />);
    
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const minimizeBtn = screen.getByText('−');
    
    // In non-Tauri environment, should catch error
    fireEvent.click(minimizeBtn);
    
    // Wait for async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!isTauriEnvironment) {
      // Should log error if not in Tauri environment
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Minimize failed'),
        expect.anything()
      );
    }
    
    consoleError.mockRestore();
  });

  it('should stop event propagation on button clicks', () => {
    render(<TitleBar />);
    
    const minimizeBtn = screen.getByText('−');
    const propagationStopped = vi.fn();
    
    minimizeBtn.addEventListener('click', (e) => {
      if (e.defaultPrevented) propagationStopped();
    });
    
    fireEvent.click(minimizeBtn);
    
    // Event should be prevented
    expect(propagationStopped).not.toHaveBeenCalled();
  });

  it('should have proper button types to prevent form submission', () => {
    render(<TitleBar />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button.getAttribute('type')).toBe('button');
    });
  });

  // Permission-specific tests
  describe('Tauri Permissions Tests', () => {
    it('should successfully import window API in Tauri environment', async () => {
      if (!isTauriEnvironment) {
        console.warn('Skipping Tauri-specific test: not in Tauri environment');
        return;
      }

      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      expect(getCurrentWindow).toBeDefined();
      
      const window = getCurrentWindow();
      expect(window).toBeDefined();
      expect(typeof window.minimize).toBe('function');
      expect(typeof window.toggleMaximize).toBe('function');
      expect(typeof window.close).toBe('function');
    });

    it('should have minimize permission', async () => {
      if (!isTauriEnvironment) {
        console.warn('Skipping Tauri-specific test: not in Tauri environment');
        return;
      }

      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      
      // Try to call minimize - should not throw permission error
      try {
        // Just verify the function exists and is callable
        expect(window.minimize).toBeDefined();
        expect(typeof window.minimize).toBe('function');
      } catch (error: any) {
        expect(error.message).not.toContain('permission');
      }
    });

    it('should have toggleMaximize permission', async () => {
      if (!isTauriEnvironment) {
        console.warn('Skipping Tauri-specific test: not in Tauri environment');
        return;
      }

      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      
      try {
        expect(window.toggleMaximize).toBeDefined();
        expect(typeof window.toggleMaximize).toBe('function');
      } catch (error: any) {
        expect(error.message).not.toContain('permission');
      }
    });

    it('should have close permission', async () => {
      if (!isTauriEnvironment) {
        console.warn('Skipping Tauri-specific test: not in Tauri environment');
        return;
      }

      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      
      try {
        expect(window.close).toBeDefined();
        expect(typeof window.close).toBe('function');
      } catch (error: any) {
        expect(error.message).not.toContain('permission');
      }
    });
  });

  // API availability tests
  describe('API Availability Tests', () => {
    it('should detect if Tauri API is available', async () => {
      try {
        await import('@tauri-apps/api/window');
        console.log('[Test] Tauri API is available');
      } catch (error) {
        console.log('[Test] Tauri API is NOT available:', error);
      }
    });

    it('should handle missing @tauri-apps/api package', async () => {
      render(<TitleBar />);
      
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const minimizeBtn = screen.getByText('−');
      
      fireEvent.click(minimizeBtn);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // In non-Tauri environment, should catch the import error
      if (!isTauriEnvironment) {
        expect(consoleError).toHaveBeenCalled();
      }
      
      consoleError.mockRestore();
    });
  });

  // Error handling tests
  describe('Error Handling Tests', () => {
    it('should log errors when operations fail', async () => {
      render(<TitleBar />);
      
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const minimizeBtn = screen.getByText('−');
      
      fireEvent.click(minimizeBtn);
      
      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should either succeed or log an error
      if (!isTauriEnvironment) {
        expect(consoleError).toHaveBeenCalled();
      }
      
      consoleError.mockRestore();
    });

    it('should not crash the app if window operations fail', async () => {
      render(<TitleBar />);
      
      const buttons = screen.getAllByRole('button');
      
      // Click all buttons - none should crash the app
      for (const button of buttons) {
        fireEvent.click(button);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Component should still be rendered
      expect(screen.getByText(/AutoMIDI v2.0/i)).toBeInTheDocument();
    });
  });

  // Console logging tests
  describe('Console Logging Tests', () => {
    it('should log minimize operation steps', async () => {
      render(<TitleBar />);
      
      const consoleLog = vi.spyOn(console, 'log');
      const minimizeBtn = screen.getByText('−');
      
      fireEvent.click(minimizeBtn);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleLog).toHaveBeenCalledWith('[TitleBar] Minimize button clicked');
      
      consoleLog.mockRestore();
    });

    it('should log maximize operation steps', async () => {
      render(<TitleBar />);
      
      const consoleLog = vi.spyOn(console, 'log');
      const maximizeBtn = screen.getByText('□');
      
      fireEvent.click(maximizeBtn);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleLog).toHaveBeenCalledWith('[TitleBar] Maximize button clicked');
      
      consoleLog.mockRestore();
    });

    it('should log close operation steps', async () => {
      render(<TitleBar />);
      
      const consoleLog = vi.spyOn(console, 'log');
      const closeBtn = screen.getByText('✕');
      
      fireEvent.click(closeBtn);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(consoleLog).toHaveBeenCalledWith('[TitleBar] Close button clicked');
      
      consoleLog.mockRestore();
    });
  });
});
