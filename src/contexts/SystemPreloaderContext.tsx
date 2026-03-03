import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SystemPreloader } from '@/components/ui/preloader';

type WithSystemPreloaderOptions = {
  text?: string;
  subtext?: string;
};

type SystemPreloaderContextType = {
  isVisible: boolean;
  text: string;
  subtext: string;
  showPreloader: (text?: string, subtext?: string) => void;
  hidePreloader: () => void;
  withSystemPreloader: <T>(task: Promise<T>, options?: WithSystemPreloaderOptions) => Promise<T>;
};

const DEFAULT_TEXT = 'Loading system data';
const DEFAULT_SUBTEXT = 'Please wait while we fetch your information';

const SystemPreloaderContext = createContext<SystemPreloaderContextType | undefined>(undefined);

export const SystemPreloaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState(DEFAULT_TEXT);
  const [subtext, setSubtext] = useState(DEFAULT_SUBTEXT);

  const showDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minimumVisibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleSinceRef = useRef<number | null>(null);

  const SHOW_DELAY_MS = 180;
  const MIN_VISIBLE_MS = 320;

  const clearTimers = () => {
    if (showDelayTimerRef.current) {
      clearTimeout(showDelayTimerRef.current);
      showDelayTimerRef.current = null;
    }

    if (minimumVisibleTimerRef.current) {
      clearTimeout(minimumVisibleTimerRef.current);
      minimumVisibleTimerRef.current = null;
    }
  };

  const showPreloader = (nextText?: string, nextSubtext?: string) => {
    if (nextText) setText(nextText);
    if (nextSubtext) setSubtext(nextSubtext);

    clearTimers();
    showDelayTimerRef.current = setTimeout(() => {
      visibleSinceRef.current = Date.now();
      setIsVisible(true);
    }, SHOW_DELAY_MS);
  };

  const hidePreloader = () => {
    clearTimers();

    if (!isVisible) {
      setText(DEFAULT_TEXT);
      setSubtext(DEFAULT_SUBTEXT);
      return;
    }

    const elapsed = visibleSinceRef.current ? Date.now() - visibleSinceRef.current : MIN_VISIBLE_MS;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    minimumVisibleTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      visibleSinceRef.current = null;
      setText(DEFAULT_TEXT);
      setSubtext(DEFAULT_SUBTEXT);
    }, remaining);
  };

  const withSystemPreloader = async <T,>(
    task: Promise<T>,
    options?: WithSystemPreloaderOptions,
  ): Promise<T> => {
    showPreloader(options?.text, options?.subtext);
    try {
      return await task;
    } finally {
      hidePreloader();
    }
  };

  useEffect(() => {
    if (pendingRequests > 0) {
      showPreloader();
    } else {
      hidePreloader();
    }
  }, [pendingRequests]);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      setPendingRequests((count) => count + 1);
      try {
        return await originalFetch.call(window, input, init);
      } finally {
        setPendingRequests((count) => Math.max(0, count - 1));
      }
    };

    return () => {
      window.fetch = originalFetch;
      clearTimers();
    };
  }, []);

  const contextValue = useMemo<SystemPreloaderContextType>(() => ({
    isVisible,
    text,
    subtext,
    showPreloader,
    hidePreloader,
    withSystemPreloader,
  }), [isVisible, text, subtext]);

  return (
    <SystemPreloaderContext.Provider value={contextValue}>
      {children}
      <SystemPreloader visible={isVisible} text={text} subtext={subtext} />
    </SystemPreloaderContext.Provider>
  );
};

export const useSystemPreloader = (): SystemPreloaderContextType => {
  const context = useContext(SystemPreloaderContext);
  if (!context) {
    throw new Error('useSystemPreloader must be used within SystemPreloaderProvider');
  }
  return context;
};

export const useOptionalSystemPreloader = (): SystemPreloaderContextType | null => {
  return useContext(SystemPreloaderContext) ?? null;
};
