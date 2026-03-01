import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import authService from '../services/authService';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import ChangePasswordForm from '../components/account/ChangePasswordForm';

/**
 * ChangePasswordPage
 * @component
 * @description Page allowing authenticated users to change their password.
 * @returns {JSX.Element}
 */
const ChangePasswordPage = () => {
  usePageTitle('Alterar Senha');

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (senhaAtual, novaSenha, confirmacaoSenha) => {
    setServerError('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      await authService.changePassword(senhaAtual, novaSenha, confirmacaoSenha);
      setSuccessMessage('Senha alterada com sucesso!');
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page-container" data-testid="change-password-page">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={ROUTES.ACCOUNT}>Minha Conta</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Alterar Senha
          </li>
        </ol>
      </nav>

      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h1 className="h4 mb-1">🔒 Alterar Senha</h1>
              <p className="text-muted small mb-4">
                Digite sua senha atual e escolha uma nova senha segura.
              </p>

              <ChangePasswordForm
                onSubmit={handleSubmit}
                submitting={submitting}
                serverError={serverError}
                successMessage={successMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
