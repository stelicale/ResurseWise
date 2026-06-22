import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  getToken,
  getUsername,
  getUserRoles,
  hasRole,
  initKeycloak,
  login,
  logout,
  refreshToken,
  subscribeToAuthState,
} from '../auth/keycloak';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState([]);
  const [username, setUsername] = useState('');

  const syncFromToken = (authenticated) => {
    setIsAuthenticated(authenticated);
    setRoles(authenticated ? getUserRoles() : []);
    setUsername(authenticated ? getUsername() : '');
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      try {
        const authenticated = await initKeycloak();
        if (isMounted) {
          syncFromToken(authenticated);
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    const unsubscribe = subscribeToAuthState((authenticated) => {
      if (isMounted) {
        syncFromToken(authenticated);
      }
    });

    bootstrapAuth();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      const token = await refreshToken(60);
      if (!token) {
        syncFromToken(false);
        return;
      }

      syncFromToken(true);
    }, 25000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      isInitialized,
      isAuthenticated,
      token: getToken(),
      roles,
      username,
      isAdmin: hasRole('Admin'),
      login,
      logout,
      hasRole,
    }),
    [isInitialized, isAuthenticated, roles, username]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};