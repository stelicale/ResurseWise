import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { NAV_ROUTES } from '../config/routes';

const Navbar = () => {
  const { isAuthenticated, isAdmin, username, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Close hamburger menu automatically on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast.error('Please enter your username and password.');
      return;
    }
    try {
      setIsLoggingIn(true);
      await login(loginForm);
      setLoginForm({ username: '', password: '' });
      navigate('/resources');
    } catch {
      toast.error('Login failed. Check your credentials or Keycloak connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleLogin(); };
  const handleLogout = () => { logout(); navigate('/'); };

  const visibleRoutes = NAV_ROUTES.filter((r) => !r.adminOnly || isAdmin);

  return (
    <header style={{
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div className="app-header-inner">

        {/* Brand */}
        <NavLink to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
          <span style={{ color: '#60a5fa' }}>Resurse</span>Wise
        </NavLink>

        {/* Desktop nav tabs (hidden on mobile via CSS) */}
        {isAuthenticated && (
          <nav className="app-nav" aria-label="Main navigation">
            {visibleRoutes.map((route) => (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) => `nav-tab${isActive ? ' nav-tab-active' : ''}`}
              >
                {route.label}
              </NavLink>
            ))}
          </nav>
        )}
        {!isAuthenticated && <div className="app-spacer" />}

        {/* Auth area */}
        <div className="app-auth">
          {isAuthenticated ? (
            <>
              {/* Hamburger – only visible on mobile via CSS */}
              <button
                className="nav-hamburger"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
              >
                {menuOpen ? '✕' : '☰'}
              </button>

              <span style={{ fontSize: '13px', color: '#64748b' }}>
                <strong style={{ color: '#94a3b8' }}>{username || 'user'}</strong>
                <span style={{
                  marginLeft: '6px',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: isAdmin ? '#1e1b4b' : '#0c1a2e',
                  border: `1px solid ${isAdmin ? '#3730a3' : '#1d4ed8'}`,
                  color: isAdmin ? '#818cf8' : '#60a5fa',
                  fontSize: '11px',
                  fontWeight: '600',
                }}>
                  {isAdmin ? 'Admin' : 'Employee'}
                </span>
              </span>

              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 13px', borderRadius: '6px',
                  border: '1px solid #334155', backgroundColor: 'transparent',
                  color: '#94a3b8', cursor: 'pointer', fontSize: '13px',
                }}
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
                style={{
                  padding: '7px 14px', borderRadius: '6px', border: 'none',
                  backgroundColor: isLoggingIn ? '#475569' : '#3b82f6',
                  color: '#fff', cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                  fontWeight: '600', fontSize: '13px',
                }}
              >
                {isLoggingIn ? 'Logging in…' : 'Login'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown menu – rendered below the header bar */}
      {isAuthenticated && menuOpen && (
        <nav id="mobile-nav" className="nav-mobile-menu" aria-label="Mobile navigation">
          {visibleRoutes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) => `nav-mobile-tab${isActive ? ' nav-tab-active' : ''}`}
            >
              {route.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
