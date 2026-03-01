import React from 'react';
import usePageTitle from '../hooks/usePageTitle';

/**
 * CheckoutPage
 * @component
 * @description Order checkout page.
 * @returns {JSX.Element}
 */
const CheckoutPage = () => {
  usePageTitle('Checkout');

  return (
    <div className="container page-container" data-testid="checkout-page">
      <h1 className="mb-4">Checkout</h1>
      <div className="alert alert-info">
        Checkout em desenvolvimento. Implementado em FE-015 a FE-018.
      </div>
    </div>
  );
};

export default CheckoutPage;
