import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../utils/constants';

/**
 * OrderConfirmationPage
 * Displayed after a successful checkout finalization.
 * Receives order data via React Router location state:
 *   { pedidoId, numero, status, valorTotal, dataCompra, dataEntregaPrevista }
 */
const OrderConfirmationPage = () => {
  usePageTitle('Pedido Confirmado');
  const navigate = useNavigate();
  const { state } = useLocation();
  const order = state?.order ?? null;

  // If arrived without state (direct navigation), redirect home
  if (!order) {
    return (
      <div
        className="container page-container text-center py-5"
        data-testid="order-confirmation-no-state"
      >
        <div className="mb-4" style={{ fontSize: '4rem' }}>📦</div>
        <h1 className="h3 fw-bold mb-3">Nenhum pedido encontrado</h1>
        <p className="text-muted mb-4">
          Acesse o histórico de pedidos para ver seus pedidos.
        </p>
        <Link to={ROUTES.ORDER_HISTORY} className="btn btn-primary me-2">
          Meus Pedidos
        </Link>
        <Link to={ROUTES.HOME} className="btn btn-outline-secondary">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const dataCompra = order.dataCompra
    ? new Date(order.dataCompra).toLocaleString('pt-BR')
    : null;
  const dataEntrega = order.dataEntregaPrevista
    ? new Date(order.dataEntregaPrevista).toLocaleDateString('pt-BR')
    : null;

  return (
    <div
      className="container page-container"
      data-testid="order-confirmation-page"
    >
      {/* Success banner */}
      <div className="text-center mb-5">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success mb-4"
          style={{ width: 80, height: 80 }}
          data-testid="confirmation-icon"
          aria-hidden="true"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            fill="white"
            viewBox="0 0 16 16"
          >
            <path d="M13.485 1.431a1.473 1.473 0 0 1 2.104 2.062l-7.84 9.801a1.473 1.473 0 0 1-2.12.04L.431 8.138a1.473 1.473 0 0 1 2.084-2.083l4.111 4.112 6.88-8.736z" />
          </svg>
        </div>
        <h1 className="h2 fw-bold mb-2" data-testid="confirmation-title">
          Pedido Confirmado!
        </h1>
        <p className="text-muted lead" data-testid="confirmation-subtitle">
          Obrigado pela sua compra. Seu pedido foi recebido e está sendo processado.
        </p>
      </div>

      {/* Order card */}
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="card shadow-sm mb-4" data-testid="confirmation-card">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <span className="fw-semibold">Detalhes do Pedido</span>
              <span
                className="badge bg-white text-success fs-6 fw-bold"
                data-testid="order-number"
              >
                {order.numero}
              </span>
            </div>

            <div className="card-body">
              {/* Key info grid */}
              <dl className="row mb-0">
                <dt className="col-sm-5 text-muted">Número do pedido</dt>
                <dd className="col-sm-7 fw-semibold">{order.numero}</dd>

                <dt className="col-sm-5 text-muted">Status</dt>
                <dd className="col-sm-7">
                  <span
                    className="badge bg-success"
                    data-testid="order-status"
                  >
                    {order.status === 'APROVADA' ? 'Aprovado' : order.status}
                  </span>
                </dd>

                <dt className="col-sm-5 text-muted">Valor total</dt>
                <dd
                  className="col-sm-7 fw-bold text-primary"
                  data-testid="order-total"
                >
                  {formatCurrency(order.valorTotal ?? 0)}
                </dd>

                {dataCompra && (
                  <>
                    <dt className="col-sm-5 text-muted">Data da compra</dt>
                    <dd className="col-sm-7" data-testid="order-date">
                      {dataCompra}
                    </dd>
                  </>
                )}

                {dataEntrega && (
                  <>
                    <dt className="col-sm-5 text-muted">Entrega prevista</dt>
                    <dd
                      className="col-sm-7 fw-semibold text-success"
                      data-testid="order-delivery-date"
                    >
                      {dataEntrega}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Actions */}
          <div className="d-flex gap-3 flex-wrap justify-content-center">
            <Link
              to={ROUTES.ORDER_HISTORY}
              className="btn btn-primary"
              data-testid="view-orders-btn"
            >
              Ver Meus Pedidos
            </Link>
            <Link
              to={ROUTES.CATALOG}
              className="btn btn-outline-secondary"
              data-testid="continue-shopping-btn"
            >
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
