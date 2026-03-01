import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { useCart } from '../store/cartContext';
import { formatCurrency } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

/**
 * CartPage
 * @component
 * @description Shopping cart page.
 * @returns {JSX.Element}
 */
const CartPage = () => {
  usePageTitle('Carrinho');
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="container page-container text-center" data-testid="cart-page">
        <h1 className="mb-4">Carrinho</h1>
        <p className="text-muted mb-4">Seu carrinho está vazio.</p>
        <Link to={ROUTES.CATALOG} className="btn btn-primary">
          Ir ao Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container page-container" data-testid="cart-page">
      <h1 className="mb-4">Carrinho ({totalItems} itens)</h1>

      <div className="row">
        <div className="col-md-8">
          {items.map((item) => (
            <div key={item.id} className="card mb-3" data-testid={`cart-item-${item.id}`}>
              <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{item.titulo || item.title}</h6>
                  <small className="text-muted">{formatCurrency(item.precoVenda || item.price || 0)}</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    data-testid={`decrease-qty-${item.id}`}
                  >
                    -
                  </button>
                  <span data-testid={`qty-${item.id}`}>{item.quantity}</span>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    data-testid={`increase-qty-${item.id}`}
                  >
                    +
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeItem(item.id)}
                    data-testid={`remove-item-${item.id}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Resumo</h5>
              <p className="mb-1">
                Total: <strong>{formatCurrency(totalPrice)}</strong>
              </p>
              <Link to={ROUTES.CHECKOUT} className="btn btn-primary w-100 mt-3" data-testid="checkout-btn">
                Finalizar Compra
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
