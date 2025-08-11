import { useRef, useCallback, useState, useEffect } from 'react';

const CLEAR_MESSAGE_DELAY_MS = 1000;

interface UseAutoClearOptions {
  onClearSelection: () => void;
  onClearProgress: () => void;
  timeoutMs?: number;
}

interface UseAutoClearReturn {
  autoClearMessage: string;
  scheduleAutoClear: () => void;
  cancelAutoClear: () => void;
}

/**
 * Custom hook for managing automatic clearing of selections with accessibility announcements
 */
export const useAutoClear = ({
  onClearSelection,
  onClearProgress,
  timeoutMs = 3000,
}: UseAutoClearOptions): UseAutoClearReturn => {
  const [autoClearMessage, setAutoClearMessage] = useState<string>('');
  const timeoutRef = useRef<number | null>(null);

  const cancelAutoClear = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const scheduleAutoClear = useCallback(() => {
    cancelAutoClear();
    
    const timeoutSeconds = Math.round(timeoutMs / 1000);
    setAutoClearMessage(`Selection will be automatically cleared in ${timeoutSeconds} seconds`);
    
    timeoutRef.current = window.setTimeout(() => {
      onClearSelection();
      onClearProgress();
      setAutoClearMessage('Selection has been automatically cleared');
      timeoutRef.current = null;
      
      // Clear the announcement after a brief delay
      setTimeout(() => setAutoClearMessage(''), CLEAR_MESSAGE_DELAY_MS);
    }, timeoutMs);
  }, [cancelAutoClear, onClearSelection, onClearProgress, timeoutMs]);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return {
    autoClearMessage,
    scheduleAutoClear,
    cancelAutoClear,
  };
};