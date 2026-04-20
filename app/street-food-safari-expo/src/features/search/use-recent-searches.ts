import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "street-food-safari.recent-searches";
const MAX_RECENTS = 5;

function sanitize(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= MAX_RECENTS) break;
  }
  return out;
}

// Small AsyncStorage-backed MRU list of search queries. Hydrates async; the
// first render sees an empty list. Writes are fire-and-forget — if persistence
// fails we still update in-memory state so the UI stays consistent.
export function useRecentSearches() {
  const [recents, setRecents] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (raw) {
          try {
            setRecents(sanitize(JSON.parse(raw)));
          } catch {
            setRecents([]);
          }
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    setRecents(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
      // Best-effort — in-memory state remains authoritative for this session.
    });
  }, []);

  const add = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      setRecents((prev) => {
        const lower = value.toLowerCase();
        const deduped = prev.filter((q) => q.toLowerCase() !== lower);
        const next = [value, ...deduped].slice(0, MAX_RECENTS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const remove = useCallback(
    (raw: string) => {
      const lower = raw.trim().toLowerCase();
      setRecents((prev) => {
        const next = prev.filter((q) => q.toLowerCase() !== lower);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  return { recents, hydrated, add, remove, clear };
}
