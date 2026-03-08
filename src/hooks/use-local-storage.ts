'use client';

import { useState, useEffect, useRef } from 'react';

// Custom event name for same-tab sync between hook instances
const SYNC_EVENT = 'diald-storage-sync';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const didReadRef = useRef(false);
  // Track whether the current write was triggered by a sync event to avoid loops
  const isSyncingRef = useRef(false);

  // Read from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
      didReadRef.current = true;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  // Write to localStorage when value changes (only after successful initial read)
  useEffect(() => {
    if (!isLoaded || !didReadRef.current || isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      // Notify other instances of this hook using the same key
      window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value, isLoaded]);

  // Listen for sync events from other instances and cross-tab storage events
  useEffect(() => {
    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.key !== key) return;
      try {
        const stored = localStorage.getItem(key);
        if (stored !== null) {
          isSyncingRef.current = true;
          setValue(JSON.parse(stored));
        }
      } catch { /* ignore */ }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        if (e.newValue !== null) {
          isSyncingRef.current = true;
          setValue(JSON.parse(e.newValue));
        }
      } catch { /* ignore */ }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [key]);

  return [value, setValue, isLoaded];
}
