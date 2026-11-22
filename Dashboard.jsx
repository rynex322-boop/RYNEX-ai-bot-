import { api } from '../api/services.js';
import { isConfigured } from '../api/client.js';
import { useLoad } from '../hooks.js';
import { Card, PageHead, Gate, Badge } from '../components/UI.jsx';

const TILES = [
  ['pendingOrders', 'Pending orders'], ['approvedOrders', 'Approved orders'], ['rejectedOrders', 'Rejected orders'],
  ['totalCustomers', 'Customers'], ['activeSubscriptions', 'Active subscriptions'], ['expiringSoon', 'Expiring in 7 days'],
];
const MODULES = ['Sign in', 'Prices', 'Payment QR', 'Media', 'Orders', 'Customers', 'Bot settings'];

export default function Dashboard() {
  const st = useLoad(api.stats);
  return (
    <>
      <PageHead title="Dashboard" sub="Live numbers come from your backend." />
      <Gate st={st} keepOnPending what="statistics">
        {(d) => (
          <div className="grid tiles">
            {TILES.map(([k, label]) => (
              <Card key={k} className="tile"><div className="num">{d?.[k] ?? '—'}</div><div className="lbl">{label}</div></Card>
            ))}
          </div>
        )}
      </Gate>
      <Card title="Backend connection">
        <ul className="status">
          {MODULES.map((m) => (
            <li key={m}><span>{m}</span><Badge tone={isConfigured ? 'ok' : 'wait'}>{isConfigured ? 'API set' : 'Awaiting integration'}</Badge></li>
          ))}
        </ul>
      </Card>
    </>
  );
}
