import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchRates, type FxError, type RateSnapshot, type FxUsage } from '../agents/fxConverter';
import { loadFxCache, loadFxKey, loadFxUsage, removeFxKey, saveFxCache, saveFxKey, saveFxUsage } from '../storage/fxRepository';
import { useOnlineStatus } from './useOnlineStatus';

/** Kurse für die Bestände. Key, Zwischenspeicher und Abrufe bleiben auf dem Gerät. */
export function useFx(codes: string[]) {
  const online = useOnlineStatus();
  const [apiKey, setApiKeyState] = useState<string | null>(() => loadFxKey());
  const [snapshot, setSnapshot] = useState<RateSnapshot | null>(() => loadFxCache());
  const [usage, setUsage] = useState<FxUsage>(() => loadFxUsage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FxError | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const busy = useRef(false);

  const codeKey = useMemo(() => [...new Set(codes)].sort().join(','), [codes]);

  const refresh = useCallback(
    async (force = false) => {
      if (busy.current || codeKey === '') return;
      busy.current = true;
      setLoading(true);
      const result = await fetchRates({
        apiKey,
        codes: codeKey.split(','),
        now: Date.now(),
        cache: snapshot,
        usage,
        online,
        force,
      });
      busy.current = false;
      setLoading(false);
      setUsage(result.usage);
      saveFxUsage(result.usage);
      setFromCache(result.ok && result.fromCache);
      if (result.ok) {
        setSnapshot(result.snapshot);
        saveFxCache(result.snapshot);
        setError(null);
      } else {
        setError(result.error);
      }
    },
    [apiKey, codeKey, online, snapshot, usage],
  );

  // Beim Start und bei neuen Bestandsarten: nur wenn ein Key da ist und der Cache veraltet ist.
  useEffect(() => {
    if (apiKey && codeKey) void refresh(false);
    // Bewusst nur bei Key- und Code-Wechsel ausführen, nicht bei jeder Statusänderung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, codeKey]);

  const setApiKey = useCallback((key: string) => {
    saveFxKey(key);
    setApiKeyState(key.trim());
    setError(null);
  }, []);

  const clearApiKey = useCallback(() => {
    removeFxKey();
    setApiKeyState(null);
    setError(null);
  }, []);

  return { apiKey, setApiKey, clearApiKey, rates: snapshot?.rates ?? null, fetchedAt: snapshot?.fetchedAt ?? null, loading, error, fromCache, refresh };
}
