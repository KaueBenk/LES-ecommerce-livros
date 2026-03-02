import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import reviewService from '../../services/reviewService';
import { getErrorMessage } from '../../utils/helpers';
import LoadingSpinner from '../common/LoadingSpinner';

// ─── Star display ─────────────────────────────────────────────────────────────

const StarDisplay = ({ value, max = 5 }) => (
  <span aria-label={`${value} de ${max} estrelas`} data-testid="review-stars">
    {Array.from({ length: max }, (_, i) => (
      <span key={i} style={{ color: i < value ? '#ffc107' : '#dee2e6', fontSize: '1.1rem' }}>
        ★
      </span>
    ))}
  </span>
);

StarDisplay.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
};

// ─── Review item ─────────────────────────────────────────────────────────────

const ReviewItem = ({ review }) => {
  const date = review.dataAvaliacao
    ? new Date(review.dataAvaliacao).toLocaleDateString('pt-BR')
    : null;

  return (
    <div className="border rounded p-3 mb-3" data-testid={`review-item-${review.id}`}>
      <div className="d-flex align-items-center justify-content-between mb-1">
        <strong data-testid="review-cliente">{review.cliente?.nome || 'Anônimo'}</strong>
        {date && (
          <small className="text-muted" data-testid="review-data">
            {date}
          </small>
        )}
      </div>
      <StarDisplay value={review.estrelas} />
      {review.texto && (
        <p className="mt-2 mb-0 text-secondary" data-testid="review-texto">
          {review.texto}
        </p>
      )}
    </div>
  );
};

ReviewItem.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.number.isRequired,
    cliente: PropTypes.shape({ nome: PropTypes.string }),
    estrelas: PropTypes.number.isRequired,
    texto: PropTypes.string,
    dataAvaliacao: PropTypes.string,
  }).isRequired,
};

// ─── ReviewList ───────────────────────────────────────────────────────────────

const ReviewList = ({ bookId, refreshKey }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewService.getReviews(bookId, {
        page,
        size: PAGE_SIZE,
        aprovada: true,
      });
      setReviews(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [bookId, page, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="alert alert-danger" data-testid="reviews-error">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className="text-muted" data-testid="reviews-empty">
        Nenhuma avaliação ainda. Seja o primeiro a avaliar!
      </p>
    );
  }

  return (
    <div data-testid="review-list">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Páginas de avaliações" className="mt-3">
          <ul className="pagination pagination-sm justify-content-center">
            <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage((p) => p - 1)}>
                ‹
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setPage(i)}>
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${page === totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => setPage((p) => p + 1)}>
                ›
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

ReviewList.propTypes = {
  bookId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  refreshKey: PropTypes.number,
};

ReviewList.defaultProps = {
  refreshKey: 0,
};

export default ReviewList;
