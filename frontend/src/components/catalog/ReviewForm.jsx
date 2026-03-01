import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import reviewService from '../../services/reviewService';
import { getErrorMessage } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';

// ─── Star selector ────────────────────────────────────────────────────────────

const StarSelector = ({ value, onChange }) => (
  <div className="d-flex gap-1 mb-1" data-testid="star-selector">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        className="btn btn-link p-0"
        data-testid={`star-btn-${star}`}
        style={{
          fontSize: '1.8rem',
          color: star <= value ? '#ffc107' : '#dee2e6',
          textDecoration: 'none',
          lineHeight: 1,
        }}
      >
        ★
      </button>
    ))}
  </div>
);

StarSelector.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

// ─── ReviewForm ───────────────────────────────────────────────────────────────

const ReviewForm = ({ bookId, onSubmitted }) => {
  const { user, isAuthenticated } = useAuth();
  const [estrelas, setEstrelas] = useState(0);
  const [texto, setTexto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="alert alert-info" data-testid="review-login-prompt">
        <Link to={ROUTES.LOGIN}>Faça login</Link> para avaliar este livro.
      </div>
    );
  }

  const validate = () => {
    if (estrelas === 0) return 'Selecione uma nota de 1 a 5 estrelas.';
    if (texto.trim().length < 10) return 'A avaliação deve ter pelo menos 10 caracteres.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setServerError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await reviewService.submitReview(bookId, { estrelas, texto: texto.trim() });
      setSuccessMessage('Avaliação enviada para moderação');
      setEstrelas(0);
      setTexto('');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setServerError(getErrorMessage(err) || 'Erro ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="review-form-container">
      <h3 className="h6 fw-bold mb-3">Escrever uma Avaliação</h3>

      {successMessage && (
        <div className="alert alert-success" data-testid="review-success">
          {successMessage}
        </div>
      )}

      {serverError && (
        <div className="alert alert-danger" data-testid="review-error">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} data-testid="review-form">
        {/* Stars */}
        <div className="mb-3">
          <label className="form-label">Nota *</label>
          <div>
            <StarSelector value={estrelas} onChange={setEstrelas} />
            {estrelas > 0 && (
              <small className="text-muted" data-testid="star-label">
                {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][estrelas]}
              </small>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="mb-3">
          <label htmlFor="review-texto" className="form-label">
            Comentário *
          </label>
          <textarea
            id="review-texto"
            className="form-control"
            rows={4}
            placeholder="Compartilhe sua opinião sobre o livro..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={1000}
            required
            data-testid="review-texto-input"
          />
          <div className="form-text text-end">
            {texto.length}/1000
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          data-testid="review-submit-btn"
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Enviando...
            </>
          ) : (
            'Enviar Avaliação'
          )}
        </button>
      </form>
    </div>
  );
};

ReviewForm.propTypes = {
  bookId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onSubmitted: PropTypes.func,
};

ReviewForm.defaultProps = {
  onSubmitted: null,
};

export default ReviewForm;
