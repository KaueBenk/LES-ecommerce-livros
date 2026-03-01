import React from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { ROUTES } from '../utils/constants';

/**
 * NotFoundPage
 * @component
 * @description 404 Not Found page.
 * @returns {JSX.Element}
 */
const NotFoundPage = () => {
  usePageTitle('Página não encontrada');

  return (
    <div className="container page-container text-center" data-testid="not-found-page">
      <div className="py-5">
        <h1 className="display-1 text-muted">404</h1>
        <h2 className="mb-3">Página não encontrada</h2>
        <p className="text-muted mb-4">
          A página que você procura não existe ou foi movida.
        </p>
        <Link to={ROUTES.HOME} className="btn btn-primary" data-testid="back-home-link">
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
