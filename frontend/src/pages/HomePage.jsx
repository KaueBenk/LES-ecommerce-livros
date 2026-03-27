import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useCart from '../hooks/useCart';
import useNotification from '../hooks/useNotification';
import catalogService from '../services/catalogService';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BookCard from '../components/catalog/BookCard';

const PAGE_SIZE = 20;

// ── Pagination ─────────────────────────────────────────────────────────────────

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const range = 2; // pages around current
  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 ||
      i === totalPages - 1 ||
      (i >= currentPage - range && i <= currentPage + range)
    ) {
      pages.push(i);
    }
  }

  // add ellipsis markers
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) withEllipsis.push(-1); // ellipsis
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <nav aria-label="Navegação de páginas" className="mt-4" data-testid="pagination">
      <ul className="pagination justify-content-center flex-wrap">
        {/* Previous */}
        <li className={`page-item${currentPage === 0 ? ' disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            data-testid="pagination-prev"
          >
            ‹ Anterior
          </button>
        </li>

        {withEllipsis.map((p, idx) =>
          p === -1 ? (
            <li key={`ellipsis-${idx}`} className="page-item disabled">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={p} className={`page-item${p === currentPage ? ' active' : ''}`}>
              <button
                className="page-link"
                onClick={() => onPageChange(p)}
                aria-current={p === currentPage ? 'page' : undefined}
                data-testid={`pagination-page-${p}`}
              >
                {p + 1}
              </button>
            </li>
          )
        )}

        {/* Next */}
        <li className={`page-item${currentPage >= totalPages - 1 ? ' disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            data-testid="pagination-next"
          >
            Próxima ›
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ── HomePage ───────────────────────────────────────────────────────────────────

/**
 * HomePage
 * @component
 * @description Storefront with a responsive book grid, pagination, and add-to-cart.
 * @returns {JSX.Element}
 */
const HomePage = () => {
  usePageTitle('Início');

  const { addItem } = useCart();
  const { success, error: notifyError } = useNotification();

  const [page, setPage] = useState(0);
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  // Fetch books whenever page changes
  const fetchBooks = useCallback(
    async (p = page) => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await catalogService.getBooks({
          page: p,
          size: PAGE_SIZE,
          sort: 'titulo,asc',
          ativo: true,
        });
        setBooks(data.content || []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
      } catch (err) {
        setFetchError(err);
      } finally {
        setLoading(false);
      }
    },
    [page]
  );

  // Initial load and page changes
  React.useEffect(() => {
    fetchBooks(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (book) => {
    setAddingId(book.id);
    try {
      await addItem(book, 1);
      success(`"${book.titulo}" adicionado ao carrinho!`);
    } catch {
      notifyError('Não foi possível adicionar ao carrinho.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="page-container" data-testid="home-page">
      {/* Hero section */}
      <section className="bg-primary text-white py-5 mb-4">
        <div className="container text-center">
          <h1 className="display-5 fw-bold mb-3">📚 Bem-vindo à LES Livraria</h1>
          <p className="lead mb-4">Descubra os melhores livros com os melhores preços.</p>
          <Link to={ROUTES.CATALOG} className="btn btn-light btn-lg me-2" data-testid="hero-cta">
            Ver Catálogo Completo
          </Link>
        </div>
      </section>

      <div className="container">
        {/* Section header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h4 mb-0" data-testid="books-section-title">
            Nossos Livros
            {!loading && totalElements > 0 && (
              <small className="text-muted fs-6 ms-2">({totalElements} títulos)</small>
            )}
          </h2>
          <Link to={ROUTES.CATALOG} className="btn btn-outline-primary btn-sm">
            Ver todos
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-5" data-testid="books-loading">
            <LoadingSpinner message="Carregando livros..." />
          </div>
        )}

        {/* Error */}
        {fetchError && !loading && (
          <div className="alert alert-danger d-flex align-items-center" role="alert" data-testid="books-error">
            <span className="me-3">⚠️</span>
            <div>
              Não foi possível carregar os livros.{' '}
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-2"
                onClick={() => fetchBooks(page)}
                data-testid="books-retry-btn"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && books.length === 0 && (
          <div className="text-center py-5 text-muted" data-testid="books-empty">
            <div className="fs-1 mb-2">📭</div>
            <p>Nenhum livro encontrado.</p>
          </div>
        )}

        {/* Book Grid — 1 col mobile, 2 tablet, 3 desktop+ */}
        {!loading && books.length > 0 && (
          <div
            className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4"
            data-testid="books-grid"
          >
            {books.map((book) => (
              <div key={book.id} className="col">
                <BookCard
                  book={book}
                  onAddToCart={handleAddToCart}
                  addingId={addingId}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !fetchError && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Page info */}
        {!loading && books.length > 0 && (
          <p className="text-center text-muted small mt-2" data-testid="page-info">
            Página {page + 1} de {totalPages}
          </p>
        )}
      </div>
    </div>
  );
};

export default HomePage;
