import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ScanLine, Users, FileText, 
  LogOut 
} from 'lucide-react';

import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Scan from './components/Scan';
import Warga from './components/Warga';
import Laporan from './components/Laporan';
import { initDB } from './database/db';
import './App.css';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initDB(); // Init database
    // Check session
    const savedUser = localStorage.getItem('jimpitan_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (admin) => {
    setUser(admin);
    localStorage.setItem('jimpitan_user', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('jimpitan_user');
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app">
        {/* Top Header */}
        <header className="top-header">
          <h1>Jimpitan RT 03/RW 05</h1>
          <div className="header-profile" style={{ position: 'relative' }}>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} // Reusing sidebarOpen state for dropdown to avoid adding new state if possible, wait, it's better to add new state but sidebarOpen is already there and unused now! Let's rename it or just use it. Actually I will use sidebarOpen as profile dropdown state.
              className="btn-profile" 
              title="Profil"
            >
              <div className="avatar-header">{user?.nama?.charAt(0)?.toUpperCase() || 'A'}</div>
            </button>
            
            {sidebarOpen && (
              <>
                <div className="dropdown-overlay" onClick={() => setSidebarOpen(false)}></div>
                <div className="profile-dropdown">
                  <div className="dropdown-header-info">
                    <strong>{user?.nama || 'Admin'}</strong>
                    <small>Administrator</small>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button onClick={() => { setSidebarOpen(false); handleLogout(); }} className="dropdown-item text-danger">
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Bottom Navigation */}
        <nav className="bottom-nav">
          <NavLink to="/" end>
            <LayoutDashboard size={24} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/scan">
            <ScanLine size={24} />
            <span>Scan</span>
          </NavLink>
          <NavLink to="/warga">
            <Users size={24} />
            <span>Warga</span>
          </NavLink>
          <NavLink to="/laporan">
            <FileText size={24} />
            <span>Laporan</span>
          </NavLink>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/warga" element={<Warga />} />
            <Route path="/laporan" element={<Laporan />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;