const keycloakConfig = {
  realm: process.env.REACT_APP_KEYCLOAK_REALM || 'ITResurceManager',
  clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'spring-backend',
  clientSecret: process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET || '',
};

const proxyPrefix = process.env.REACT_APP_KEYCLOAK_PROXY_PREFIX || '/keycloak';
const tokenEndpoint = `${proxyPrefix}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

let isInitialized = false;
let accessToken = null;
let refreshTokenValue = null;
let tokenParsed = null;
const authStateSubscribers = new Set();

const notifyAuthSubscribers = () => {
  const authenticated = !!accessToken;
  authStateSubscribers.forEach((callback) => {
    callback(authenticated);
  });
};

const parseJwt = (token) => {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

const clearStoredTokens = () => {
  accessToken = null;
  refreshTokenValue = null;
  tokenParsed = null;
};

const setStoredTokens = (tokenData) => {
  accessToken = tokenData.access_token || null;
  refreshTokenValue = tokenData.refresh_token || null;
  tokenParsed = parseJwt(accessToken);
};

const buildTokenRequestBody = (payload) => {
  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    ...payload,
  });

  if (keycloakConfig.clientSecret) {
    params.set('client_secret', keycloakConfig.clientSecret);
  }

  return params.toString();
};

const requestToken = async (bodyPayload) => {
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildTokenRequestBody(bodyPayload),
  });

  if (!response.ok) {
    throw new Error('Authentication request failed');
  }

  return response.json();
};

const isTokenExpiring = (minValidity) => {
  if (!tokenParsed?.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return tokenParsed.exp - now < minValidity;
};

export const subscribeToAuthState = (callback) => {
  authStateSubscribers.add(callback);

  return () => {
    authStateSubscribers.delete(callback);
  };
};

export const initKeycloak = async () => {
  if (isInitialized) {
    return !!accessToken;
  }

  isInitialized = true;
  notifyAuthSubscribers();
  return false;
};

export const login = async ({ username, password }) => {
  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  const tokenData = await requestToken({
    grant_type: 'password',
    username,
    password,
    scope: 'openid',
  });

  setStoredTokens(tokenData);
  notifyAuthSubscribers();
  return true;
};

export const logout = () => {
  clearStoredTokens();
  notifyAuthSubscribers();
};

export const getToken = () => accessToken;

export const getUsername = () =>
  tokenParsed?.preferred_username || tokenParsed?.name || '';

export const refreshToken = async (minValidity = 30) => {
  if (!accessToken) {
    return null;
  }

  if (!isTokenExpiring(minValidity)) {
    return accessToken;
  }

  if (!refreshTokenValue) {
    clearStoredTokens();
    notifyAuthSubscribers();
    return null;
  }

  try {
    const tokenData = await requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
    });

    setStoredTokens(tokenData);
    notifyAuthSubscribers();
    return accessToken;
  } catch (error) {
    clearStoredTokens();
    notifyAuthSubscribers();
    return null;
  }
};

export const getUserRoles = () => {
  const roles = tokenParsed?.realm_access?.roles;
  return Array.isArray(roles) ? roles : [];
};

export const hasRole = (role) => getUserRoles().includes(role);