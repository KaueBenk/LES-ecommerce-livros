import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useCart from '../hooks/useCart';
import useNotification from '../hooks/useNotification';
import catalogService from '../services/catalogService';
import FilterPanel from '../components/catalog/FilterPanel';
import BookCard from '../components/catalog/BookCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 400;

const EMPTY_FILTERS = {
  titulo: '',
  autorId: '',
  categoriaId: '',
  ano: '',
  isbn: '',
};

// ── Pagination ─────────────────────────────────────────────────────────────

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  const range = 2;
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || (i >= currentPage - range && i <= currentPage + range)) {
      pages.push(i);
    }
  }
  const withEllipsis = [];
  let prev = null;
  for (const p of pages) {
    if (prev !== null && p - prev > 1) withEllipsis.push(-1);
    withEllipsis.push(p);
    prev = p;
  }

  return (
    <nav aria-label="Navegação de páginas" className="mt-4" data-testid="catalog-pagination">
      <ul className="pagination justify-content-center flex-wrap">
        <li className={`page-item${currentPage === 0 ? ' disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0} data-testid="pagination-prev">
            ‹ Anterior
          </button>
        </li>
        {withEllipsis.map((p, idx) =>
          p === -1 ? (
            <li key={`e-${idx}`} className="page-item disabled"><span className="page-link">…</span></li>
          ) : (
            <li key={p} className={`page-item${p === currentPage ? ' active' : ''}`}>
              <button className="page-link" onClick={() => onPageChange(p)} aria-current={p === currentPage ? 'page' : undefined} data-testid={`pagination-page-${p}`}>
                {p + 1}
              </button>
            </li>
          )
        )}
        <li className={`page-item${currentPage >= totalPages - 1 ? ' disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages - 1} data-testid="pagination-next">
            Próxima ›
          </button>
        </li>
      </ul>
    </nav>
  );
};

// ── CatalogPage ────────────────────────────────────────────────────────────

/**
 * CatalogPage
 * @component
 * @description Full catalog with FilterPanel sidebar (desktop) / offcanvas (mobile),
 * URL-synced filters, debounced search, pagination, and add-to-cart.
 */
const CatalogPage = () => {
  usePageTitle('Catálogo');
  const { addItem } = useCart();
  const { success, error: notifyError } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initialize filters from URL params ──────────────────────────────────
  const [filters, setFilters] = useState(() => ({
    titulo: searchParams.get('titulo') || '',
    autorId: searchParams.get('autorId') || '',
    categoriaId: searchParams.get('categoriaId') || '',
    ano: searchParams.get('ano') || '',
    isbn: searchParams.get('isbn') || '',
  }));

  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '0', 10));
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [addingId, setAddingId] = useState(null);

  // Options for dropdowns
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Offcanvas state for mobile
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  // Debounce ref
  const debounceRef = useRef(null);

  // ── Load dropdown options once ────────────────────────────────────────────
  useEffect(() => {
    setLoadingOptions(true);
    Promise.all([catalogService.getAuthors(), catalogService.getCategories()])
      .then(([autors, cats]) => {
        setAuthors(Array.isArray(autors) ? autors : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {
        // non-critical — filters still work without options
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  // ── Fetch books ───────────────────────────────────────────────────────────
  const fetchBooks = useCallback(async (currentFilters, currentPage) => {
    setLoading(true);
    setFetchError(null);
    const params = {
      page: currentPage,
      size: PAGE_SIZE,
      sort: 'titulo,asc',
      ativo: true,
    };
    if (currentFilters.titulo) params.titulo = currentFilters.titulo;
    if (currentFilters.autorId) params.autorId = currentFilters.autorId;
    if (currentFilters.categoriaId) params.categoriaId = currentFilters.categoriaId;
    if (currentFilters.ano) params.ano = currentFilters.ano;
    if (currentFilters.isbn) params.isbn = currentFilters.isbn;
    try {
      const data = await catalogService.getBooks(params);
      setBooks(data.content || []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      setFetchError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Sync URL params and debounce API calls when filters/page change ───────
  useEffect(() => {
    // Sync URL
    const params = {};
    if (filters.titulo) params.titulo = filters.titulo;
    if (filters.autorId) params.autorId = filters.autorId;
    if (filters.categoriaId) params.categoriaId = filters.categoriaId;
    if (filters.ano) params.ano = filters.ano;
    if (filters.isbn) params.isbn = filters.isbn;
    if (page > 0) params.page = String(page);
    setSearchParams(params, { replace: true });

    // Debounce API call
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchBooks(filters, page);
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [filters, page, fetchBooks, setSearchParams]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0); // reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setPage(0);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (book) => {
    setAddingId(book.id);
    try {
      addItem(book, 1);
      success(`"${book.titulo}" adicionado ao carrinho!`);
    } catch {
      notifyError('Não foi possível adicionar ao carrinho.');
    } finally {
      setAddingId(null);
    }
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container page-container" data-testid="catalog-page">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0" data-testid="catalog-title">
          Catálogo de Livros
          {!loading && totalElements > 0 && (
            <small className="text-muted fs-6 ms-2">({totalElements} títulos)</small>
          )}
        </h1>

        {/* Mobile: filter toggle */}
        <button
          type="button"
          className="btn btn-outline-secondary d-lg-none"
          onClick={() => setShowOffcanvas(true)}
          data-testid="filter-offcanvas-toggle"
          aria-label="Abrir filtros"
        >
          🔍 Filtros{hasActiveFilters && <span className="badge bg-primary ms-1">•</span>}
        </button>
      </div>

      <div className="row g-4">
        {/* ── Desktop sidebar ──────────────────────────────────────────── */}
        <aside className="col-lg-3 d-none d-lg-block" data-testid="filter-sidebar">
          <div className="card border-0 shadow-sm p-3">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              authors={authors}
              categories={categories}
              loadingOptions={loadingOptions}
            />
          </div>
        </aside>

        {/* ── Books column ─────────────────────────────────────────────── */}
        <div className="col-12 col-lg-9">
          {/* Loading */}
          {loading && (
            <div className="text-center py-5" data-testid="catalog-loading">
              <LoadingSpinner message="Carregando livros..." />
            </div>
          )}

          {/* Error */}
          {fetchError && !loading && (
            <div className="alert alert-danger d-flex align-items-center" role="alert" data-testid="catalog-error">
              <span className="me-3">⚠️</span>
              <div>
                Não foi possível carregar os livros.{' '}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() => fetchBooks(filters, page)}
                  data-testid="catalog-retry-btn"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !fetchError && books.length === 0 && (
            <div className="text-center py-5 text-muted" data-testid="catalog-empty">
              <div className="fs-1 mb-2">📭</div>
              <p>Nenhum livro encontrado para os filtros selecionados.</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClearFilters}
                  data-testid="catalog-clear-from-empty"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && !loading && (
            <div className="mb-3 d-flex flex-wrap gap-2 align-items-center" data-testid="active-filter-chips">
              {filters.titulo && (
                <span className="badge bg-light text-dark border">
                  Título: {filters.titulo}
                  <button type="button" className="btn-close btn-close-dark ms-1" style={{ fontSize: '0.5rem' }} onClick={() => handleFilterChange('titulo', '')} aria-label="Remover filtro título" />
                </span>
              )}
              {filters.autorId && (
                <span className="badge bg-light text-dark border">
                  Autor: {authors.find((a) => String(a.id) === filters.autorId)?.nome || filters.autorId}
                  <button type="button" className="btn-close btn-close-dark ms-1" style={{ fontSize: '0.5rem' }} onClick={() => handleFilterChange('autorId', '')} aria-label="Remover filtro autor" />
                </span>
              )}
              {filters.categoriaId && (
                <span className="badge bg-light text-dark border">
                  Categoria: {categories.find((c) => String(c.id) === filters.categoriaId)?.nome || filters.categoriaId}
                  <button type="button" className="btn-close btn-close-dark ms-1" style={{ fontSize: '0.5rem' }} onClick={() => handleFilterChange('categoriaId', '')} aria-label="Remover filtro categoria" />
                </span>
              )}
              {filters.ano && (
                <span className="badge bg-light text-dark border">
                  Ano: {filters.ano}
                  <button type="button" className="btn-close btn-close-dark ms-1" style={{ fontSize: '0.5rem' }} onClick={() => handleFilterChange('ano', '')} aria-label="Remover filtro ano" />
                </span>
              )}
              {filters.isbn && (
                <span className="badge bg-light text-dark border">
                  ISBN: {filters.isbn}
                  <button type="button" className="btn-close btn-close-dark ms-1" style={{ fontSize: '0.5rem' }} onClick={() => handleFilterChange('isbn', '')} aria-label="Remover filtro isbn" />
                </span>
              )}
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleClearFilters} data-testid="clear-chips-btn">
                Limpar todos
              </button>
            </div>
          )}

          {/* Grid */}
          {!loading && books.length > 0 && (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-4" data-testid="catalog-books-grid">
              {books.map((book) => (
                <div key={book.id} className="col">
                  <BookCard book={book} onAddToCart={handleAddToCart} addingId={addingId} />
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && !fetchError && totalPages > 1 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          )}

          {!loading && books.length > 0 && (
            <p className="text-center text-muted small mt-2" data-testid="catalog-page-info">
              Página {page + 1} de {totalPages}
            </p>
          )}
        </div>
      </div>

      {/* ── Mobile offcanvas ─────────────────────────────────────────────── */}
      {showOffcanvas && (
        <div
          className="offcanvas offcanvas-start show"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          data-testid="filter-offcanvas"
          style={{ visibility: 'visible' }}
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Filtros</h5>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowOffcanvas(false)}
              aria-label="Fechar filtros"
              data-testid="filter-offcanvas-close"
            />
          </div>
          <div className="offcanvas-body">
            <FilterPanel
              filters={filters}
              onFilterChange={(name, value) => {
                handleFilterChange(name, value);
              }}
              onClearFilters={() => {
                handleClearFilters();
                setShowOffcanvas(false);
              }}
              authors={authors}
              categories={categories}
              loadingOptions={loadingOptions}
            />
            <button
              type="button"
              className="btn btn-primary w-100 mt-3"
              onClick={() => setShowOffcanvas(false)}
              data-testid="filter-offcanvas-apply"
            >
              Ver resultados
            </button>
          </div>
        </div>
      )}
      {showOffcanvas && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={() => setShowOffcanvas(false)}
          data-testid="filter-offcanvas-backdrop"
        />
      )}
    </div>
  );
};

export default CatalogPage;
