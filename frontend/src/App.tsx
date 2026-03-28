import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CandidateDashboard from './pages/CandidateDashboard';
import RHDashboard from './pages/RHDashboard';
import { LogOut, User, LayoutDashboard, Briefcase } from 'lucide-react';

// Simple Auth Context setup
export const AuthContext = React.createContext<any>(null);

function Layout() {
  const { auth, logout } = React.useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // If public route, no sidebar
  if (['/', '/login', '/register'].includes(location.pathname)) {
    return <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
    </Routes>;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          Smart Recruit
        </div>
        
        <div className="nav-item active">
          <LayoutDashboard size={20} /> Dashboard
        </div>
        
        {auth?.role === 'candidate' && (
          <div className="nav-item" onClick={() => navigate('/')}>
            <Briefcase size={20} /> Trouver des offres
          </div>
        )}

        <div style={{ flex: 1 }}></div>

        <div className="nav-item" style={{ background: 'transparent', color: 'var(--text-dark)', pointerEvents: 'none' }}>
           <User size={20} /> {auth?.name || "User"}
        </div>
        
        <div className="nav-item" onClick={logout} style={{ color: '#ef4444' }}>
          <LogOut size={20} /> Déconnexion
        </div>
      </aside>
      
      <main className="main-content">
        <Routes>
          <Route path="/candidate/*" element={auth?.role === 'candidate' ? <CandidateDashboard /> : <Navigate to="/login" />} />
          <Route path="/rh/*" element={auth?.role === 'rh' ? <RHDashboard /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [auth, setAuth] = useState<{token: string, role: string, name: string} | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    if (token && role) {
       setAuth({ token, role, name: name || '' });
    }
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
