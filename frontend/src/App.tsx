import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import RHDashboard from './pages/RHDashboard';
import { LogOut, User, LayoutDashboard, Briefcase } from 'lucide-react';

export const AuthContext = React.createContext<any>(null);

function Layout() {
  const { auth, logout } = React.useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  if (['/', '/login', '/register'].includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* Logo */}
        <div className="logo" onClick={() => navigate('/')}>
          Smart Recruit
        </div>

        {/* Nav */}
        <div className="nav-item active">
          <LayoutDashboard size={18} /> Dashboard
        </div>

        {auth?.role === 'candidate' && (
          <div className="nav-item" onClick={() => navigate('/')}>
            <Briefcase size={18} /> Trouver des offres
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* User info */}
        <div style={{
          padding: '.85rem 1rem',
          borderRadius: 10,
          background: 'rgba(249,115,22,.07)',
          border: '1px solid rgba(249,115,22,.12)',
          marginBottom: '.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '.7rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--orange), var(--gold))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, fontSize: '.8rem', fontWeight: 700, color: '#fff',
          }}>
            {(auth?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {auth?.name || 'Utilisateur'}
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {auth?.role}
            </div>
          </div>
        </div>

        <div className="nav-item" onClick={logout} style={{ color: '#f87171', marginBottom: 0 }}>
          <LogOut size={18} /> Déconnexion
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/candidate/*" element={auth?.role === 'candidate' ? <CandidateDashboard /> : <Navigate to="/login" />} />
          <Route path="/rh/*"        element={auth?.role === 'rh'        ? <RHDashboard />       : <Navigate to="/login" />} />
          <Route path="*"            element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState<{ token: string; role: string; name: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role  = localStorage.getItem('role');
    const name  = localStorage.getItem('name');
    if (token && role) setAuth({ token, role, name: name || '' });
  }, []);

  const login = (token: string, role: string, name: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('name', name);
    setAuth({ token, role, name });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
