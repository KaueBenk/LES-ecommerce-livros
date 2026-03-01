import React from 'react';
import usePageTitle from '../hooks/usePageTitle';

/**
 * OrderHistoryPage
 * @component
 * @description Customer order history page.
 * @returns {JSX.Element}
 */
const OrderHistoryPage = () => {
  usePageTitle('Meus Pedidos');

  return (
    <div className="container page-container" data-testid="order-history-page">
      <h1 className="mb-4">Meus Pedidos</h1>
      <div className="alert alert-info">
        Histórico de pedidos em desenvolvimento. Implementado em FE-007.
      </div>
    </div>
  );
};

export default OrderHistoryPage;
