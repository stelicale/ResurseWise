/**
 * ProtectedRoute – rendering of protected routes
 *
 * Tests cover all three access-control outcomes:
 *   1. Unauthenticated  → redirect to /
 *   2. Non-admin on adminOnly route → redirect to /resources
 *   3. Authorised user  → renders children
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../context/AuthContext');

function renderWithRouter(ui, initialPath = '/protected') {
  return render(
    <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/"          element={<div>Home Page</div>} />
        <Route path="/resources" element={<div>Resources Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute – rendering of protected routes', () => {
  test('redirects unauthenticated user to home page', () => {
    useAuth.mockReturnValue({ isAuthenticated: false, isAdmin: false });

    renderWithRouter(
      <ProtectedRoute><span>Secret Content</span></ProtectedRoute>
    );

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('renders children for authenticated user on a non-admin route', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isAdmin: false });

    renderWithRouter(
      <ProtectedRoute><span>Dashboard</span></ProtectedRoute>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  test('renders children for admin user on an adminOnly route', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isAdmin: true });

    renderWithRouter(
      <ProtectedRoute adminOnly><span>Admin Panel</span></ProtectedRoute>
    );

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  test('redirects non-admin authenticated user away from adminOnly routes to /resources', () => {
    useAuth.mockReturnValue({ isAuthenticated: true, isAdmin: false });

    renderWithRouter(
      <ProtectedRoute adminOnly><span>Admin Panel</span></ProtectedRoute>
    );

    expect(screen.getByText('Resources Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });
});
