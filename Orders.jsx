import { useState } from 'react';
import { api } from '../api/services.js';
import { useLoad, useAction } from '../hooks.js';
import { Card, Button, PageHead, Gate, Msg, Empty, Badge } from '../components/UI.jsx';

const TABS = [['pending', 'Pending', 'wait'], ['approved', 'Approved', 'ok'], ['rejected', 'Rejected', 'err']];
const money = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

function OrderCard({ o, status, onDone }) {
  const a = useAction();
  const approve = async () => {
    if (!window.confirm(`Approve order ${o.id}? The customer will be activated.`)) return;
    if (await a.run(() => api.approveOrder(o.id), 'Order approved')) onDone();
  };
  const reject = async () => {
    const reason = window.prompt('Reason for rejecting (sent to the customer):');
    if (reason === null) return;
    if (await a.run(() => api.rejectOrder(o.id, reason), 'Order rejected')) onDone();
  };
  return (
    <Card className="order">
      <div className="order-h"><b>#{o.id}</b><Badge tone={TABS.find((t) => t[0] === status)[2]}>{status}</Badge></div>
      <dl>
        <dt>Customer</dt><dd>{o.customerName || '—'}{o.telegramId ? ` (${o.telegramId})` : ''}</dd>
        <dt>Plan</dt><dd>{o.plan || '—'}</dd>
        <dt>Amount</dt><dd>{money(o.amount)}</dd>
        <dt>Payment ref</dt><dd>{o.utr || '—'}</dd>
        <dt>Placed</dt><dd>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</dd>
      </dl>
      {o.screenshotUrl && <a className="link" href={o.screenshotUrl} target="_blank" rel="noreferrer noopener">View payment screenshot</a>}
      <Msg msg={a.msg} />
      {status === 'pending' && (
        <div className="actions"><Button loading={a.busy} onClick={approve}>Approve</Button>
          <Button variant="danger" loading={a.busy} onClick={reject}>Reject</Button></div>
      )}
    </Card>
  );
}

export default function Orders() {
  const [tab, setTab] = useState('pending');
  const st = useLoad(() => api.listOrders(tab), [tab]);
  return (
    <>
      <PageHead title="Orders" sub="Approving or rejecting is done by your backend, not this screen." />
      <div className="tabs">{TABS.map(([id, l]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{l}</button>)}</div>
      <Gate st={st} what="orders">
        {(rows) => !rows?.length ? <Empty>No {tab} orders.</Empty> :
          <div className="grid two">{rows.map((o) => <OrderCard key={o.id} o={o} status={tab} onDone={st.reload} />)}</div>}
      </Gate>
    </>
  );
}
