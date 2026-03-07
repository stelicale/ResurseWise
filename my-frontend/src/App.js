import React, { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConnectionTest from './components/ConnectionTest';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ResourcesPage from './components/ResourcesPage';
import CategoriesPage from './components/CategoriesPage';
import UsersPage from './components/UsersPage';
import LogsPage from './components/LogsPage';
import LandingPage from './components/LandingPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './App.css';

const AppContent = () => {
  const { isInitialized, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [testOpen, setTestOpen] = useState(false);

  if (!isInitialized) {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#64748b', fontSize: '14px' }}>
        Initializing authentication…
      </div>
    );
  }

  return (
    <div className="App">

      {/* ── Navbar (consistently rendered on every page) ── */}
      <Navbar />

      {/* ── Route-based page content ── */}
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              isAuthenticated={isAuthenticated}
              onGetStarted={() => navigate('/resources')}
            />
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <main style={{ maxWidth: '1200px', margin: '0 auto' }} className="app-main">
                <ResourcesPage isAdmin={isAdmin} />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <main style={{ maxWidth: '1200px', margin: '0 auto' }} className="app-main">
                <CategoriesPage isAdmin={isAdmin} />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute adminOnly>
              <main style={{ maxWidth: '1200px', margin: '0 auto' }} className="app-main">
                <UsersPage isAdmin={isAdmin} />
              </main>
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute adminOnly>
              <main style={{ maxWidth: '1200px', margin: '0 auto' }} className="app-main">
                <LogsPage />
              </main>
            </ProtectedRoute>
          }
        />
        {/* Fallback: redirect any unknown URL to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* ── Floating "Run Tests" button (bottom-right corner) ── */}
      {isAuthenticated && (
        <button
          onClick={() => setTestOpen((o) => !o)}
          title="Run API Tests"
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
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
        <div className="api-test-panel">
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
    <BrowserRouter>
      <AuthProvider>
        <DataWrapper />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
