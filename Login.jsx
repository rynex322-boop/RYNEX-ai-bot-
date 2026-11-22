import { useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { isConfigured } from '../api/client.js';
import { Button, Field, Awaiting } from '../components/UI.jsx';

export default function Login() {
  const { login, preview } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(email.trim(), password); }
    catch (x) { setErr(x.notIntegrated ? '' : x.message || 'Sign in failed'); }
    finally { setBusy(false); }
  };

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand lg"><span>RYNEX</span> INDIA<small>Super Admin</small></div>
        {!isConfigured && <Awaiting>Sign in is checked by your backend. Set VITE_API_BASE_URL to enable it.</Awaiting>}
        <Field label="Admin email"><input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {err && <div className="note err">{err}</div>}
        <Button type="submit" loading={busy} disabled={!isConfigured}>Sign in</Button>
        {import.meta.env.DEV && <Button type="button" variant="ghost" onClick={preview}>Preview the panel (dev only)</Button>}
      </form>
    </div>
  );
}
