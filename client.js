// Single place that talks to the backend (Cloudflare Worker). No secrets live here.
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const isConfigured = Boolean(BASE);

let token = sessionStorage.getItem('rx_token') || '';
export const hasToken = () => Boolean(token);
export const setToken = (t) => {
  token = t || '';
  t ? sessionStorage.setItem('rx_token', t) : sessionStorage.removeItem('rx_token');
};

export class NotIntegrated extends Error {
  constructor() { super('Awaiting backend integration'); this.notIntegrated = true; }
}

export async function request(path, { method = 'GET', body, form } = {}) {
  if (!isConfigured) throw new NotIntegrated();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, {
    method, headers, credentials: 'include',
    body: form || (body ? JSON.stringify(body) : undefined),
  });
  if (res.status === 401) { setToken(''); window.dispatchEvent(new Event('rx-unauth')); }
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}
