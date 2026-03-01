import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import adminService from '../services/adminService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BookFormPage from './BookFormPage';
import StockEntryPage from './StockEntryPage';
import LogisticsPage from './LogisticsPage';
import ClientSearchAdmin from '../components/admin/ClientSearchAdmin';

// ─── Justification Modal (Ativar / Inativar) ──────────────────────────────────

/**
 * StatusModal
 * Modal asking for justification when toggling a book's active/inactive state.
 * For inactivation: requires motivoInativacao + categoriaInativacaoId
 * For activation:   requires motivoAtivacao  + categoriaAtivacaoId
 */
const StatusModal = ({ book, isActivating, categories, onConfirm, onClose }) => {
  const [motivo, setMotivo] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const motivoRef = useRef(null);

  useEffect(() => {
    setTimeout(() => motivoRef.current?.focus(), 50);
  }, []);

  const validate = () => {
    const errs = {};
    if (!motivo.trim()) errs.motivo = 'Informe o motivo.';
    if (!categoriaId) errs.categoriaId = 'Selecione uma categoria.';
    return errs;
  };

  const handleConfirm = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await onConfirm({ motivo: motivo.trim(), categoriaId: Number(categoriaId) });
    } finally {
      setSaving(false);
    }
  };

  const actionLabel = isActivating ? 'Ativar' : 'Inativar';
  const colorClass = isActivating ? 'btn-success' : 'btn-warning';

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
        aria-labelledby="status-modal-title"
        style={{ zIndex: 1050 }}
        data-testid="status-modal"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="status-modal-title">
                {actionLabel} livro: <em>{book.titulo}</em>
              </h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Fechar" />
            </div>
            <div className="modal-body">
              {/* Motivo */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Motivo <span className="text-danger">*</span>
                </label>
                <textarea
                  ref={motivoRef}
                  className={`form-control ${errors.motivo ? 'is-invalid' : ''}`}
                  rows={3}
                  value={motivo}
                  onChange={(e) => { setMotivo(e.target.value); setErrors((p) => ({ ...p, motivo: undefined })); }}
                  placeholder={
                    isActivating
                      ? 'Ex: Volta ao estoque, nova edição disponível…'
                      : 'Ex: Fora de mercado, produto descontinuado…'
                  }
                  data-testid="status-modal-motivo"
                />
                {errors.motivo && <div className="invalid-feedback">{errors.motivo}</div>}
              </div>

              {/* Categoria */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Categoria de {isActivating ? 'Ativação' : 'Inativação'} <span className="text-danger">*</span>
                </label>
                <select
                  className={`form-select ${errors.categoriaId ? 'is-invalid' : ''}`}
                  value={categoriaId}
                  onChange={(e) => { setCategoriaId(e.target.value); setErrors((p) => ({ ...p, categoriaId: undefined })); }}
                  data-testid="status-modal-categoria"
                >
                  <option value="">Selecione uma categoria…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                {errors.categoriaId && <div className="invalid-feedback">{errors.categoriaId}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={saving}
                data-testid="status-modal-cancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`btn ${colorClass}`}
                onClick={handleConfirm}
                disabled={saving}
                data-testid="status-modal-confirm"
              >
                {saving ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" />{actionLabel}ndo…</>
                ) : actionLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Book List ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const AdminBooksSection = () => {
  usePageTitle('Admin — Livros');
  const { error: notifyError, success } = useNotification();

  // ── Filters ──────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({ titulo: '', autorNome: '', ativo: '' });
  const [pendingFilters, setPendingFilters] = useState({ titulo: '', autorNome: '', ativo: '' });

  // ── Data ─────────────────────────────────────────────────────────────────
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // ── Categories for modal ──────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const [modalBook, setModalBook] = useState(null); // book being toggled

  // ── Fetch books ───────────────────────────────────────────────────────────
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (filters.titulo) params.titulo = filters.titulo;
      if (filters.autorNome) params.autorNome = filters.autorNome;
      if (filters.ativo !== '') params.ativo = filters.ativo === 'true';
      const data = await adminService.getBooks(params);
      setBooks(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar livros.');
    } finally {
      setLoading(false);
    }
  }, [page, filters, notifyError]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // ── Fetch categories for modal ────────────────────────────────────────────
  useEffect(() => {
    adminService.getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // ── Filter handlers ───────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setPendingFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setFilters({ ...pendingFilters });
    setPage(0);
  };

  const handleFilterReset = () => {
    const empty = { titulo: '', autorNome: '', ativo: '' };
    setPendingFilters(empty);
    setFilters(empty);
    setPage(0);
  };

  const hasActiveFilters = filters.titulo || filters.autorNome || filters.ativo !== '';

  // ── Status toggle (open modal) ────────────────────────────────────────────
  const handleToggleClick = (book) => setModalBook(book);

  const handleModalConfirm = async ({ motivo, categoriaId }) => {
    const isActivating = modalBook.ativo === false;
    try {
      if (isActivating) {
        await adminService.activateBook(modalBook.id, {
          motivoAtivacao: motivo,
          categoriaAtivacaoId: categoriaId,
        });
        success(`"${modalBook.titulo}" ativado com sucesso.`);
      } else {
        await adminService.deactivateBook(modalBook.id, {
          motivoInativacao: motivo,
          categoriaInativacaoId: categoriaId,
        });
        success(`"${modalBook.titulo}" inativado com sucesso.`);
      }
      setModalBook(null);
      fetchBooks();
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao alterar status do livro.');
      throw err; // propagate to keep modal open with spinner off
    }
  };

  const handleModalClose = () => setModalBook(null);

  return (
    <div data-testid="admin-books-section">
      {/* Toolbar */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <Link to="/admin" className="btn btn-sm btn-outline-secondary me-2" data-testid="admin-books-back">
            ← Painel
          </Link>
          <h2 className="h4 mb-0 d-inline">Gerenciar Livros</h2>
          {!loading && (
            <span className="badge bg-secondary ms-2" data-testid="admin-books-count">
              {totalElements}
            </span>
          )}
        </div>
        <Link
          to="/admin/livros/novo"
          className="btn btn-primary btn-sm"
          data-testid="new-book-btn"
        >
          + Novo Livro
        </Link>
      </div>

      {/* Inline Filters */}
      <form
        onSubmit={handleFilterSubmit}
        className="card mb-4 border-0 bg-light"
        data-testid="admin-books-filters"
      >
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold mb-1">Título</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Buscar por título…"
                value={pendingFilters.titulo}
                onChange={(e) => handleFilterChange('titulo', e.target.value)}
                data-testid="filter-titulo"
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label small fw-semibold mb-1">Autor</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Nome do autor…"
                value={pendingFilters.autorNome}
                onChange={(e) => handleFilterChange('autorNome', e.target.value)}
                data-testid="filter-autor"
              />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label small fw-semibold mb-1">Status</label>
              <select
                className="form-select form-select-sm"
                value={pendingFilters.ativo}
                onChange={(e) => handleFilterChange('ativo', e.target.value)}
                data-testid="filter-ativo"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
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
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleFilterReset}
                  data-testid="filter-reset"
                  title="Limpar filtros"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Table */}
      {loading ? (
        <LoadingSpinner />
      ) : books.length === 0 ? (
        <div className="alert alert-info" data-testid="admin-no-books">
          Nenhum livro encontrado.
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-link btn-sm ms-2 p-0"
              onClick={handleFilterReset}
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive" data-testid="admin-books-table-wrapper">
            <table className="table table-hover table-sm align-middle" data-testid="admin-books-table">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 90 }}>Código</th>
                  <th>Título / ISBN</th>
                  <th>Autor</th>
                  <th className="text-end">Preço</th>
                  <th className="text-center">Estoque</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => {
                  const isActive = book.ativo !== false;
                  return (
                    <tr key={book.id} data-testid={`admin-book-row-${book.id}`}>
                      {/* Código */}
                      <td className="small text-muted font-monospace" data-testid={`book-code-${book.id}`}>
                        {book.codigo ?? `LIV-${String(book.id).padStart(3, '0')}`}
                      </td>

                      {/* Título + ISBN */}
                      <td style={{ maxWidth: 240, overflow: 'hidden' }}>
                        <div className="fw-semibold text-truncate" title={book.titulo}>
                          {book.titulo}
                        </div>
                        {book.isbn && (
                          <div className="text-muted small">{book.isbn}</div>
                        )}
                      </td>

                      {/* Autor */}
                      <td className="small text-muted" data-testid={`book-author-${book.id}`}>
                        {book.autor?.nome ?? '—'}
                      </td>

                      {/* Preço */}
                      <td className="text-end small" data-testid={`book-price-${book.id}`}>
                        {book.precoVenda != null ? formatCurrency(book.precoVenda) : '—'}
                      </td>

                      {/* Estoque */}
                      <td className="text-center" data-testid={`book-stock-${book.id}`}>
                        {book.quantidadeEstoque != null ? (
                          <span
                            className={`badge ${
                              book.quantidadeEstoque === 0
                                ? 'bg-danger'
                                : book.quantidadeEstoque < 5
                                ? 'bg-warning text-dark'
                                : 'bg-light text-dark border'
                            }`}
                          >
                            {book.quantidadeEstoque}
                          </span>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="text-center">
                        <span
                          className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}
                          data-testid={`book-status-${book.id}`}
                        >
                          {isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          <Link
                            to={`/admin/livros/${book.id}/editar`}
                            className="btn btn-outline-primary"
                            data-testid={`edit-book-${book.id}`}
                          >
                            Editar
                          </Link>
                          <button
                            type="button"
                            className={`btn ${isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleToggleClick(book)}
                            data-testid={`toggle-book-${book.id}`}
                          >
                            {isActive ? 'Inativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Paginação de livros" className="mt-3">
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p - 1)}>‹ Anterior</button>
                </li>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  // Show first, last, and pages around current
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
                      <button className="page-link" onClick={() => setPage(pageNum)}>{pageNum + 1}</button>
                    </li>
                  );
                })}
                <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p + 1)}>Próxima ›</button>
                </li>
              </ul>
              <div className="text-center text-muted small mt-2">
                Página {page + 1} de {totalPages} — {totalElements} livros no total
              </div>
            </nav>
          )}
        </>
      )}

      {/* Activate / Inactivate Modal */}
      {modalBook && (
        <StatusModal
          book={modalBook}
          isActivating={modalBook.ativo === false}
          categories={categories}
          onConfirm={handleModalConfirm}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  usePageTitle('Administração');
  return (
    <div data-testid="admin-dashboard">
      <h1 className="mb-4">Painel Administrativo</h1>
      <div className="row g-4">
        <div className="col-md-4">
          <div className="card h-100 border-primary">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">📚 Livros</h5>
              <p className="card-text text-muted small flex-grow-1">
                Criar, editar e gerenciar o catálogo de livros.
              </p>
              <Link to="/admin/livros" className="btn btn-primary btn-sm mt-2" data-testid="admin-nav-books">
                Gerenciar Livros
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 border-warning">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">📦 Logística</h5>
              <p className="card-text text-muted small flex-grow-1">
                Despachar pedidos e confirmar entregas.
              </p>
              <Link
                to="/admin/logistica"
                className="btn btn-warning btn-sm mt-2"
                data-testid="admin-nav-logistics"
              >
                Painel Logístico
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 border-info">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">👥 Clientes</h5>
              <p className="card-text text-muted small flex-grow-1">
                Consultar e gerenciar cadastros de clientes.
              </p>
              <Link
                to="/admin/clientes"
                className="btn btn-info btn-sm mt-2"
                data-testid="admin-nav-clients"
              >
                Gerenciar Clientes
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card h-100 border-success">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">📥 Estoque</h5>
              <p className="card-text text-muted small flex-grow-1">
                Registrar entradas de estoque e consultar histórico.
              </p>
              <Link
                to="/admin/estoque/entrada"
                className="btn btn-success btn-sm mt-2"
                data-testid="admin-nav-stock"
              >
                Entrada de Estoque
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── AdminPage ────────────────────────────────────────────────────────────────

/**
 * AdminPage
 * @component
 * @description Admin area with subrouting for book management, orders, etc.
 */
const AdminPage = () => (
  <div className="container page-container" data-testid="admin-page">
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="livros" element={<AdminBooksSection />} />
      <Route path="livros/novo" element={<BookFormPage />} />
      <Route path="livros/:bookId/editar" element={<BookFormPage />} />
      <Route path="estoque/entrada" element={<StockEntryPage />} />
      <Route path="logistica" element={<LogisticsPage />} />
      <Route path="clientes" element={<ClientSearchAdmin />} />
    </Routes>
  </div>
);

export default AdminPage;
