import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleAuthCallback } from '../auth/keycloak';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const hasProcessedRef = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return undefined;
    }
    hasProcessedRef.current = true;

    const scheduleHomeRedirect = () => {
      timeoutRef.current = window.setTimeout(() => navigate('/', { replace: true }), 3000);
    };

    const processCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Keycloak error: ${errorParam}`);
        scheduleHomeRedirect();
        return;
      }

      if (!code) {
        setError('No authorization code received');
        scheduleHomeRedirect();
        return;
      }

      try {
        await handleAuthCallback(code);
        // Successful authentication, redirect to landing
        navigate('/', { replace: true });
      } catch (err) {
        setError(`Authentication failed: ${err.message}`);
        scheduleHomeRedirect();
      }
    };

    processCallback();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [searchParams, navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {error ? (
        <div style={{
          textAlign: 'center',
          padding: '32px',
          borderRadius: '8px',
          backgroundColor: '#7f1d1d',
          border: '1px solid #991b1b',
        }}>
          <div style={{ fontSize: '16px', marginBottom: '12px' }}>❌ {error}</div>
          <div style={{ fontSize: '12px', color: '#fecaca' }}>Redirecting to home...</div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '16px' }}>Processing authentication...</div>
          <div style={{ 
            width: '36px', 
            height: '36px', 
            border: '3px solid #334155', 
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
