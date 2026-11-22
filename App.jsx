import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Prices from './pages/Prices.jsx';
import Qr from './pages/Qr.jsx';
import Media from './pages/Media.jsx';
import Orders from './pages/Orders.jsx';
import Customers from './pages/Customers.jsx';
import BotSettings from './pages/BotSettings.jsx';

function Guard() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Layout /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<Guard />}>
            <Route index element={<Dashboard />} />
            <Route path="prices" element={<Prices />} />
            <Route path="qr" element={<Qr />} />
            <Route path="media" element={<Media />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="bot" element={<BotSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
