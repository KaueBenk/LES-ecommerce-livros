import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import { formatDate, truncate } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/helpers';
import useNotification from '../../hooks/useNotification';
import usePageTitle from '../../hooks/usePageTitle';
import LoadingSpinner from '../common/LoadingSpinner';

const PAGE_SIZE = 10;

// ─── Stars ────────────────────────────────────────────────────────────────────

const Stars = ({ value }) => {
  const n = Math.round(value ?? 0);
  return (
    <span title={`${value} estrelas`} aria-label={`${value} estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < n ? '#f5a623' : '#ccc' }}>★</span>
      ))}
    </span>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const ReviewStatusBadge = ({ aprovada }) => {
  if (aprovada === true)
    return <span className="badge bg-success">Aprovada</span>;
  if (aprovada === false)
    return <span className="badge bg-warning text-dark">Pendente</span>;
  return <span className="badge bg-secondary">—</span>;
};

// ─── Full Text Modal ──────────────────────────────────────────────────────────

const ReviewDetailModal = ({ review, onClose, onApprove, onReject, actioning }) => (
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
      aria-labelledby="review-detail-title"
      style={{ zIndex: 1050 }}
      data-testid="review-detail-modal"
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="review-detail-title">
              Avaliação — {review.livroTitulo ?? '—'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Fechar"
              data-testid="review-detail-close"
            />
          </div>
          <div className="modal-body">
            <dl className="row mb-3">
              <dt className="col-sm-3 text-muted">Livro</dt>
              <dd className="col-sm-9">{review.livroTitulo ?? '—'}</dd>

              <dt className="col-sm-3 text-muted">Cliente</dt>
              <dd className="col-sm-9">{review.clienteNome ?? '—'}</dd>

              <dt className="col-sm-3 text-muted">Estrelas</dt>
              <dd className="col-sm-9"><Stars value={review.estrelas} /></dd>

              <dt className="col-sm-3 text-muted">Data</dt>
              <dd className="col-sm-9">
                {review.dataAvaliacao ? formatDate(review.dataAvaliacao) : '—'}
              </dd>

              <dt className="col-sm-3 text-muted">Status</dt>
              <dd className="col-sm-9"><ReviewStatusBadge aprovada={review.aprovada} /></dd>
            </dl>

            <hr />

            <div>
              <label className="form-label fw-semibold small text-muted">Texto da Avaliação</label>
              <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {review.texto || <em className="text-muted">Sem texto.</em>}
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={onClose}
              data-testid="review-detail-close-footer"
            >
              Fechar
            </button>
            {review.aprovada !== true && (
              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => onApprove(review)}
                disabled={actioning === review.id}
                data-testid={`modal-approve-${review.id}`}
              >
                {actioning === review.id ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Aprovando…</>
                ) : '✓ Aprovar'}
              </button>
            )}
            {review.aprovada !== false && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onReject(review)}
                disabled={actioning === review.id}
                data-testid={`modal-reject-${review.id}`}
              >
                {actioning === review.id ? (
                  <><span className="spinner-border spinner-border-sm me-1" role="status" />Rejeitando…</>
                ) : '✗ Rejeitar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </>
);

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination = ({ page, totalPages, totalElements, onChangePage }) => {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Paginação de avaliações" className="mt-3">
      <ul className="pagination pagination-sm justify-content-center mb-0">
        <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChangePage(page - 1)}>‹ Anterior</button>
        </li>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          const total = totalPages;
          let pageNum;
          if (total <= 7) pageNum = i;
          else if (page < 4) pageNum = i < 5 ? i : i === 5 ? -1 : total - 1;
          else if (page >= total - 4) pageNum = i === 0 ? 0 : i === 1 ? -1 : total - 7 + i;
          else {
            if (i === 0) pageNum = 0;
            else if (i === 1) pageNum = -1;
            else if (i === 5) pageNum = -1;
            else if (i === 6) pageNum = total - 1;
            else pageNum = page + (i - 3);
          }
          if (pageNum === -1) {
            return (<li key={`ellipsis-${i}`} className="page-item disabled"><span className="page-link">…</span></li>);
          }
          return (
            <li key={pageNum} className={`page-item ${pageNum === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => onChangePage(pageNum)}>{pageNum + 1}</button>
            </li>
          );
        })}
        <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onChangePage(page + 1)}>Próxima ›</button>
        </li>
      </ul>
      <div className="text-center text-muted small mt-2">
        Página {page + 1} de {totalPages} — {totalElements} avaliações no total
      </div>
    </nav>
  );
};

// ─── ReviewModeration ─────────────────────────────────────────────────────────

/**
 * ReviewModeration
 * @component
 * @description Admin moderation panel for book reviews.
 * Displays pending/approved/rejected reviews with approve and reject actions.
 * Clicking a row opens a full-text detail modal.
 */
const ReviewModeration = () => {
  usePageTitle('Admin — Moderação de Avaliações');
  const { error: notifyError, success } = useNotification();

  // ── Filters ────────────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('pending'); // pending | approved | all

  // ── Data ───────────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [actioning, setActioning] = useState(null); // id of review being acted upon
  const [selectedReview, setSelectedReview] = useState(null);

  // ── Build query params from filter ────────────────────────────────────────
  const buildParams = useCallback(() => {
    const params = { page, size: PAGE_SIZE };
    if (statusFilter === 'pending') params.aprovada = false;
    else if (statusFilter === 'approved') params.aprovada = true;
    // 'all' → no filter
    return params;
  }, [page, statusFilter]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getReviews(buildParams());
      setReviews(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar avaliações.');
    } finally {
      setLoading(false);
    }
  }, [buildParams, notifyError]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(0);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleApprove = async (review) => {
    setActioning(review.id);
    try {
      const result = await adminService.approveReview(review.id);
      success(result?.message ?? `Avaliação de "${review.clienteNome}" aprovada.`);
      setSelectedReview(null);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setTotalElements((n) => Math.max(0, n - 1));
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao aprovar avaliação.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (review) => {
    setActioning(review.id);
    try {
      const result = await adminService.rejectReview(review.id);
      success(result?.message ?? `Avaliação de "${review.clienteNome}" rejeitada.`);
      setSelectedReview(null);
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      setTotalElements((n) => Math.max(0, n - 1));
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao rejeitar avaliação.');
    } finally {
      setActioning(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const statusOptions = [
    { value: 'pending', label: '⏳ Pendentes' },
    { value: 'approved', label: '✅ Aprovadas' },
    { value: 'all', label: '📋 Todas' },
  ];

  return (
    <div data-testid="admin-reviews-section">
      {/* Toolbar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <Link
            to="/admin"
            className="btn btn-sm btn-outline-secondary me-2"
            data-testid="admin-reviews-back"
          >
            ← Painel
          </Link>
          <h2 className="h4 mb-0 d-inline">
            Moderação de Avaliações
            {!loading && (
              <span className="badge bg-secondary ms-2" data-testid="admin-reviews-count">
                {totalElements}
              </span>
            )}
          </h2>
        </div>

        {/* Status filter buttons */}
        <div className="btn-group btn-group-sm" role="group" aria-label="Filtro de status">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`btn ${statusFilter === opt.value ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleStatusFilterChange(opt.value)}
              data-testid={`filter-status-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : reviews.length === 0 ? (
        <div className="alert alert-info" data-testid="admin-no-reviews">
          Nenhuma avaliação encontrada para o filtro selecionado.
          {statusFilter !== 'pending' && (
            <button
              type="button"
              className="btn btn-link btn-sm ms-2 p-0"
              onClick={() => handleStatusFilterChange('pending')}
            >
              Ver pendentes
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive" data-testid="admin-reviews-table-wrapper">
            <table
              className="table table-hover table-sm align-middle"
              data-testid="admin-reviews-table"
              style={{ cursor: 'pointer' }}
            >
              <thead className="table-light">
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Livro</th>
                  <th>Cliente</th>
                  <th className="text-center" style={{ width: 100 }}>Estrelas</th>
                  <th>Trecho do Texto</th>
                  <th>Data</th>
                  <th className="text-center" style={{ width: 80 }}>Status</th>
                  <th className="text-end" style={{ width: 160 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    onClick={() => setSelectedReview(review)}
                    data-testid={`review-row-${review.id}`}
                    title="Clique para ver texto completo"
                  >
                    <td className="text-muted small font-monospace">{review.id}</td>
                    <td
                      className="fw-semibold small"
                      style={{ maxWidth: 180, overflow: 'hidden' }}
                      data-testid={`review-book-${review.id}`}
                    >
                      <span className="text-truncate d-block" title={review.livroTitulo}>
                        {review.livroTitulo ?? '—'}
                      </span>
                    </td>
                    <td className="small" data-testid={`review-client-${review.id}`}>
                      {review.clienteNome ?? '—'}
                    </td>
                    <td className="text-center" data-testid={`review-stars-${review.id}`}>
                      <Stars value={review.estrelas} />
                    </td>
                    <td
                      className="small text-muted"
                      style={{ maxWidth: 280 }}
                      data-testid={`review-text-${review.id}`}
                    >
                      <span className="text-truncate d-block" title={review.texto}>
                        {review.texto ? truncate(review.texto, 80) : <em>Sem texto</em>}
                      </span>
                    </td>
                    <td className="small text-muted" data-testid={`review-date-${review.id}`}>
                      {review.dataAvaliacao ? formatDate(review.dataAvaliacao) : '—'}
                    </td>
                    <td className="text-center">
                      <ReviewStatusBadge aprovada={review.aprovada} />
                    </td>
                    <td
                      className="text-end"
                      onClick={(e) => e.stopPropagation()} // don't open modal when clicking buttons
                    >
                      <div className="btn-group btn-group-sm">
                        {review.aprovada !== true && (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={(e) => { e.stopPropagation(); handleApprove(review); }}
                            disabled={actioning === review.id}
                            title="Aprovar avaliação"
                            data-testid={`approve-review-${review.id}`}
                          >
                            {actioning === review.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" />
                            ) : '✓'}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleReject(review); }}
                          disabled={actioning === review.id}
                          title="Rejeitar avaliação"
                          data-testid={`reject-review-${review.id}`}
                        >
                          {actioning === review.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" />
                          ) : '✗'}
                        </button>
                      </div>
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
            onChangePage={setPage}
          />
        </>
      )}

      {/* Full Text Modal */}
      {selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          actioning={actioning}
        />
      )}
    </div>
  );
};

export default ReviewModeration;
