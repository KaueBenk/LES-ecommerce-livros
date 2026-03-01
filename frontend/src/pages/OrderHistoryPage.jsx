import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import customerService from '../services/customerService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PAGE_SIZE = 20;

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  EM_PROCESSAMENTO: { label: 'Em Processamento', className: 'bg-warning text-dark' },
  AGUARDANDO_PAGAMENTO: { label: 'Aguardando Pagamento', className: 'bg-warning text-dark' },
  APROVADO: { label: 'Aprovado', className: 'bg-warning text-dark' },
  ENTREGUE: { label: 'Entregue', className: 'bg-success' },
  REPROVADA: { label: 'Reprovada', className: 'bg-danger' },
  CANCELADO: { label: 'Cancelado', className: 'bg-danger' },
  EM_TRANSITO: { label: 'Em Trânsito', className: 'bg-info text-dark' },
  EM_TRANSPORTE: { label: 'Em Transporte', className: 'bg-info text-dark' },
  EM_TROCA: { label: 'Em Troca', className: 'bg-secondary' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-secondary' };
  return (
    <span className={`badge ${cfg.className}`} data-testid="order-status-badge">
      {cfg.label}
    </span>
  );
};

// ─── Exchange modal ───────────────────────────────────────────────────────────

/**
 * ExchangeModal
 * @description Bootstrap-style modal for submitting an exchange request.
 *   Each item has a checkbox + quantity selector. One shared justification textarea.
 */
const ExchangeModal = ({ order, onClose, onSuccess }) => {
  const { success, error: notifyError } = useNotification();

  // Per-item state: { [itemId]: { selected, qty } }
  const buildInitial = () => {
    const map = {};
    (order.itens ?? []).forEach((item) => {
      map[item.id ?? item.livroId] = { selected: false, qty: 1 };
    });
    return map;
  };

  const [itemState, setItemState] = useState(buildInitial);
  const [justificativa, setJustificativa] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const toggleSelected = (key) => {
    setItemState((prev) => ({
      ...prev,
      [key]: { ...prev[key], selected: !prev[key].selected },
    }));
  };

  const setQty = (key, val) => {
    const item = order.itens.find((i) => (i.id ?? i.livroId) === key);
    const max = item?.quantidade ?? 99;
    const clamped = Math.max(1, Math.min(max, Number(val)));
    setItemState((prev) => ({ ...prev, [key]: { ...prev[key], qty: clamped } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    const selectedItems = Object.entries(itemState)
      .filter(([, v]) => v.selected)
      .map(([key, v]) => ({ itemPedidoId: Number(key), quantidade: v.qty, justificativa }));

    if (selectedItems.length === 0) {
      setServerError('Selecione pelo menos um item para troca.');
      return;
    }
    if (!justificativa.trim()) {
      setServerError('A justificativa é obrigatória.');
      return;
    }

    setSubmitting(true);
    try {
      await customerService.requestExchange(order.id, selectedItems);
      success('Solicitação de troca enviada');
      onSuccess();
    } catch (err) {
      const msg = getErrorMessage(err) || 'Erro ao enviar solicitação de troca.';
      setServerError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
        data-testid="exchange-modal-backdrop"
      />

      {/* Modal */}
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exchange-modal-title"
        style={{ zIndex: 1050 }}
        data-testid="exchange-modal"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exchange-modal-title">
                Solicitar Troca —{' '}
                <span className="text-muted">
                  {order.numeroNota || order.numero || `PED-${order.id}`}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Fechar"
                data-testid="exchange-modal-close"
              />
            </div>

            <form onSubmit={handleSubmit} data-testid="exchange-form">
              <div className="modal-body">
                {serverError && (
                  <div className="alert alert-danger mb-3" data-testid="exchange-error">
                    {serverError}
                  </div>
                )}

                {/* Items selection */}
                <h6 className="fw-semibold mb-3">Selecione os itens para troca:</h6>
                <div className="table-responsive mb-4">
                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: 40 }}></th>
                        <th>Título</th>
                        <th className="text-center">Qtd Pedida</th>
                        <th className="text-center">Qtd Troca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.itens ?? []).map((item) => {
                        const key = item.id ?? item.livroId;
                        const st = itemState[key] ?? { selected: false, qty: 1 };
                        return (
                          <tr key={key} data-testid={`exchange-item-row-${key}`}>
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`exchange-chk-${key}`}
                                checked={st.selected}
                                onChange={() => toggleSelected(key)}
                                data-testid={`exchange-chk-${key}`}
                              />
                            </td>
                            <td>
                              <label htmlFor={`exchange-chk-${key}`} className="mb-0">
                                {item.titulo}
                              </label>
                            </td>
                            <td className="text-center">{item.quantidade}</td>
                            <td className="text-center" style={{ width: 100 }}>
                              <input
                                type="number"
                                className="form-control form-control-sm text-center"
                                min={1}
                                max={item.quantidade}
                                value={st.qty}
                                onChange={(e) => setQty(key, e.target.value)}
                                disabled={!st.selected}
                                data-testid={`exchange-qty-${key}`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Justification */}
                <div className="mb-3">
                  <label htmlFor="exchange-justificativa" className="form-label fw-semibold">
                    Justificativa <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="exchange-justificativa"
                    className="form-control"
                    rows={4}
                    placeholder="Descreva o motivo da troca (produto com defeito, item errado, etc.)..."
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    maxLength={500}
                    required
                    data-testid="exchange-justificativa"
                  />
                  <div className="form-text text-end">{justificativa.length}/500</div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={submitting}
                  data-testid="exchange-cancel-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-warning"
                  disabled={submitting}
                  data-testid="exchange-submit-btn"
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Troca'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Order card ───────────────────────────────────────────────────────────────

const OrderCard = ({ order, onExchange }) => {
  const [expanded, setExpanded] = useState(false);

  const numero = order.numeroNota || order.numero || `PED-${order.id}`;
  const date = order.dataPedido
    ? new Date(order.dataPedido).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';
  const totalItens = order.itens?.reduce((s, i) => s + i.quantidade, 0) ?? 0;

  return (
    <div className="card mb-3" data-testid={`order-card-${order.id}`}>
      <div
        className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2"
        style={{ cursor: 'pointer' }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        data-testid={`order-toggle-${order.id}`}
      >
        {/* Left: number + date */}
        <div className="d-flex align-items-center gap-3">
          <strong data-testid="order-numero">{numero}</strong>
          <span className="text-muted small" data-testid="order-date">{date}</span>
        </div>

        {/* Center: badge + items */}
        <div className="d-flex align-items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-muted small">
            {totalItens} {totalItens === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {/* Right: total + chevron */}
        <div className="d-flex align-items-center gap-3">
          <strong className="text-primary" data-testid="order-total">
            {formatCurrency(order.valorTotal ?? 0)}
          </strong>
          <span
            style={{
              display: 'inline-block',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="card-body" data-testid={`order-detail-${order.id}`}>
          {/* Items list */}
          {order.itens && order.itens.length > 0 && (
            <div className="mb-3">
              <h6 className="fw-bold mb-2">Itens</h6>
              <table className="table table-sm table-borderless mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Título</th>
                    <th className="text-center">Qtd</th>
                    <th className="text-end">Preço Unit.</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.itens.map((item, idx) => (
                    <tr key={item.livroId ?? idx}>
                      <td>
                        <Link
                          to={`/product/${item.livroId}`}
                          className="text-decoration-none"
                        >
                          {item.titulo}
                        </Link>
                      </td>
                      <td className="text-center">{item.quantidade}</td>
                      <td className="text-end">{formatCurrency(item.valorUnitario)}</td>
                      <td className="text-end">
                        {formatCurrency(item.valorUnitario * item.quantidade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Shipping address */}
          {order.enderecoEntrega && (
            <div className="mb-3">
              <h6 className="fw-bold mb-1">Endereço de Entrega</h6>
              <p className="mb-0 text-muted small" data-testid="order-address">
                {order.enderecoEntrega.logradouro}, {order.enderecoEntrega.numero}
                {order.enderecoEntrega.complemento
                  ? ` — ${order.enderecoEntrega.complemento}`
                  : ''}{' '}
                — {order.enderecoEntrega.bairro}, {order.enderecoEntrega.cidade}/
                {order.enderecoEntrega.estado} — CEP {order.enderecoEntrega.cep}
              </p>
            </div>
          )}

          {/* Payment method */}
          {order.pagamento && (
            <div className="mb-3">
              <h6 className="fw-bold mb-1">Pagamento</h6>
              <p className="mb-0 text-muted small" data-testid="order-payment">
                {order.pagamento.bandeira
                  ? `${order.pagamento.bandeira} final ${order.pagamento.ultimosDigitos}`
                  : order.pagamento.tipo ?? 'N/A'}
              </p>
            </div>
          )}

          {/* Totals */}
          <div className="d-flex flex-column align-items-end gap-1 small">
            {order.valorFrete != null && (
              <span className="text-muted">
                Frete: <strong>{formatCurrency(order.valorFrete)}</strong>
              </span>
            )}
            <span>
              Total: <strong className="text-primary fs-6">{formatCurrency(order.valorTotal ?? 0)}</strong>
            </span>
          </div>

          {/* Exchange request button — only for ENTREGUE orders */}
          {order.status === 'ENTREGUE' && onExchange && (
            <div className="mt-3 pt-3 border-top d-flex justify-content-end">
              <button
                type="button"
                className="btn btn-outline-warning btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onExchange(order);
                }}
                data-testid={`exchange-btn-${order.id}`}
              >
                🔄 Solicitar Troca
              </button>
            </div>
          )}

          {/* EM_TROCA indicator */}
          {order.status === 'EM_TROCA' && (
            <div className="mt-3 pt-3 border-top">
              <span className="badge bg-warning text-dark" data-testid="order-em-troca-badge">
                Troca em andamento
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── OrderHistoryPage ─────────────────────────────────────────────────────────

/**
 * OrderHistoryPage
 * @component
 * @description Customer order history page — vertical timeline of orders with
 *   expandable detail view, exchange requests, pagination, and status badges.
 */
const OrderHistoryPage = () => {
  usePageTitle('Meus Pedidos');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [exchangeTarget, setExchangeTarget] = useState(null); // order being exchanged

  const fetchOrders = useCallback(async (p = 0) => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await customerService.getTransactions(p, PAGE_SIZE);
      setOrders(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [fetchOrders, page]);

  const handleExchangeSuccess = () => {
    // Optimistically update the order status in local state
    if (exchangeTarget) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === exchangeTarget.id ? { ...o, status: 'EM_TROCA' } : o
        )
      );
    }
    setExchangeTarget(null);
    // Refresh from server to get canonical state
    fetchOrders(page);
  };

  return (
    <div className="container page-container" data-testid="order-history-page">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0">Meus Pedidos</h1>
        {totalElements > 0 && (
          <span className="text-muted small">{totalElements} pedido{totalElements !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner />}

      {/* Error */}
      {!loading && fetchError && (
        <div className="alert alert-danger" data-testid="orders-error">
          {fetchError}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={() => fetchOrders(page)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !fetchError && orders.length === 0 && (
        <div
          className="d-flex flex-column align-items-center justify-content-center py-5 text-muted"
          data-testid="orders-empty"
        >
          <span style={{ fontSize: '3rem' }}>📦</span>
          <p className="mt-3 mb-2 fs-5">Você ainda não realizou nenhum pedido.</p>
          <Link to={ROUTES.CATALOG} className="btn btn-primary mt-2">
            Explorar Catálogo
          </Link>
        </div>
      )}

      {/* Timeline */}
      {!loading && !fetchError && orders.length > 0 && (
        <>
          {/* Vertical timeline container */}
          <div
            className="position-relative ps-4"
            style={{ borderLeft: '2px solid #dee2e6' }}
            data-testid="orders-timeline"
          >
            {orders.map((order) => (
              <div key={order.id} className="position-relative mb-1">
                {/* Timeline dot */}
                <span
                  className="position-absolute"
                  style={{
                    left: '-1.35rem',
                    top: '1rem',
                    width: '0.75rem',
                    height: '0.75rem',
                    borderRadius: '50%',
                    background:
                      STATUS_CONFIG[order.status]?.className?.includes('success')
                        ? '#198754'
                        : STATUS_CONFIG[order.status]?.className?.includes('danger')
                        ? '#dc3545'
                        : STATUS_CONFIG[order.status]?.className?.includes('info')
                        ? '#0dcaf0'
                        : '#ffc107',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2px #dee2e6',
                  }}
                  aria-hidden="true"
                />
                <OrderCard
                  order={order}
                  onExchange={setExchangeTarget}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Páginas de pedidos" className="mt-4">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="page-prev"
                  >
                    ‹
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(i)}
                      data-testid={`page-${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="page-next"
                  >
                    ›
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      {/* Exchange modal */}
      {exchangeTarget && (
        <ExchangeModal
          order={exchangeTarget}
          onClose={() => setExchangeTarget(null)}
          onSuccess={handleExchangeSuccess}
        />
      )}
    </div>
  );
};

export default OrderHistoryPage;
