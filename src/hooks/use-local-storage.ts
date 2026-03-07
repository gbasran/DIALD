'use client';

import { useState, useEffect, useRef } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const didReadRef = useRef(false);

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
      // Don't set didReadRef — prevents write effect from overwriting with initialValue
    }
    setIsLoaded(true);
  }, [key]);

  // Write to localStorage when value changes (only after successful initial read)
  useEffect(() => {
    if (!isLoaded || !didReadRef.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, value, isLoaded]);

  return [value, setValue, isLoaded];
}
