import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import usePageTitle from '../hooks/usePageTitle';
import RegisterForm from '../components/auth/RegisterForm';

/**
 * RegisterPage
 * @component
 * @description New customer registration page — delegates form rendering and
 * local validation to RegisterForm; this container handles the async API call
 * and navigation.
 * @returns {JSX.Element}
 */
const RegisterPage = () => {
  usePageTitle('Criar Conta');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (formData) => {
    setServerError('');
    setLoading(true);
    try {
      await authService.register(formData);
      navigate(ROUTES.LOGIN, { state: { registered: true } });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" data-testid="register-page">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Criar Conta</h2>
              <RegisterForm
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

export default RegisterPage;
