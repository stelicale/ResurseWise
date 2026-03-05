import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConnectionTest from './components/ConnectionTest';
import ResourcesPage from './components/ResourcesPage';
import CategoriesPage from './components/CategoriesPage';
import UsersPage from './components/UsersPage';
import LogsPage from './components/LogsPage';
import LandingPage from './components/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './App.css';

// ─── Nav tabs (Users only shown to admins) ──────────────────────────────────
const NAV_TABS = [
  { key: 'resources', label: 'Resources', adminOnly: false },
  { key: 'categories', label: 'Categories', adminOnly: false },
  { key: 'users', label: 'Users', adminOnly: true },
  { key: 'logs', label: 'Logs', adminOnly: true },
];

const AppContent = () => {
  const { isInitialized, isAuthenticated, login, logout, isAdmin, username } = useAuth();
  const [loginForm, setLoginForm] = React.useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [testOpen, setTestOpen] = useState(false);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast.error('Please enter your username and password.');
      return;
    }
    try {
      setIsLoggingIn(true);
      await login(loginForm);
      setLoginForm({ username: '', password: '' });
      setActiveTab('resources');
    } catch {
      toast.error('Login failed. Check your credentials or Keycloak connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };
  const handleLogout = () => { logout(); setActiveTab('home'); };

  if (!isInitialized) {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b', fontSize: '14px' }}>
        Initializing authentication…
      </div>
    );
  }

  const visibleTabs = NAV_TABS.filter((t) => !t.adminOnly || isAdmin);
  let currentTab = activeTab;
  if (!isAuthenticated) {
    currentTab = 'home';
  } else if (activeTab !== 'home' && !visibleTabs.some((t) => t.key === activeTab)) {
    currentTab = 'resources';
  }

  return (
    <div className="App">

      {/* ── Top Header ── */}
      <header style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="app-header-inner">

          {/* Brand */}
          <button
            onClick={() => setActiveTab('home')}
            style={{ fontWeight: '700', fontSize: '16px', color: '#f1f5f9', whiteSpace: 'nowrap', letterSpacing: '-0.02em', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <span style={{ color: '#60a5fa' }}>Resurse</span>Wise
          </button>

          {/* Nav tabs */}
          {isAuthenticated && (
            <nav className="app-nav">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: currentTab === tab.key ? '#1e293b' : 'transparent',
                    color: currentTab === tab.key ? '#f1f5f9' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: currentTab === tab.key ? '600' : '400',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
          {!isAuthenticated && <div className="app-spacer" />}

          {/* Auth area */}
          <div className="app-auth">
            {isAuthenticated ? (
              <>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  <strong style={{ color: '#94a3b8' }}>{username || 'user'}</strong>
                  <span style={{
                    marginLeft: '6px', padding: '2px 7px', borderRadius: '10px',
                    backgroundColor: isAdmin ? '#1e1b4b' : '#0c1a2e',
                    border: `1px solid ${isAdmin ? '#3730a3' : '#1d4ed8'}`,
                    color: isAdmin ? '#818cf8' : '#60a5fa',
                    fontSize: '11px', fontWeight: '600',
                  }}>
                    {isAdmin ? 'Admin' : 'Employee'}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  style={{ padding: '6px 13px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm((p) => ({ ...p, username: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="app-login-input"
                  style={{ borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="app-login-input"
                  style={{ borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#f1f5f9' }}
                />
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  style={{ padding: '7px 14px', borderRadius: '6px', border: 'none', backgroundColor: isLoggingIn ? '#475569' : '#3b82f6', color: '#fff', cursor: isLoggingIn ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
                >
                  {isLoggingIn ? 'Logging in…' : 'Login'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      {currentTab === 'home' ? (
        <LandingPage
          isAuthenticated={isAuthenticated}
          onGetStarted={() => setActiveTab('resources')}
        />
      ) : (
        <main style={{ maxWidth: '1200px', margin: '0 auto' }} className="app-main">
          {currentTab === 'resources' && <ResourcesPage isAdmin={isAdmin} />}
          {currentTab === 'categories' && <CategoriesPage isAdmin={isAdmin} />}
          {currentTab === 'users' && <UsersPage isAdmin={isAdmin} />}
          {currentTab === 'logs' && <LogsPage />}
        </main>
      )}

      {/* ── Floating "Run Tests" button (bottom-LEFT corner) ── */}
      {isAuthenticated && (
        <button
          onClick={() => setTestOpen((o) => !o)}
          title="Run API Tests"
          style={{
            position: 'fixed', bottom: '24px', left: '24px',
            width: '48px', height: '48px', borderRadius: '50%',
            border: '1px solid #334155',
            backgroundColor: testOpen ? '#3b82f6' : '#1e293b',
            color: testOpen ? '#fff' : '#94a3b8',
            fontSize: '20px', cursor: 'pointer', zIndex: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ▶
        </button>
      )}

      {/* ── ConnectionTest slide-in panel ── */}
      {testOpen && isAuthenticated && (
        <div style={{
          position: 'fixed', bottom: '84px', left: '24px',
          width: '560px', maxWidth: 'calc(100vw - 48px)',
          maxHeight: '75vh', overflowY: 'auto',
          backgroundColor: '#0f172a', border: '1px solid #334155',
          borderRadius: '10px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', zIndex: 500,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 18px', borderBottom: '1px solid #1e293b',
            position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1,
          }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#94a3b8' }}>API Test Suite</span>
            <button onClick={() => setTestOpen(false)} style={{ background: 'none', border: 'none', color: '#475569', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <ConnectionTest isAuthenticated={isAuthenticated} />
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick theme="dark" />
    </div>
  );
};

// DataWrapper keeps DataProvider inside AuthProvider so useAuth() works.
const DataWrapper = () => {
  const { isAuthenticated } = useAuth();
  return (
    <DataProvider isAuthenticated={isAuthenticated}>
      <AppContent />
    </DataProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <DataWrapper />
    </AuthProvider>
  );
}

export default App;
