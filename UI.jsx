import { Loader2, Hourglass, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Card = ({ title, action, children, className = '' }) => (
  <section className={`card ${className}`}>
    {(title || action) && <header className="card-h"><h3>{title}</h3>{action}</header>}
    {children}
  </section>
);

export const Button = ({ variant = 'gold', loading, children, disabled, ...p }) => (
  <button className={`btn ${variant}`} {...p} disabled={loading || disabled}>
    {loading && <Loader2 className="spin" size={16} />}{children}
  </button>
);

export const Field = ({ label, hint, children }) => (
  <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
);

export const Badge = ({ tone = 'gold', children }) => <span className={`badge ${tone}`}>{children}</span>;

export const PageHead = ({ title, sub }) => (
  <div className="page-head"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
);

export const Awaiting = ({ children = 'This feature needs the backend connection before it can work.' }) => (
  <div className="note wait"><Hourglass size={18} /><div><b>Awaiting integration</b><p>{children}</p></div></div>
);

export const Msg = ({ msg }) => {
  if (!msg) return null;
  const Icon = msg.t === 'ok' ? CheckCircle2 : msg.t === 'wait' ? Hourglass : AlertTriangle;
  return <div className={`note ${msg.t}`}><Icon size={18} /><div>{msg.m}</div></div>;
};

export const Empty = ({ children }) => <div className="empty">{children}</div>;

// Handles loading / error / awaiting integration. keepOnPending still renders the form with no data.
export function Gate({ st, children, keepOnPending = false, what = 'data' }) {
  if (st.loading) return <div className="empty"><Loader2 className="spin" /> Loading…</div>;
  if (st.pending) return <>
    <Awaiting>Live {what} will appear here once the backend is connected.</Awaiting>
    {keepOnPending && children(undefined)}
  </>;
  if (st.error) return <div className="note err"><AlertTriangle size={18} /><div>{st.error}
    <div><Button variant="ghost" onClick={st.reload}>Try again</Button></div></div></div>;
  return children(st.data);
}
