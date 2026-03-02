import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../store/authContext';
import { ROUTES } from '../../utils/constants';

/**
 * ProtectedRoute
 * @component
 * @description Redirects unauthenticated users to login. Passes location for post-login redirect.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content.
 * @param {boolean} props.adminOnly - Restrict to admin users.
 * @returns {JSX.Element}
 */
const ProtectedRoute = ({ children, adminOnly }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  // In demo mode, auto-login as admin
  if (isDemoMode && !isAuthenticated) {
    const { mockUser } = require('../../services/mockData');
    const { login } = require('../../store/authContext');
    // This will be handled by AuthContext initialization in demo mode
  }

  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (adminOnly && !isDemoMode && !user?.roles?.includes('ADMIN') && user?.role !== 'ADMIN') {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};

ProtectedRoute.defaultProps = {
  adminOnly: false,
};

export default ProtectedRoute;
