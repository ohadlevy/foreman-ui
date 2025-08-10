import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWindowFocus } from '../useWindowFocus';

describe('useWindowFocus', () => {
  const originalHasFocus = document.hasFocus;

  beforeEach(() => {
    document.hasFocus = vi.fn(() => true);
  });

  afterEach(() => {
    document.hasFocus = originalHasFocus;
    vi.clearAllMocks();
  });

  it('should return initial focus state based on document.hasFocus', () => {
    document.hasFocus = vi.fn(() => false);
    const { result } = renderHook(() => useWindowFocus());
    expect(result.current).toBe(false);
  });

  it('should return true when window is focused initially', () => {
    document.hasFocus = vi.fn(() => true);
    const { result } = renderHook(() => useWindowFocus());
    expect(result.current).toBe(true);
  });

  it('should update focus state when window focus changes', () => {
    const { result } = renderHook(() => useWindowFocus());

    // Initially focused
    expect(result.current).toBe(true);

    // Simulate window blur
    act(() => {
      window.dispatchEvent(new window.Event('blur'));
    });
    expect(result.current).toBe(false);

    // Simulate window focus
    act(() => {
      window.dispatchEvent(new window.Event('focus'));
    });
    expect(result.current).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useWindowFocus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('blur', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle multiple focus/blur events correctly', () => {
    const { result } = renderHook(() => useWindowFocus());

    // Multiple blur events
    act(() => {
      window.dispatchEvent(new window.Event('blur'));
      window.dispatchEvent(new window.Event('blur'));
    });
    expect(result.current).toBe(false);

    // Multiple focus events
    act(() => {
      window.dispatchEvent(new window.Event('focus'));
      window.dispatchEvent(new window.Event('focus'));
    });
    expect(result.current).toBe(true);
  });
});