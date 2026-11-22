import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../api/services.js';
import { useLoad } from '../hooks.js';
import { Card, PageHead, Gate, Empty, Badge } from '../components/UI.jsx';

const DAY = 86400000;
function state(c) {
  if (!c.expiresAt) return c.plan ? ['active', 'Lifetime', 'gold'] : ['none', 'No plan', 'gold'];
  const left = new Date(c.expiresAt).getTime() - Date.now();
  if (left < 0) return ['expired', 'Expired', 'err'];
  if (left < 7 * DAY) return ['soon', `Ends in ${Math.ceil(left / DAY)}d`, 'wait'];
  return ['active', 'Active', 'ok'];
}

export default function Customers() {
  const st = useLoad(api.listCustomers);
  const [q, setQ] = useState('');
  const [f, setF] = useState('all');
  const rows = useMemo(() => (st.data || []).filter((c) => {
    const hit = `${c.name} ${c.telegramId} ${c.phone || ''}`.toLowerCase().includes(q.toLowerCase());
    return hit && (f === 'all' || state(c)[0] === f);
  }), [st.data, q, f]);

  return (
    <>
      <PageHead title="Customers" sub="Subscriptions and expiry dates." />
      <div className="toolbar">
        <div className="search"><Search size={18} /><input placeholder="Search name or Telegram ID" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select value={f} onChange={(e) => setF(e.target.value)} aria-label="Filter">
          <option value="all">All</option><option value="active">Active</option><option value="soon">Ending soon</option><option value="expired">Expired</option>
        </select>
      </div>
      <Gate st={st} what="customers">
        {() => !rows.length ? <Empty>No customers match.</Empty> : (
          <div className="grid two">
            {rows.map((c) => { const [, label, tone] = state(c); return (
              <Card key={c.id || c.telegramId} className="order">
                <div className="order-h"><b>{c.name || 'Unnamed'}</b><Badge tone={tone}>{label}</Badge></div>
                <dl><dt>Telegram ID</dt><dd>{c.telegramId || '—'}</dd><dt>Plan</dt><dd>{c.plan || '—'}</dd>
                  <dt>Started</dt><dd>{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : '—'}</dd>
                  <dt>Expires</dt><dd>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</dd></dl>
              </Card>); })}
          </div>
        )}
      </Gate>
    </>
  );
}
