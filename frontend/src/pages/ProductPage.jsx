import React from 'react';
import { useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';

/**
 * ProductPage
 * @component
 * @description Book detail page.
 * @returns {JSX.Element}
 */
const ProductPage = () => {
  usePageTitle('Detalhes do Livro');
  const { id } = useParams();

  return (
    <div className="container page-container" data-testid="product-page">
      <h1 className="mb-4">Detalhes do Livro</h1>
      <p className="text-muted">ID: {id}</p>
      <div className="alert alert-info">
        Página do livro em desenvolvimento. Implementado em FE-011.
      </div>
    </div>
  );
};

export default ProductPage;
