import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import adminService from '../services/adminService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const ORDER_STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'EM_PROCESSAMENTO', label: 'Em Processamento' },
  { value: 'APROVADA', label: 'Aprovada' },
  { value: 'EM_TRANSITO', label: 'Em Transporte' },
  { value: 'EM_TRANSPORTE', label: 'Em Transporte' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'EM_TROCA', label: 'Em Troca' },
  { value: 'TROCA_AUTORIZADA', label: 'Troca Autorizada' },
  { value: 'TROCADO', label: 'Trocado' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const STATUS_BADGES = {
  EM_PROCESSAMENTO: 'bg-secondary',
  APROVADA: 'bg-primary',
  EM_TRANSITO: 'bg-info text-dark',
  EM_TRANSPORTE: 'bg-info text-dark',
  ENTREGUE: 'bg-success',
  EM_TROCA: 'bg-warning text-dark',
  TROCA_AUTORIZADA: 'bg-info text-dark',
  TROCADO: 'bg-success',
  CANCELADA: 'bg-danger',
};

const statusLabel = (status) =>
  ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;

// ─── Order Detail Modal ────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ zIndex: 1040 }}
      />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
        style={{ zIndex: 1050 }}
        data-testid="order-detail-modal"
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="order-modal-title">
                Pedido {order.numero ?? `#${order.id}`}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Fechar"
                data-testid="order-modal-close"
              />
            </div>
            <div className="modal-body">
              {/* Summary */}
              <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                  <span className="text-muted small d-block">Número</span>
                  <strong data-testid="modal-order-numero">
                    {order.numero ?? `#${order.id}`}
                  </strong>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-muted small d-block">Data</span>
                  <strong data-testid="modal-order-date">
                    {order.dataPedido
                      ? new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(order.dataPedido))
                      : '—'}
                  </strong>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-muted small d-block">Status</span>
                  <span
                    className={`badge ${STATUS_BADGES[order.status] ?? 'bg-light text-dark'}`}
                    data-testid="modal-order-status"
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="text-muted small d-block">Valor Total</span>
                  <strong className="text-success" data-testid="modal-order-total">
                    {order.valorTotal != null ? formatCurrency(order.valorTotal) : '—'}
                  </strong>
                </div>
              </div>

              {/* Cliente */}
              {order.cliente && (
                <div className="mb-4">
                  <h6 className="fw-semibold text-secondary mb-2">Cliente</h6>
                  <div className="d-flex gap-4 small">
                    <div>
                      <span className="text-muted">Nome: </span>
                      <strong data-testid="modal-client-name">{order.cliente.nome}</strong>
                    </div>
                    {order.cliente.email && (
                      <div>
                        <span className="text-muted">E-mail: </span>
                        <span data-testid="modal-client-email">{order.cliente.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itens */}
              {order.itens && order.itens.length > 0 && (
                <div>
                  <h6 className="fw-semibold text-secondary mb-2">Itens do Pedido</h6>
                  <table
                    className="table table-sm"
                    data-testid="modal-order-items"
                  >
                    <thead className="table-light">
                      <tr>
                        <th>Livro</th>
                        <th className="text-center">Qtd</th>
                        <th className="text-end">Preço Unit.</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.itens.map((item, idx) => (
                        <tr key={item.id ?? idx}>
                          <td>{item.titulo ?? item.livroTitulo ?? `Livro #${item.livroId}`}</td>
                          <td className="text-center">{item.quantidade}</td>
                          <td className="text-end">
                            {item.precoUnitario != null
                              ? formatCurrency(item.precoUnitario)
                              : '—'}
                          </td>
                          <td className="text-end">
                            {item.subtotal != null
                              ? formatCurrency(item.subtotal)
                              : item.precoUnitario != null
                              ? formatCurrency(item.precoUnitario * item.quantidade)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="text-end fw-semibold">
                          Total:
                        </td>
                        <td className="text-end fw-bold text-success">
                          {order.valorTotal != null ? formatCurrency(order.valorTotal) : '—'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                data-testid="order-modal-close-btn"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Confirmation Modal ────────────────────────────────────────────────────────

const ConfirmActionModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose, loading }) => (
  <>
    <div
      className="modal-backdrop fade show"
      onClick={!loading ? onClose : undefined}
      style={{ zIndex: 1040 }}
    />
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 1055 }}
      data-testid="confirm-action-modal"
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
              aria-label="Fechar"
            />
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={loading}
              data-testid="confirm-modal-cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              className={`btn ${confirmClass}`}
              onClick={onConfirm}
              disabled={loading}
              data-testid="confirm-modal-ok"
            >
              {loading ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" />{confirmLabel}…</>
              ) : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

// ─── LogisticsPage ─────────────────────────────────────────────────────────────

/**
 * LogisticsPage
 * @component
 * Logistics panel for managing order statuses: dispatch and delivery confirmation.
 * Rendered at /admin/logistica.
 */
const LogisticsPage = () => {
  usePageTitle('Admin — Logística');
  const { success, error: notifyError } = useNotification();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  // ── Data ───────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [detailOrder, setDetailOrder] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // { order, type: 'confirmar-pagamento'|'despachar'|'entregar' }
  const [actionLoading, setActionLoading] = useState(false);

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE, sort: 'id,desc' };
      if (appliedStatus) params.status = appliedStatus;
      const data = await adminService.getOrders(params);
      setOrders(data?.content ?? (Array.isArray(data) ? data : []));
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar pedidos.');
    } finally {
      setLoading(false);
    }
  }, [page, appliedStatus, notifyError]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedStatus(statusFilter);
    setPage(0);
  };

  const handleFilterReset = () => {
    setStatusFilter('');
    setAppliedStatus('');
    setPage(0);
  };

  // ── Row click — detail modal ───────────────────────────────────────────────
  const handleRowClick = (order) => setDetailOrder(order);

  // ── Action buttons ─────────────────────────────────────────────────────────
  const handleDispatchClick = (e, order) => {
    e.stopPropagation();
    setPendingAction({ order, type: 'despachar' });
  };

  const handleConfirmPaymentClick = (e, order) => {
    e.stopPropagation();
    setPendingAction({ order, type: 'confirmar-pagamento' });
  };

  const handleDeliverClick = (e, order) => {
    e.stopPropagation();
    setPendingAction({ order, type: 'entregar' });
  };

  const handleActionConfirm = async () => {
    if (!pendingAction) return;
    const { order, type } = pendingAction;
    setActionLoading(true);
    try {
      if (type === 'confirmar-pagamento') {
        await adminService.confirmPayment(order.id);
        success(`Pagamento do pedido ${order.numero ?? `#${order.id}`} confirmado!`);
      } else if (type === 'despachar') {
        await adminService.dispatchOrder(order.id);
        success(`Pedido ${order.numero ?? `#${order.id}`} despachado com sucesso!`);
      } else {
        await adminService.deliverOrder(order.id);
        success(`Pedido ${order.numero ?? `#${order.id}`} marcado como entregue!`);
      }
      setPendingAction(null);
      fetchOrders();
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao atualizar pedido.');
    } finally {
      setActionLoading(false);
    }
  };

  const actionConfig = pendingAction
    ? pendingAction.type === 'confirmar-pagamento'
      ? {
          title: 'Confirmar Pagamento',
          message: `Confirma o pagamento do pedido ${pendingAction.order.numero ?? `#${pendingAction.order.id}`}?`,
          confirmLabel: 'Confirmar Pagamento',
          confirmClass: 'btn-primary',
        }
      : pendingAction.type === 'despachar'
      ? {
          title: 'Despachar Pedido',
          message: `Confirma o despacho do pedido ${pendingAction.order.numero ?? `#${pendingAction.order.id}`}? O status será alterado para EM TRÂNSITO.`,
          confirmLabel: 'Despachar',
          confirmClass: 'btn-warning',
        }
      : {
          title: 'Confirmar Entrega',
          message: `Confirma a entrega do pedido ${pendingAction.order.numero ?? `#${pendingAction.order.id}`}? O status será alterado para ENTREGUE.`,
          confirmLabel: 'Confirmar Entrega',
          confirmClass: 'btn-success',
        }
    : null;

  return (
    <div data-testid="logistics-page">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <Link
            to="/admin"
            className="btn btn-sm btn-outline-secondary"
            data-testid="logistics-back"
          >
            ← Painel
          </Link>
          <h2 className="h4 mb-0">
            Painel Logístico
            {!loading && (
              <span className="badge bg-secondary ms-2 fs-6" data-testid="logistics-count">
                {totalElements}
              </span>
            )}
          </h2>
        </div>
      </div>

      {/* Filter bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="card mb-4 border-0 bg-light"
        data-testid="logistics-filters"
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                data-testid="filter-status"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2 d-flex gap-1">
              <button
                type="submit"
                className="btn btn-primary btn-sm flex-grow-1"
                data-testid="filter-submit"
              >
                Filtrar
              </button>
              {appliedStatus && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleFilterReset}
                  data-testid="filter-reset"
                  title="Limpar filtro"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Applied filter badge */}
      {appliedStatus && (
        <div className="mb-3">
          <span className="badge bg-primary me-2">
            Filtro: {statusLabel(appliedStatus)}
          </span>
        </div>
      )}

      {/* DataGrid */}
      {loading ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <div className="alert alert-info" data-testid="logistics-no-orders">
          Nenhum pedido encontrado.
          {appliedStatus && (
            <button
              type="button"
              className="btn btn-link btn-sm ms-2 p-0"
              onClick={handleFilterReset}
            >
              Limpar filtro
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive" data-testid="logistics-table-wrapper">
            <table
              className="table table-hover table-sm align-middle"
              data-testid="logistics-table"
            >
              <thead className="table-light">
                <tr>
                  <th style={{ width: 110 }}>Número</th>
                  <th>Cliente</th>
                  <th style={{ width: 150 }}>Data</th>
                  <th style={{ width: 150 }} className="text-center">Status</th>
                  <th style={{ width: 120 }} className="text-end">Valor</th>
                  <th style={{ width: 180 }} className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRowClick(order)}
                    data-testid={`order-row-${order.id}`}
                    title="Clique para ver detalhes"
                  >
                    {/* Número */}
                    <td
                      className="fw-semibold font-monospace small"
                      data-testid={`order-numero-${order.id}`}
                    >
                      {order.numero ?? `#${order.id}`}
                    </td>

                    {/* Cliente */}
                    <td data-testid={`order-client-${order.id}`}>
                      <div className="fw-semibold small text-truncate" style={{ maxWidth: 200 }}>
                        {order.cliente?.nome ?? '—'}
                      </div>
                      {order.cliente?.email && (
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          {order.cliente.email}
                        </div>
                      )}
                    </td>

                    {/* Data */}
                    <td
                      className="small text-muted"
                      data-testid={`order-date-${order.id}`}
                    >
                      {order.dataPedido
                        ? new Intl.DateTimeFormat('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }).format(new Date(order.dataPedido))
                        : '—'}
                    </td>

                    {/* Status */}
                    <td className="text-center" data-testid={`order-status-${order.id}`}>
                      <span
                        className={`badge ${STATUS_BADGES[order.status] ?? 'bg-light text-dark border'}`}
                      >
                        {statusLabel(order.status)}
                      </span>
                    </td>

                    {/* Valor */}
                    <td
                      className="text-end small fw-semibold"
                      data-testid={`order-total-${order.id}`}
                    >
                      {order.valorTotal != null ? formatCurrency(order.valorTotal) : '—'}
                    </td>

                    {/* Ações */}
                    <td className="text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="btn-group btn-group-sm">
                        {order.status === 'APROVADA' && !order.pagamentoConfirmado && (
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={(e) => handleConfirmPaymentClick(e, order)}
                            data-testid={`confirm-payment-btn-${order.id}`}
                            title="Confirmar pagamento"
                          >
                            💳 Confirmar Pagamento
                          </button>
                        )}
                        {order.status === 'APROVADA' && order.pagamentoConfirmado && (
                          <button
                            type="button"
                            className="btn btn-warning"
                            onClick={(e) => handleDispatchClick(e, order)}
                            data-testid={`dispatch-btn-${order.id}`}
                            title="Despachar pedido"
                          >
                            🚚 Despachar
                          </button>
                        )}
                        {['EM_TRANSITO', 'EM_TRANSPORTE'].includes(order.status) && (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={(e) => handleDeliverClick(e, order)}
                            data-testid={`deliver-btn-${order.id}`}
                            title="Confirmar entrega"
                          >
                            ✅ Confirmar Entrega
                          </button>
                        )}
                        {order.status !== 'APROVADA' && order.status !== 'EM_TRANSITO' && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => handleRowClick(order)}
                            data-testid={`detail-btn-${order.id}`}
                          >
                            Detalhes
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Paginação de pedidos" className="mt-3">
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="orders-prev-page"
                  >
                    ‹ Anterior
                  </button>
                </li>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const total = totalPages;
                  let pageNum;
                  if (total <= 7) {
                    pageNum = i;
                  } else if (page < 4) {
                    pageNum = i < 5 ? i : i === 5 ? -1 : total - 1;
                  } else if (page >= total - 4) {
                    pageNum = i === 0 ? 0 : i === 1 ? -1 : total - 7 + i;
                  } else {
                    if (i === 0) pageNum = 0;
                    else if (i === 1) pageNum = -1;
                    else if (i === 5) pageNum = -1;
                    else if (i === 6) pageNum = total - 1;
                    else pageNum = page + (i - 3);
                  }
                  if (pageNum === -1) {
                    return (
                      <li key={`ellipsis-${i}`} className="page-item disabled">
                        <span className="page-link">…</span>
                      </li>
                    );
                  }
                  return (
                    <li
                      key={pageNum}
                      className={`page-item ${pageNum === page ? 'active' : ''}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPage(pageNum)}
                        data-testid={`orders-page-${pageNum}`}
                      >
                        {pageNum + 1}
                      </button>
                    </li>
                  );
                })}
                <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="orders-next-page"
                  >
                    Próxima ›
                  </button>
                </li>
              </ul>
              <div className="text-center text-muted small mt-2">
                Página {page + 1} de {totalPages} — {totalElements} pedidos no total
              </div>
            </nav>
          )}
        </>
      )}

      {/* Order detail modal */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
        />
      )}

      {/* Confirm action modal */}
      {pendingAction && actionConfig && (
        <ConfirmActionModal
          title={actionConfig.title}
          message={actionConfig.message}
          confirmLabel={actionConfig.confirmLabel}
          confirmClass={actionConfig.confirmClass}
          onConfirm={handleActionConfirm}
          onClose={() => !actionLoading && setPendingAction(null)}
          loading={actionLoading}
        />
      )}
    </div>
  );
};

export default LogisticsPage;
