import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api/services.js';
import { useLoad, useAction } from '../hooks.js';
import { Card, Button, PageHead, Gate, Msg, Field } from '../components/UI.jsx';

const GROUPS = [['android_doc', 'Android DOC'], ['ios_base', 'iOS BASE']];
const blank = { android_doc: [], ios_base: [] };

export default function Prices() {
  const st = useLoad(api.getPrices);
  const [d, setD] = useState(blank);
  const [err, setErr] = useState('');
  const a = useAction();
  useEffect(() => { if (st.data) setD({ ...blank, ...st.data }); }, [st.data]);

  const upd = (g, i, k, v) => setD({ ...d, [g]: d[g].map((r, j) => (j === i ? { ...r, [k]: v } : r)) });
  const add = (g) => setD({ ...d, [g]: [...d[g], { name: '', price: '', days: '' }] });
  const del = (g, i) => setD({ ...d, [g]: d[g].filter((_, j) => j !== i) });

  const save = () => {
    const bad = GROUPS.some(([g]) => d[g].some((r) => !r.name.trim() || !(Number(r.price) > 0) || !Number.isInteger(Number(r.days)) || Number(r.days) < 1));
    if (bad) return setErr('Every plan needs a name, a price above 0 and whole days of at least 1.');
    setErr('');
    a.run(() => api.savePrices(Object.fromEntries(GROUPS.map(([g]) => [g, d[g].map((r) => ({ name: r.name.trim(), price: Number(r.price), days: Number(r.days) }))]))), 'Prices saved');
  };

  return (
    <>
      <PageHead title="Price management" sub="Plans shown to customers in the bot." />
      <Gate st={st} keepOnPending what="prices">
        {() => (
          <>
            {GROUPS.map(([g, label]) => (
              <Card key={g} title={label} action={<Button variant="ghost" onClick={() => add(g)}><Plus size={16} />Add plan</Button>}>
                {d[g].length === 0 && <div className="empty">No plans yet. Add the first one.</div>}
                {d[g].map((r, i) => (
                  <div className="row-edit" key={i}>
                    <Field label="Plan name"><input value={r.name} onChange={(e) => upd(g, i, 'name', e.target.value)} /></Field>
                    <Field label="Price (₹)"><input type="number" inputMode="decimal" min="1" value={r.price} onChange={(e) => upd(g, i, 'price', e.target.value)} /></Field>
                    <Field label="Duration (days)"><input type="number" inputMode="numeric" min="1" step="1" value={r.days} onChange={(e) => upd(g, i, 'days', e.target.value)} /></Field>
                    <button className="icon danger" aria-label="Remove plan" onClick={() => del(g, i)}><Trash2 size={18} /></button>
                  </div>
                ))}
              </Card>
            ))}
            {err && <div className="note err">{err}</div>}
            <Msg msg={a.msg} />
            <Button loading={a.busy} onClick={save}>Save prices</Button>
          </>
        )}
      </Gate>
    </>
  );
}
