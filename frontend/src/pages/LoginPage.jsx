import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import usePageTitle from '../hooks/usePageTitle';
import LoginForm from '../components/auth/LoginForm';

/**
 * LoginPage
 * @component
 * @description Login page — delegates form rendering and local validation to
 * LoginForm; this container handles async auth logic and navigation.
 * @returns {JSX.Element}
 */
const LoginPage = () => {
  usePageTitle('Entrar');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const from = location.state?.from?.pathname || ROUTES.HOME;

  const handleSubmit = async ({ email, senha }) => {
    setServerError('');
    setLoading(true);
    try {
      await login(email, senha);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" data-testid="login-page">
      <div className="row justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Entrar</h2>
              <LoginForm
                onSubmit={handleSubmit}
                loading={loading}
                serverError={serverError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
