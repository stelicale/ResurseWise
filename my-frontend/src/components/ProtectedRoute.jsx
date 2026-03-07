import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route element with role-based access control.
 *
 * - Unauthenticated users  → redirect to /  (with `state.from` so a future
 *   login flow could send them back to the page they requested)
 * - Authenticated non-admins trying to reach an adminOnly route
 *                          → redirect to /resources
 * - Authorized users       → render children as-is
 *
 * NOTE: This is a frontend UX guard only. All backend API endpoints
 * independently enforce role-based access via Keycloak.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/resources" replace />;
  }

  return children;
};

export default ProtectedRoute;
