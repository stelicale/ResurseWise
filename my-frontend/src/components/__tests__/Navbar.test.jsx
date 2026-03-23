/**
 * Navbar – role-based UI visibility & collapsible mobile menu
 *
 * Tests verify:
 *   - Unauthenticated state: Sign in button visible, nav tabs hidden
 *   - Employee role: only non-admin tabs (Resources, Categories) visible
 *   - Admin role: all four tabs (+ Users, Logs) visible
 *   - Hamburger: toggles the mobile dropdown open / closed
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext');
jest.mock('react-toastify', () => ({ toast: { error: jest.fn() } }));

const baseAuth = { login: jest.fn(), logout: jest.fn() };

function renderNavbar(overrides = {}) {
  useAuth.mockReturnValue({ ...baseAuth, ...overrides });
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
    </MemoryRouter>
  );
}

describe('Navbar – unauthenticated state', () => {
  beforeEach(() => renderNavbar({ isAuthenticated: false, isAdmin: false, username: '' }));

  test('does not show inline username/password inputs', () => {
    expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Password')).not.toBeInTheDocument();
  });

  test('shows Sign in button', () => {
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('hides navigation tabs when not logged in', () => {
    expect(screen.queryByText('Resources')).not.toBeInTheDocument();
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Logs')).not.toBeInTheDocument();
  });
});

describe('Navbar – role-based UI visibility (Employee)', () => {
  beforeEach(() => renderNavbar({ isAuthenticated: true, isAdmin: false, username: 'emp1' }));

  test('shows Resources and Categories tabs', () => {
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  test('hides admin-only tabs: Users and Logs', () => {
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Logs')).not.toBeInTheDocument();
  });

  test('shows Employee role badge', () => {
    expect(screen.getByText('Employee')).toBeInTheDocument();
  });

  test('shows Logout button', () => {
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});

describe('Navbar – role-based UI visibility (Admin)', () => {
  beforeEach(() => renderNavbar({ isAuthenticated: true, isAdmin: true, username: 'admin1' }));

  test('shows all four navigation tabs including admin-only ones', () => {
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  test('shows Admin role badge', () => {
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});

describe('Navbar – hamburger collapsible mobile menu', () => {
  beforeEach(() => renderNavbar({ isAuthenticated: true, isAdmin: false, username: 'u1' }));

  test('mobile dropdown is hidden before hamburger is pressed', () => {
    expect(
      screen.queryByRole('navigation', { name: /mobile navigation/i })
    ).not.toBeInTheDocument();
  });

  test('pressing hamburger opens the mobile dropdown', () => {
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    expect(
      screen.getByRole('navigation', { name: /mobile navigation/i })
    ).toBeInTheDocument();
  });

  test('pressing hamburger again closes the mobile dropdown', () => {
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    fireEvent.click(screen.getByRole('button', { name: /close menu/i }));
    expect(
      screen.queryByRole('navigation', { name: /mobile navigation/i })
    ).not.toBeInTheDocument();
  });

  test('mobile dropdown shows only the tabs visible to the current role', () => {
    fireEvent.click(screen.getByRole('button', { name: /open navigation menu/i }));
    const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(mobileNav).toHaveTextContent('Resources');
    expect(mobileNav).toHaveTextContent('Categories');
    expect(mobileNav).not.toHaveTextContent('Users');
    expect(mobileNav).not.toHaveTextContent('Logs');
  });
});
