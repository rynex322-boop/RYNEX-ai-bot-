import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Tag, QrCode, Film, ShoppingBag, Users, Bot, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/prices', 'Prices', Tag], ['/qr', 'Payment QR', QrCode],
  ['/media', 'Media', Film], ['/orders', 'Orders', ShoppingBag], ['/customers', 'Customers', Users],
  ['/bot', 'Bot settings', Bot],
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <aside className={open ? 'side open' : 'side'}>
        <div className="brand"><span>RYNEX</span> INDIA<small>Super Admin</small></div>
        <nav>
          {NAV.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><Icon size={18} />{label}</NavLink>
          ))}
        </nav>
        <div className="side-f"><small>{user?.email}</small>
          <button className="btn ghost" onClick={logout}><LogOut size={16} />Sign out</button></div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="top">
          <button className="icon" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
          <div className="brand sm"><span>RYNEX</span> INDIA</div>
        </header>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
