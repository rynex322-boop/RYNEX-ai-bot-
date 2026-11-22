import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/services.js';
import { hasToken, setToken } from '../api/client.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  // Preview exists only in `npm run dev` so the UI can be viewed before the backend exists.
  const [user, setUser] = useState(
    import.meta.env.DEV && sessionStorage.getItem('rx_preview') ? { email: 'dev preview' } : null
  );
  const [ready, setReady] = useState(!hasToken());

  useEffect(() => {
    if (hasToken()) api.me().then(setUser).catch(() => setToken('')).finally(() => setReady(true));
    const out = () => setUser(null);
    window.addEventListener('rx-unauth', out);
    return () => window.removeEventListener('rx-unauth', out);
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res?.token) setToken(res.token);
    setUser(res?.user || { email });
  };
  const logout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setToken(''); sessionStorage.removeItem('rx_preview'); setUser(null);
  };
  const preview = () => { sessionStorage.setItem('rx_preview', '1'); setUser({ email: 'dev preview' }); };

  return <Ctx.Provider value={{ user, ready, login, logout, preview }}>{children}</Ctx.Provider>;
}
