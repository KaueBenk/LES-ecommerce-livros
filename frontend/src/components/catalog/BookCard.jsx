import React from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { ROUTES } from '../../utils/constants';

// ── Sub-components ──────────────────────────────────────────────────────────

const BookPlaceholder = () => (
  <div
    className="d-flex align-items-center justify-content-center bg-light text-secondary"
    style={{ height: '200px' }}
    aria-hidden="true"
  >
    <span style={{ fontSize: '3rem' }}>📚</span>
  </div>
);

const CategoryBadge = ({ nome }) => (
  <span className="badge bg-secondary me-1 mb-1" style={{ fontSize: '0.7rem' }}>
    {nome}
  </span>
);

CategoryBadge.propTypes = { nome: PropTypes.string.isRequired };

// ── BookCard ────────────────────────────────────────────────────────────────

/**
 * BookCard
 * @component
 * @description Reusable book card for catalog/home pages.
 * Shows placeholder image, title, author, category badges, price, and add-to-cart button.
 */
const BookCard = ({ book, onAddToCart, addingId }) => {
  const navigate = useNavigate();
  const productUrl = ROUTES.PRODUCT.replace(':id', book.id);
  const isAdding = addingId === book.id;
  const outOfStock = (book.estoque?.quantidadeDisponivel ?? 1) <= 0;

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return;
    navigate(productUrl);
  };

  return (
    <div
      className="card h-100 shadow-sm border-0 book-card"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && navigate(productUrl)}
      style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
      data-testid={`book-card-${book.id}`}
    >
      {/* Cover image */}
      <Link
        to={productUrl}
        tabIndex="-1"
        onClick={(e) => e.stopPropagation()}
        data-testid={`book-image-link-${book.id}`}
      >
        <BookPlaceholder />
      </Link>

      <div className="card-body d-flex flex-column p-3">
        {/* Title */}
        <h6
          className="card-title fw-semibold mb-1 text-truncate"
          title={book.titulo}
          data-testid={`book-title-${book.id}`}
        >
          {book.titulo}
        </h6>

        {/* Author */}
        <p
          className="card-text text-muted small mb-2 text-truncate"
          title={book.autor?.nome}
          data-testid={`book-autor-${book.id}`}
        >
          {book.autor?.nome || '—'}
        </p>

        {/* Category badges */}
        {book.categorias?.length > 0 && (
          <div className="mb-2" data-testid={`book-categorias-${book.id}`}>
            {book.categorias.slice(0, 3).map((cat) => (
              <CategoryBadge key={cat.id} nome={cat.nome} />
            ))}
          </div>
        )}

        {/* Price */}
        <p
          className="fw-bold text-primary mb-2 mt-auto"
          data-testid={`book-price-${book.id}`}
        >
          {formatCurrency(book.valorVenda ?? 0)}
        </p>

        {/* Out of stock badge */}
        {outOfStock && (
          <span className="badge bg-danger mb-2" data-testid={`book-out-of-stock-${book.id}`}>
            Sem estoque
          </span>
        )}

        {/* Add to Cart */}
        <button
          type="button"
          className="btn btn-primary btn-sm w-100 mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(book);
          }}
          disabled={isAdding || outOfStock}
          data-testid={`add-to-cart-btn-${book.id}`}
        >
          {isAdding ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-1"
                role="status"
                aria-hidden="true"
              />
              Adicionando...
            </>
          ) : outOfStock ? (
            'Indisponível'
          ) : (
            '🛒 Adicionar'
          )}
        </button>
      </div>
    </div>
  );
};

BookCard.propTypes = {
  book: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    titulo: PropTypes.string,
    autor: PropTypes.shape({ nome: PropTypes.string }),
    categorias: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.number, nome: PropTypes.string })),
    valorVenda: PropTypes.number,
    estoque: PropTypes.shape({ quantidadeDisponivel: PropTypes.number }),
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  addingId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

BookCard.defaultProps = { addingId: null };

export default BookCard;
