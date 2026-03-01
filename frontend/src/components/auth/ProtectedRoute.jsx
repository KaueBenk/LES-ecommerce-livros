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

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (adminOnly && !user?.roles?.includes('ADMIN') && user?.role !== 'ADMIN') {
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
