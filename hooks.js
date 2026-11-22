import { useCallback, useEffect, useState } from 'react';

export function useLoad(fn, deps = []) {
  const [s, set] = useState({ loading: true });
  const run = useCallback(async () => {
    set((x) => ({ ...x, loading: true, error: null }));
    try { set({ data: await fn(), loading: false }); }
    catch (e) { set({ loading: false, error: e.message, pending: Boolean(e.notIntegrated) }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...s, reload: run };
}

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const run = async (fn, ok = 'Saved') => {
    setBusy(true); setMsg(null);
    try { await fn(); setMsg({ t: 'ok', m: ok }); return true; }
    catch (e) {
      setMsg(e.notIntegrated
        ? { t: 'wait', m: 'Awaiting backend integration. Nothing was changed.' }
        : { t: 'err', m: e.message });
      return false;
    } finally { setBusy(false); }
  };
  return { busy, msg, run };
}
