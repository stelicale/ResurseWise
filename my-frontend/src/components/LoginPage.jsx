import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.username || !credentials.password) {
      toast.error('Please enter your username and password.');
      return;
    }
    try {
      setIsLoading(true);
      await login(credentials);
      setCredentials({ username: '', password: '' });
      navigate('/resources');
    } catch (error) {
      toast.error('Login failed. Check your credentials or Keycloak connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit(e);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '48px 32px 32px',
          textAlign: 'center',
          background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
          borderBottom: '1px solid #e2e8f0',
        }}>
          {/* Keycloak-style logo */}
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
            borderRadius: '12px',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '32px',
            fontWeight: '800',
          }}>
            🔐
          </div>
          <h1 style={{
            margin: '0 0 8px',
            fontSize: '28px',
            fontWeight: '800',
            color: '#0f172a',
            letterSpacing: '-0.02em',
          }}>
            ResurseWise
          </h1>
          <p style={{
            margin: '0',
            fontSize: '14px',
            color: '#64748b',
          }}>
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '40px 32px' }}>
          {/* Username Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Username or Email
            </label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                background: '#fff',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Input */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                color: '#0f172a',
                background: '#fff',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: isLoading ? '#cbd5e1' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: isLoading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
              letterSpacing: '0.02em',
            }}
            onHover={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          padding: '20px 32px',
          textAlign: 'center',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#94a3b8',
        }}>
          Secured by Keycloak • {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
