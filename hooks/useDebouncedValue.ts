import { useEffect, useMemo, useRef, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs: number = 150): T {
  const [debounced, setDebounced] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setDebounced(value), delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, delayMs]);

  return debounced;
}

export function useStableTrimmedQuery(raw: string): string {
  const trimmed = useMemo(() => raw.trim(), [raw]);
  const debounced = useDebouncedValue(trimmed);
  return debounced;
}



