import { useAuth } from '../store/authContext';

/**
 * useAuth hook — exposes auth state and actions.
 * @returns {{ user, token, loading, isAuthenticated, login, logout, updateUser }}
 */
export { useAuth as default } from '../store/authContext';
