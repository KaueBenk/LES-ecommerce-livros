import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useCart from '../hooks/useCart';
import useNotification from '../hooks/useNotification';
import catalogService from '../services/catalogService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewList from '../components/catalog/ReviewList';
import ReviewForm from '../components/catalog/ReviewForm';

// ─── Book cover placeholder ──────────────────────────────────────────────────

const BookCoverPlaceholder = () => (
  <div
    className="d-flex align-items-center justify-content-center bg-light rounded"
    style={{ height: '400px', maxWidth: '280px', width: '100%' }}
    aria-hidden="true"
    data-testid="book-cover-placeholder"
  >
    <span style={{ fontSize: '5rem' }}>📚</span>
  </div>
);

// ─── Detail row ──────────────────────────────────────────────────────────────

const DetailRow = ({ label, value, testId }) =>
  value ? (
    <tr>
      <th className="text-muted fw-normal pe-3" style={{ whiteSpace: 'nowrap' }}>
        {label}
      </th>
      <td data-testid={testId}>{value}</td>
    </tr>
  ) : null;

// ─── Quantity selector ───────────────────────────────────────────────────────

const QuantitySelector = ({ value, onChange, max = 99 }) => (
  <div className="d-flex align-items-center gap-2" data-testid="quantity-selector">
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm"
      onClick={() => onChange(Math.max(1, value - 1))}
      disabled={value <= 1}
      aria-label="Diminuir quantidade"
      data-testid="qty-decrease"
    >
      −
    </button>
    <input
      type="number"
      className="form-control form-control-sm text-center"
      style={{ width: '60px' }}
      min={1}
      max={max}
      value={value}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!isNaN(v) && v >= 1 && v <= max) onChange(v);
      }}
      data-testid="qty-input"
    />
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm"
      onClick={() => onChange(Math.min(max, value + 1))}
      disabled={value >= max}
      aria-label="Aumentar quantidade"
      data-testid="qty-increase"
    >
      +
    </button>
  </div>
);

// ─── ProductPage ─────────────────────────────────────────────────────────────

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { success, error: notifyError } = useNotification();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0);

  usePageTitle(book ? book.titulo : 'Detalhes do Livro');

  const fetchBook = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await catalogService.getBook(id);
      setBook(data);
    } catch (err) {
      setFetchError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const outOfStock = (book?.estoque?.quantidadeDisponivel ?? 0) <= 0;
  const maxQty = book?.estoque?.quantidadeDisponivel ?? 99;

  const handleAddToCart = async () => {
    if (!book) return;
    setAdding(true);
    try {
      await addItem(book, quantity);
      success(`"${book.titulo}" adicionado ao carrinho!`);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao adicionar ao carrinho.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!book) return;
    setAdding(true);
    try {
      await addItem(book, quantity);
      success(`"${book.titulo}" adicionado ao carrinho!`);
      navigate(ROUTES.CHECKOUT);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao processar compra.');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewSubmitted = () => {
    setReviewRefreshKey((k) => k + 1);
  };

  // ── Loading ──
  if (loading) return <div className="container page-container"><LoadingSpinner /></div>;

  // ── Error ──
  if (fetchError) {
    return (
      <div className="container page-container">
        <div className="alert alert-danger" data-testid="product-error">
          {fetchError}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchBook}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="container page-container" data-testid="product-page">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={ROUTES.HOME}>Início</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={ROUTES.CATALOG}>Catálogo</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {book.titulo}
          </li>
        </ol>
      </nav>

      {/* Main product section */}
      <div className="row g-4 mb-5">
        {/* Left: cover */}
        <div className="col-md-4 d-flex justify-content-center justify-content-md-start">
          <BookCoverPlaceholder />
        </div>

        {/* Right: details */}
        <div className="col-md-8">
          {/* Title & author */}
          <h1 className="h3 fw-bold mb-1" data-testid="book-titulo">
            {book.titulo}
          </h1>
          {book.autor?.nome && (
            <p className="text-muted mb-2" data-testid="book-autor">
              por <strong>{book.autor.nome}</strong>
            </p>
          )}

          {/* Category badges */}
          {book.categorias?.length > 0 && (
            <div className="mb-3" data-testid="book-categorias">
              {book.categorias.map((cat) => (
                <span key={cat.id} className="badge bg-secondary me-1">
                  {cat.nome}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            <span
              className="fs-3 fw-bold text-primary"
              data-testid="book-price"
            >
              {formatCurrency(book.valorVenda ?? 0)}
            </span>
          </div>

          {/* Stock */}
          {outOfStock ? (
            <div
              className="alert alert-warning d-inline-flex align-items-center py-1 px-3 mb-3"
              data-testid="book-out-of-stock"
            >
              Produto sem estoque no momento
            </div>
          ) : (
            <p className="text-success small mb-3" data-testid="book-stock">
              ✓ Em estoque ({book.estoque.quantidadeDisponivel} disponíveis)
            </p>
          )}

          {/* Quantity + Add to Cart / Buy Now */}
          {!outOfStock && (
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
              <QuantitySelector
                value={quantity}
                onChange={setQuantity}
                max={maxQty}
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAddToCart}
                disabled={adding}
                data-testid="add-to-cart-btn"
              >
                {adding ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Adicionando...
                  </>
                ) : (
                  '🛒 Adicionar ao Carrinho'
                )}
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleBuyNow}
                disabled={adding}
                data-testid="buy-now-btn"
              >
                {adding ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Processando...
                  </>
                ) : (
                  '⚡ Comprar Agora'
                )}
              </button>
            </div>
          )}

          {/* Book details table */}
          <table className="table table-borderless table-sm" data-testid="book-details-table">
            <tbody>
              <DetailRow label="Editora" value={book.editora?.nome} testId="book-editora" />
              <DetailRow label="Edição" value={book.edicao} testId="book-edicao" />
              <DetailRow label="Ano" value={book.ano} testId="book-ano" />
              <DetailRow label="ISBN" value={book.isbn} testId="book-isbn" />
              <DetailRow label="Páginas" value={book.numeroPaginas} testId="book-paginas" />
              {book.altura && book.largura && book.profundidade && (
                <DetailRow
                  label="Dimensões"
                  value={`${book.altura} × ${book.largura} × ${book.profundidade} cm`}
                  testId="book-dimensoes"
                />
              )}
              <DetailRow
                label="Peso"
                value={book.peso ? `${book.peso} kg` : undefined}
                testId="book-peso"
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Synopsis */}
      {book.sinopse && (
        <section className="mb-5">
          <h2 className="h5 fw-bold border-bottom pb-2 mb-3">Sinopse</h2>
          <p style={{ whiteSpace: 'pre-line' }} data-testid="book-sinopse">
            {book.sinopse}
          </p>
        </section>
      )}

      {/* Reviews */}
      <section className="mb-5">
        <h2 className="h5 fw-bold border-bottom pb-2 mb-3">Avaliações dos Leitores</h2>
        <ReviewList bookId={id} refreshKey={reviewRefreshKey} />
      </section>

      <section className="mb-5">
        <ReviewForm bookId={id} onSubmitted={handleReviewSubmitted} />
      </section>
    </div>
  );
};

export default ProductPage;
