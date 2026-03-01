import React from 'react';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConnectionTest from './components/ConnectionTest';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const AppContent = () => {
  const { isInitialized, isAuthenticated, login, logout, isAdmin, username } = useAuth();
  const [loginForm, setLoginForm] = React.useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast.error('Please enter your username and password.');
      return;
    }

    try {
      setIsLoggingIn(true);
      await login(loginForm);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      toast.error('Login failed. Check your username/password or Keycloak connection.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="App" style={{ padding: '2rem', color: '#94a3b8' }}>
        Initializing authentication...
      </div>
    );
  }

  return (
    <div className="App">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '800px',
          margin: '0 auto',
          padding: '20px 30px 0 30px',
        }}
      >
        <div style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'left' }}>
          {isAuthenticated ? (
            <>
              Signed in as <strong>{username || 'user'}</strong> · Role:{' '}
              <strong>{isAdmin ? 'Admin' : 'Employee'}</strong>
            </>
          ) : (
            'Not authenticated'
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isAuthenticated ? (
            <>
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, username: event.target.value }))
                }
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  minWidth: '150px',
                  backgroundColor: '#1e293b',
                  color: '#f1f5f9',
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                }
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #475569',
                  minWidth: '150px',
                  backgroundColor: '#1e293b',
                  color: '#f1f5f9',
                }}
              />
            </>
          ) : null}

          <button
            onClick={isAuthenticated ? logout : handleLogin}
            disabled={isLoggingIn}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #475569',
              backgroundColor: '#1e293b',
              color: '#f1f5f9',
              cursor: isLoggingIn ? 'not-allowed' : 'pointer',
              opacity: isLoggingIn ? 0.7 : 1,
              fontWeight: '600',
            }}
          >
            {isAuthenticated ? 'Logout' : isLoggingIn ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div
          style={{
            maxWidth: '800px',
            margin: '14px auto 0 auto',
            padding: '0 30px',
            textAlign: 'left',
            color: '#64748b',
            fontSize: '13px',
          }}
        >
          Enter your username and password, then click <strong>Login</strong>.
        </div>
      ) : null}

      <ConnectionTest isAuthenticated={isAuthenticated} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
