import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./auth/keycloak', () => ({
  init: jest.fn().mockResolvedValue(false),
  onAuthSuccess: null,
  onAuthError: null,
  onTokenExpired: null,
  authenticated: false,
  token: null,
  tokenParsed: null,
  updateToken: jest.fn().mockResolvedValue(false),
  login: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    isInitialized: true,
    isAuthenticated: false,
    isAdmin: false,
    username: '',
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('./context/DataContext', () => ({
  DataProvider: ({ children }) => <div>{children}</div>,
  useData: () => ({ resources: [], categories: [], users: [], logs: [] }),
}));

test('renders the app without crashing', () => {
  render(<App />);
  expect(document.body).toBeTruthy();
});

test('shows landing page for unauthenticated users', () => {
  render(<App />);
  expect(document.querySelector('.App')).toBeInTheDocument();
});
