import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatDate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/helpers';
import useNotification from '../../hooks/useNotification';
import usePageTitle from '../../hooks/usePageTitle';
import LoadingSpinner from '../common/LoadingSpinner';

const PAGE_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    EM_TROCA: { cls: 'bg-warning text-dark', label: 'Pendente' },
    TROCA_AUTORIZADA: { cls: 'bg-info text-dark', label: 'Autorizada' },
    TROCADO: { cls: 'bg-success', label: 'Concluída' },
  };
  const { cls = 'bg-secondary', label = status } = map[status] ?? {};
  return <span className={`badge ${cls}`}>{label}</span>;
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, totalElements, label, onChangePage }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={`Paginação de ${label}`} className="mt-3">
      <ul className="pagination pagination-sm justify-content-center mb-0">
        <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChangePage(page - 1)}>
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
            <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onChangePage(pageNum)}>
                {pageNum + 1}
              </button>
            </li>
          );
        })}
        <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChangePage(page + 1)}>
            Próxima ›
          </button>
        </li>
      </ul>
      <div className="text-center text-muted small mt-2">
        Página {page + 1} de {totalPages} — {totalElements} {label} no total
      </div>
    </nav>
  );
};

// ─── Items Detail ─────────────────────────────────────────────────────────────

const ItemsDetail = ({ itens }) => {
  if (!itens?.length) return <span className="text-muted small">—</span>;
  return (
    <ul className="list-unstyled mb-0 small">
      {itens.map((item) => (
        <li key={item.id}>
          <span className="fw-semibold">{item.livroTitulo ?? '—'}</span>
          {item.quantidade > 1 && (
            <span className="text-muted ms-1">× {item.quantidade}</span>
          )}
          {item.justificativa && (
            <span className="text-muted ms-1">— {item.justificativa}</span>
          )}
        </li>
      ))}
    </ul>
  );
};

// ─── Tab 1: Pending Exchanges ─────────────────────────────────────────────────

const PendingExchanges = () => {
  const { error: notifyError, success } = useNotification();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [authorizingId, setAuthorizingId] = useState(null);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getExchanges({ status: 'EM_TROCA', page, size: PAGE_SIZE });
      setExchanges(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar trocas pendentes.');
    } finally {
      setLoading(false);
    }
  }, [page, notifyError]);

  useEffect(() => { fetchExchanges(); }, [fetchExchanges]);

  const handleAuthorize = async (exchange) => {
    setAuthorizingId(exchange.id);
    try {
      await adminService.authorizeExchange(exchange.id);
      success(`Troca #${exchange.id} (${exchange.numeroNota ?? exchange.pedidoId}) autorizada com sucesso.`);
      fetchExchanges();
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao autorizar troca.');
    } finally {
      setAuthorizingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (exchanges.length === 0) {
    return (
      <div className="alert alert-info mt-3" data-testid="no-pending-exchanges">
        Nenhuma troca pendente de autorização.
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive mt-3" data-testid="pending-exchanges-table-wrapper">
        <table className="table table-hover table-sm align-middle" data-testid="pending-exchanges-table">
          <thead className="table-light">
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Nota / Pedido</th>
              <th>Data Solicitação</th>
              <th>Itens e Justificativa</th>
              <th className="text-center">Status</th>
              <th className="text-end">Ação</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map((ex) => (
              <tr key={ex.id} data-testid={`pending-exchange-row-${ex.id}`}>
                <td className="text-muted small font-monospace">{ex.id}</td>
                <td>
                  <div className="fw-semibold">{ex.numeroNota ?? `PED-${ex.pedidoId}`}</div>
                  {ex.pedidoId && (
                    <div className="text-muted small">Pedido #{ex.pedidoId}</div>
                  )}
                </td>
                <td className="small text-muted">
                  {ex.dataSolicitacao ? formatDate(ex.dataSolicitacao) : '—'}
                </td>
                <td>
                  <ItemsDetail itens={ex.itens} />
                </td>
                <td className="text-center">
                  <StatusBadge status={ex.status} />
                </td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-success"
                    onClick={() => handleAuthorize(ex)}
                    disabled={authorizingId === ex.id}
                    data-testid={`authorize-exchange-${ex.id}`}
                  >
                    {authorizingId === ex.id ? (
                      <><span className="spinner-border spinner-border-sm me-1" role="status" />Autorizando…</>
                    ) : (
                      'Autorizar'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        label="trocas pendentes"
        onChangePage={setPage}
      />
    </>
  );
};

// ─── Tab 2: Authorized Exchanges ──────────────────────────────────────────────

/**
 * Tracks per-exchange item checkbox state: { [exchangeId]: { [itemId]: boolean } }
 */
const useItemReturnState = (exchanges) => {
  const [returnMap, setReturnMap] = useState({});

  // Initialize checkboxes when exchanges loaded
  useEffect(() => {
    setReturnMap((prev) => {
      const next = { ...prev };
      exchanges.forEach((ex) => {
        if (!next[ex.id]) {
          next[ex.id] = {};
          (ex.itens ?? []).forEach((item) => {
            next[ex.id][item.id] = true; // default: return to stock
          });
        }
      });
      return next;
    });
  }, [exchanges]);

  const toggle = (exchangeId, itemId) => {
    setReturnMap((prev) => ({
      ...prev,
      [exchangeId]: {
        ...prev[exchangeId],
        [itemId]: !prev[exchangeId]?.[itemId],
      },
    }));
  };

  return { returnMap, toggle };
};

const AuthorizedExchanges = () => {
  const { error: notifyError, success } = useNotification();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [confirmingId, setConfirmingId] = useState(null);

  const { returnMap, toggle } = useItemReturnState(exchanges);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getExchanges({
        status: 'TROCA_AUTORIZADA',
        page,
        size: PAGE_SIZE,
      });
      setExchanges(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar trocas autorizadas.');
    } finally {
      setLoading(false);
    }
  }, [page, notifyError]);

  useEffect(() => { fetchExchanges(); }, [fetchExchanges]);

  const handleConfirmReceipt = async (exchange) => {
    setConfirmingId(exchange.id);
    try {
      const itens = (exchange.itens ?? []).map((item) => ({
        id: item.id,
        retornarAoEstoque: returnMap[exchange.id]?.[item.id] ?? true,
      }));
      const result = await adminService.confirmExchangeReceipt(exchange.id, { itens });
      const message = result?.message ?? 'Troca finalizada';
      success(`${message} — Nota: ${exchange.numeroNota ?? exchange.pedidoId}`);
      fetchExchanges();
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao confirmar recebimento.');
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (exchanges.length === 0) {
    return (
      <div className="alert alert-info mt-3" data-testid="no-authorized-exchanges">
        Nenhuma troca aguardando confirmação de recebimento.
      </div>
    );
  }

  return (
    <>
      <div className="table-responsive mt-3" data-testid="authorized-exchanges-table-wrapper">
        <table
          className="table table-hover table-sm align-middle"
          data-testid="authorized-exchanges-table"
        >
          <thead className="table-light">
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Nota / Pedido</th>
              <th>Data Solicitação</th>
              <th>Itens — Retornar ao Estoque</th>
              <th className="text-center">Status</th>
              <th className="text-end">Ação</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map((ex) => (
              <tr key={ex.id} data-testid={`authorized-exchange-row-${ex.id}`}>
                <td className="text-muted small font-monospace">{ex.id}</td>
                <td>
                  <div className="fw-semibold">{ex.numeroNota ?? `PED-${ex.pedidoId}`}</div>
                  {ex.pedidoId && (
                    <div className="text-muted small">Pedido #{ex.pedidoId}</div>
                  )}
                </td>
                <td className="small text-muted">
                  {ex.dataSolicitacao ? formatDate(ex.dataSolicitacao) : '—'}
                </td>
                <td>
                  {(ex.itens ?? []).length === 0 ? (
                    <span className="text-muted small">—</span>
                  ) : (
                    <ul className="list-unstyled mb-0 small">
                      {ex.itens.map((item) => (
                        <li key={item.id} className="d-flex align-items-center gap-2 mb-1">
                          <input
                            type="checkbox"
                            className="form-check-input mt-0"
                            id={`return-${ex.id}-${item.id}`}
                            checked={returnMap[ex.id]?.[item.id] ?? true}
                            onChange={() => toggle(ex.id, item.id)}
                            data-testid={`return-checkbox-${ex.id}-${item.id}`}
                          />
                          <label
                            htmlFor={`return-${ex.id}-${item.id}`}
                            className="mb-0"
                          >
                            <span className="fw-semibold">{item.livroTitulo ?? '—'}</span>
                            {item.quantidade > 1 && (
                              <span className="text-muted ms-1">× {item.quantidade}</span>
                            )}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="text-center">
                  <StatusBadge status={ex.status} />
                </td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleConfirmReceipt(ex)}
                    disabled={confirmingId === ex.id}
                    data-testid={`confirm-receipt-${ex.id}`}
                  >
                    {confirmingId === ex.id ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" />
                        Confirmando…
                      </>
                    ) : (
                      'Confirmar Recebimento'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        label="trocas autorizadas"
        onChangePage={setPage}
      />
    </>
  );
};

// ─── ExchangeWorkflow ─────────────────────────────────────────────────────────

/**
 * ExchangeWorkflow
 * @component
 * @description Admin panel section for managing book exchanges.
 * Tab 1 — Pending (EM_TROCA): authorize button.
 * Tab 2 — Authorized (TROCA_AUTORIZADA): per-item return-to-stock checkboxes + confirm receipt.
 */
const ExchangeWorkflow = () => {
  usePageTitle('Admin — Trocas');
  const [activeTab, setActiveTab] = useState('pending');

  return (
    <div data-testid="admin-exchanges-section">
      {/* Toolbar */}
      <div className="d-flex align-items-center mb-4 flex-wrap gap-2">
        <div>
          <Link
            to="/admin"
            className="btn btn-sm btn-outline-secondary me-2"
            data-testid="admin-exchanges-back"
          >
            ← Painel
          </Link>
          <h2 className="h4 mb-0 d-inline">Gerenciar Trocas</h2>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
            data-testid="tab-pending"
          >
            🕐 Pendentes (EM_TROCA)
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'authorized' ? 'active' : ''}`}
            onClick={() => setActiveTab('authorized')}
            data-testid="tab-authorized"
          >
            ✅ Autorizadas (TROCA_AUTORIZADA)
          </button>
        </li>
      </ul>

      <div className="tab-content pt-0">
        <div
          className={`tab-pane fade ${activeTab === 'pending' ? 'show active' : ''}`}
          data-testid="tab-pending-content"
        >
          {activeTab === 'pending' && <PendingExchanges />}
        </div>
        <div
          className={`tab-pane fade ${activeTab === 'authorized' ? 'show active' : ''}`}
          data-testid="tab-authorized-content"
        >
          {activeTab === 'authorized' && <AuthorizedExchanges />}
        </div>
      </div>
    </div>
  );
};

export default ExchangeWorkflow;
