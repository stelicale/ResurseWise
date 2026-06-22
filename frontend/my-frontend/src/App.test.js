import { fireEvent, render, screen } from '@testing-library/react';
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

const mockUseAuth = jest.fn();

jest.mock('./context/AuthContext', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => mockUseAuth(),
}));

jest.mock('./context/DataContext', () => ({
  DataProvider: ({ children }) => <div>{children}</div>,
  useData: () => ({ resources: [], categories: [], users: [], logs: [] }),
}));

test('renders the app without crashing', () => {
  mockUseAuth.mockReturnValue({
    isInitialized: true,
    isAuthenticated: false,
    isAdmin: false,
    username: '',
    roles: [],
    login: jest.fn(),
    logout: jest.fn(),
  });
  render(<App />);
  expect(document.body).toBeTruthy();
});

test('shows landing page for unauthenticated users', () => {
  mockUseAuth.mockReturnValue({
    isInitialized: true,
    isAuthenticated: false,
    isAdmin: false,
    username: '',
    roles: [],
    login: jest.fn(),
    logout: jest.fn(),
  });
  render(<App />);
  expect(document.querySelector('.App')).toBeInTheDocument();
});

test('shows and opens API Test Suite when authenticated', async () => {
  mockUseAuth.mockReturnValue({
    isInitialized: true,
    isAuthenticated: true,
    isAdmin: true,
    username: 'admin',
    roles: ['Admin'],
    login: jest.fn(),
    logout: jest.fn(),
  });

  render(<App />);
  const toggleButton = screen.getByTitle('Run API Tests');
  expect(toggleButton).toBeInTheDocument();

  fireEvent.click(toggleButton);
  expect(screen.getByRole('heading', { name: 'API Test Suite' })).toBeInTheDocument();
});
