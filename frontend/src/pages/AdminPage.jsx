import React from 'react';
import usePageTitle from '../hooks/usePageTitle';

/**
 * AdminPage
 * @component
 * @description Admin dashboard page.
 * @returns {JSX.Element}
 */
const AdminPage = () => {
  usePageTitle('Administração');

  return (
    <div className="container page-container" data-testid="admin-page">
      <h1 className="mb-4">Painel Administrativo</h1>
      <div className="alert alert-info">
        Painel admin em desenvolvimento. Implementado em FE-020 a FE-030.
      </div>
    </div>
  );
};

export default AdminPage;
