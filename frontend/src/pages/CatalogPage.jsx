import React from 'react';
import usePageTitle from '../hooks/usePageTitle';

/**
 * CatalogPage
 * @component
 * @description Book catalog page with search and filters.
 * @returns {JSX.Element}
 */
const CatalogPage = () => {
  usePageTitle('Catálogo');

  return (
    <div className="container page-container" data-testid="catalog-page">
      <h1 className="mb-4">Catálogo de Livros</h1>
      <div className="alert alert-info">
        Catálogo em desenvolvimento. Implementado em FE-009 / FE-010.
      </div>
    </div>
  );
};

export default CatalogPage;
