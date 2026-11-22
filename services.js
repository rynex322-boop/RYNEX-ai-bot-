// One function per backend endpoint. Change paths here when wiring your Worker / Firebase.
import { request as r } from './client.js';

const fd = (file, extra = {}) => {
  const f = new FormData();
  f.append('file', file);
  Object.entries(extra).forEach(([k, v]) => v != null && f.append(k, v));
  return f;
};

export const api = {
  login: (email, password) => r('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => r('/auth/logout', { method: 'POST' }),
  me: () => r('/auth/me'),
  stats: () => r('/stats'),
  getPrices: () => r('/prices'),
  savePrices: (data) => r('/prices', { method: 'PUT', body: data }),
  getQr: () => r('/qr'),
  uploadQr: (file) => r('/qr', { method: 'PUT', form: fd(file) }),
  // category: apk | setup_video | demo_video
  listMedia: (category) => r(`/media?category=${category}`),
  uploadMedia: (category, file, title, replaceId) =>
    r('/media', { method: 'POST', form: fd(file, { category, title, replaceId }) }),
  deleteMedia: (id) => r(`/media/${id}`, { method: 'DELETE' }),
  // status: pending | approved | rejected
  listOrders: (status) => r(`/orders?status=${status}`),
  approveOrder: (id) => r(`/orders/${id}/approve`, { method: 'POST' }),
  rejectOrder: (id, reason) => r(`/orders/${id}/reject`, { method: 'POST', body: { reason } }),
  listCustomers: () => r('/customers'),
  // messages only; the bot token stays on the backend
  getBot: () => r('/bot-settings'),
  saveBot: (data) => r('/bot-settings', { method: 'PUT', body: data }),
};
