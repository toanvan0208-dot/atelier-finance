"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SetState<T> = T | ((current: T) => T);

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: SetState<T>) => void, () => void] {
  const defaultValueRef = useRef(defaultValue);
  const [state, setState] = useState<T>(defaultValue);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    queueMicrotask(() => {
      if (!isActive) return;

      try {
        const rawValue = window.localStorage.getItem(key);
        if (rawValue) {
          setState(JSON.parse(rawValue) as T);
        }
      } catch {
        setState(defaultValueRef.current);
      } finally {
        setHasHydrated(true);
      }
    });

    return () => {
      isActive = false;
    };
  }, [key]);

  useEffect(() => {
    if (!hasHydrated) return;

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Local persistence is best effort. The UI should keep working if storage is unavailable.
    }
  }, [hasHydrated, key, state]);

  const setPersistedState = useCallback((value: SetState<T>) => {
    setState((current) => (typeof value === "function" ? (value as (current: T) => T)(current) : value));
  }, []);

  const resetState = useCallback(() => {
    setState(defaultValueRef.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors and keep the in-memory reset.
    }
  }, [key]);

  return [state, setPersistedState, resetState];
}
