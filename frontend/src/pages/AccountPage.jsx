import React from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../store/authContext';
import { ROUTES } from '../utils/constants';

/**
 * AccountPage
 * @component
 * @description Customer account dashboard page.
 * @returns {JSX.Element}
 */
const AccountPage = () => {
  usePageTitle('Minha Conta');
  const { user } = useAuth();

  return (
    <div className="container page-container" data-testid="account-page">
      <h1 className="mb-4">Minha Conta</h1>

      {user && (
        <div className="alert alert-light border mb-4">
          <strong>Olá, {user.nome || user.name || 'Cliente'}!</strong>
          {user.ranking && <span className="ms-2 badge bg-warning text-dark">{user.ranking}</span>}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-4">
          <Link
            to={ROUTES.ACCOUNT + '/profile'}
            className="card text-decoration-none text-dark h-100"
            data-testid="account-profile-link"
          >
            <div className="card-body text-center py-4">
              <div className="fs-1 mb-2">👤</div>
              <h5>Dados Pessoais</h5>
              <p className="text-muted small mb-0">Editar perfil e informações</p>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link
            to={ROUTES.ORDER_HISTORY}
            className="card text-decoration-none text-dark h-100"
            data-testid="account-orders-link"
          >
            <div className="card-body text-center py-4">
              <div className="fs-1 mb-2">📦</div>
              <h5>Meus Pedidos</h5>
              <p className="text-muted small mb-0">Histórico e acompanhamento</p>
            </div>
          </Link>
        </div>

        <div className="col-md-4">
          <Link
            to={ROUTES.CHANGE_PASSWORD}
            className="card text-decoration-none text-dark h-100"
            data-testid="account-change-password-link"
          >
            <div className="card-body text-center py-4">
              <div className="fs-1 mb-2">🔒</div>
              <h5>Alterar Senha</h5>
              <p className="text-muted small mb-0">Segurança da conta</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
