import React from 'react';
import PropTypes from 'prop-types';

// ── FilterPanel ─────────────────────────────────────────────────────────────

/**
 * FilterPanel
 * @component
 * @description Sidebar filter panel for the catalog.
 * Supports filtering by titulo, autor, categoria, ano, isbn.
 * On desktop renders as a sidebar; on mobile renders inside an offcanvas.
 */
const FilterPanel = ({
  filters,
  onFilterChange,
  onClearFilters,
  authors,
  categories,
  loadingOptions,
}) => {
  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filtros do catálogo"
      data-testid="filter-panel"
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0 fw-semibold">
          🔍 Filtros
          {hasActiveFilters && (
            <span
              className="badge bg-primary ms-2"
              style={{ fontSize: '0.65rem' }}
              data-testid="active-filters-badge"
            >
              ativos
            </span>
          )}
        </h6>
        {hasActiveFilters && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onClearFilters}
            data-testid="clear-filters-btn"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Title search */}
      <div className="mb-3">
        <label htmlFor="filter-titulo" className="form-label small fw-semibold">
          Título
        </label>
        <input
          id="filter-titulo"
          type="search"
          className="form-control form-control-sm"
          placeholder="Buscar por título..."
          value={filters.titulo}
          onChange={(e) => onFilterChange('titulo', e.target.value)}
          data-testid="filter-titulo"
        />
      </div>

      {/* Author select */}
      <div className="mb-3">
        <label htmlFor="filter-autorId" className="form-label small fw-semibold">
          Autor
        </label>
        <select
          id="filter-autorId"
          className="form-select form-select-sm"
          value={filters.autorId}
          onChange={(e) => onFilterChange('autorId', e.target.value)}
          disabled={loadingOptions}
          data-testid="filter-autorId"
        >
          <option value="">Todos os autores</option>
          {authors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
        {loadingOptions && (
          <div className="form-text text-muted small">Carregando autores...</div>
        )}
      </div>

      {/* Category select */}
      <div className="mb-3">
        <label htmlFor="filter-categoriaId" className="form-label small fw-semibold">
          Categoria
        </label>
        <select
          id="filter-categoriaId"
          className="form-select form-select-sm"
          value={filters.categoriaId}
          onChange={(e) => onFilterChange('categoriaId', e.target.value)}
          disabled={loadingOptions}
          data-testid="filter-categoriaId"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        {loadingOptions && (
          <div className="form-text text-muted small">Carregando categorias...</div>
        )}
      </div>

      {/* Year */}
      <div className="mb-3">
        <label htmlFor="filter-ano" className="form-label small fw-semibold">
          Ano de Publicação
        </label>
        <input
          id="filter-ano"
          type="number"
          className="form-control form-control-sm"
          placeholder="Ex: 2020"
          min="1000"
          max="2100"
          value={filters.ano}
          onChange={(e) => onFilterChange('ano', e.target.value)}
          data-testid="filter-ano"
        />
      </div>

      {/* ISBN */}
      <div className="mb-3">
        <label htmlFor="filter-isbn" className="form-label small fw-semibold">
          ISBN
        </label>
        <input
          id="filter-isbn"
          type="text"
          className="form-control form-control-sm"
          placeholder="Ex: 9780132350884"
          value={filters.isbn}
          onChange={(e) => onFilterChange('isbn', e.target.value)}
          data-testid="filter-isbn"
        />
      </div>

      {/* Clear all button (bottom) */}
      {hasActiveFilters && (
        <button
          type="button"
          className="btn btn-outline-danger btn-sm w-100"
          onClick={onClearFilters}
          data-testid="clear-filters-btn-bottom"
        >
          Limpar todos os filtros
        </button>
      )}
    </form>
  );
};

FilterPanel.propTypes = {
  filters: PropTypes.shape({
    titulo: PropTypes.string,
    autorId: PropTypes.string,
    categoriaId: PropTypes.string,
    ano: PropTypes.string,
    isbn: PropTypes.string,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  authors: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, nome: PropTypes.string })
  ),
  categories: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, nome: PropTypes.string })
  ),
  loadingOptions: PropTypes.bool,
};

FilterPanel.defaultProps = {
  authors: [],
  categories: [],
  loadingOptions: false,
};

export default FilterPanel;
