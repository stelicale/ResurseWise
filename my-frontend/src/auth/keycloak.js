const runtimeEnv = window.__env || {};
const keycloakConfig = {
  realm: runtimeEnv.KEYCLOAK_REALM || process.env.REACT_APP_KEYCLOAK_REALM || 'ITResurceManager',
  clientId: runtimeEnv.KEYCLOAK_CLIENT_ID || process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'spring-backend',
  clientSecret:
    runtimeEnv.KEYCLOAK_CLIENT_SECRET || process.env.REACT_APP_KEYCLOAK_CLIENT_SECRET || '',
};

const proxyPrefix =
  runtimeEnv.KEYCLOAK_PROXY_PREFIX || process.env.REACT_APP_KEYCLOAK_PROXY_PREFIX || '/keycloak';
const keycloakPublicBaseUrl = (
  runtimeEnv.KEYCLOAK_URL ||
  process.env.REACT_APP_KEYCLOAK_URL ||
  `${window.location.origin}${proxyPrefix}`
).replace(/\/$/, '');
const tokenEndpoint = `${keycloakPublicBaseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
const authorizationEndpoint = `${keycloakPublicBaseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;
const logoutEndpoint = `${keycloakPublicBaseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;
const redirectUri = `${window.location.origin}/auth-callback`;
const postLogoutRedirectUri = `${window.location.origin}/`;

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const canUsePkce = Boolean(window.crypto && window.crypto.subtle);

const generateCodeVerifier = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

const generateCodeChallenge = async (verifier) => {
  if (!canUsePkce) {
    return null;
  }

  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
};

let isInitialized = false;
let accessToken = null;
let refreshTokenValue = null;
let tokenParsed = null;
let refreshPromise = null;
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
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = decodeURIComponent(
      atob(paddedBase64)
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

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Authentication request failed (${response.status}): ${errorBody.slice(0, 120)}`);
  }

  if (!contentType.includes('application/json')) {
    const nonJsonBody = await response.text();
    throw new Error(`Authentication endpoint returned non-JSON response: ${nonJsonBody.slice(0, 120)}`);
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

export const login = async () => {
  let codeVerifier = null;
  let codeChallenge = null;

  if (canUsePkce) {
    codeVerifier = generateCodeVerifier();
    codeChallenge = await generateCodeChallenge(codeVerifier);
    sessionStorage.setItem('pkce_verifier', codeVerifier);
  }

  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    prompt: 'login',
    max_age: '0',
  });

  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }

  window.location.href = `${authorizationEndpoint}?${params.toString()}`;
};

export const handleAuthCallback = async (code) => {
  const codeVerifier = sessionStorage.getItem('pkce_verifier');

  if (!code) {
    throw new Error('Missing authorization code or PKCE verifier');
  }

  const payload = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  };

  if (codeVerifier) {
    payload.code_verifier = codeVerifier;
  }

  const tokenData = await requestToken(payload);

  setStoredTokens(tokenData);
  if (codeVerifier) {
    sessionStorage.removeItem('pkce_verifier');
  }
  notifyAuthSubscribers();
  return true;
};

export const logout = () => {
  clearStoredTokens();
  notifyAuthSubscribers();

  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri,
    client_id: keycloakConfig.clientId,
  });

  window.location.href = `${logoutEndpoint}?${params.toString()}`;
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

  if (refreshPromise) {
    return refreshPromise;
  }

  if (!refreshTokenValue) {
    clearStoredTokens();
    notifyAuthSubscribers();
    return null;
  }

  refreshPromise = (async () => {
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
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const getUserRoles = () => {
  const roles = tokenParsed?.realm_access?.roles;
  return Array.isArray(roles) ? roles : [];
};

export const hasRole = (role) => {
  const expected = String(role || '').toLowerCase();
  return getUserRoles().some((current) => String(current).toLowerCase() === expected);
};