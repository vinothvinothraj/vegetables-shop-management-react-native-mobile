"use client";

import { useEffect, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

export function useLocalStorage(key, initialValue) {
  const [hasHydrated, setHasHydrated] = useState(false);
  const [value, setValue] = useState(() => {
    if (typeof initialValue === "function") {
      return initialValue();
    }

    return initialValue;
  });

  useEffect(() => {
    const stored = readStorage(key, undefined);

    if (stored !== undefined) {
      setValue(stored);
    }

    setHasHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    writeStorage(key, value);
  }, [hasHydrated, key, value]);

  return [value, setValue, hasHydrated];
}
