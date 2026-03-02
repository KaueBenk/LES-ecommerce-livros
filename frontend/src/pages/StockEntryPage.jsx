import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import adminService from '../services/adminService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Constants ─────────────────────────────────────────────────────────────────
const HISTORY_PAGE_SIZE = 10;

const INITIAL_FORM = {
  livroId: '',
  quantidade: '',
  valorCusto: '',
  fornecedorId: '',
  dataEntrada: new Date().toISOString().split('T')[0], // today
};

// ─── Book Search Dropdown ──────────────────────────────────────────────────────
/**
 * Searchable book selector.
 * Queries GET /admin/livros?titulo=... or ISBN after 300 ms debounce.
 */
const BookSearchSelect = ({ value, selectedTitle, onChange, error }) => {
  const [query, setQuery] = useState(selectedTitle ?? '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Sync label when parent clears selection
  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const isIsbn = /^\d{3,}$/.test(q.replace(/[- ]/g, ''));
      const params = isIsbn ? { isbn: q, size: 20 } : { titulo: q, size: 20 };
      const data = await adminService.getBooks(params);
      const books = data?.content ?? (Array.isArray(data) ? data : []);
      setResults(books);
      setOpen(books.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    if (value) onChange(null, '');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (book) => {
    setQuery(book.titulo);
    setOpen(false);
    setResults([]);
    onChange(book.id, book.titulo);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div className="input-group">
        <input
          type="text"
          className={`form-control ${error ? 'is-invalid' : ''}`}
          placeholder="Buscar por título ou ISBN…"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
          data-testid="book-search-input"
        />
        {searching && (
          <span className="input-group-text">
            <span className="spinner-border spinner-border-sm" role="status" />
          </span>
        )}
      </div>

      {open && (
        <ul
          className="dropdown-menu show w-100"
          style={{ maxHeight: 240, overflowY: 'auto', zIndex: 1050 }}
          data-testid="book-search-results"
        >
          {results.map((book) => (
            <li key={book.id}>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => handleSelect(book)}
                data-testid={`book-option-${book.id}`}
              >
                <span className="fw-semibold">{book.titulo}</span>
                {book.isbn && (
                  <span className="text-muted small ms-2">({book.isbn})</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── History Table ─────────────────────────────────────────────────────────────
const HistoryTable = ({ livroId }) => {
  const { error: notifyError } = useNotification();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchEntries = useCallback(async () => {
    if (!livroId) return;
    setLoading(true);
    try {
      const data = await adminService.getStockEntries({
        livroId,
        page,
        size: HISTORY_PAGE_SIZE,
      });
      setEntries(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao carregar histórico.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [livroId, page, notifyError]);

  useEffect(() => {
    setPage(0);
  }, [livroId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (!livroId) return null;

  return (
    <div className="mt-5" data-testid="stock-history-section">
      <h5 className="fw-bold mb-3">
        Histórico de Entradas
        {!loading && totalElements > 0 && (
          <span className="badge bg-secondary ms-2 fs-6">{totalElements}</span>
        )}
      </h5>

      {loading ? (
        <LoadingSpinner />
      ) : entries.length === 0 ? (
        <div className="alert alert-info py-2" data-testid="stock-history-empty">
          Nenhuma entrada registrada para este livro.
        </div>
      ) : (
        <>
          <div className="table-responsive" data-testid="stock-history-table-wrapper">
            <table
              className="table table-hover table-sm align-middle"
              data-testid="stock-history-table"
            >
              <thead className="table-light">
                <tr>
                  <th>Data de Entrada</th>
                  <th className="text-center">Quantidade</th>
                  <th className="text-end">Valor de Custo</th>
                  <th>Fornecedor</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} data-testid={`history-row-${entry.id}`}>
                    <td data-testid={`history-date-${entry.id}`}>
                      {entry.dataEntrada
                        ? new Intl.DateTimeFormat('pt-BR').format(new Date(entry.dataEntrada + 'T12:00:00'))
                        : '—'}
                    </td>
                    <td
                      className="text-center fw-semibold"
                      data-testid={`history-qty-${entry.id}`}
                    >
                      {entry.quantidade}
                    </td>
                    <td
                      className="text-end"
                      data-testid={`history-cost-${entry.id}`}
                    >
                      {entry.valorCusto != null ? formatCurrency(entry.valorCusto) : '—'}
                    </td>
                    <td
                      className="text-muted small"
                      data-testid={`history-supplier-${entry.id}`}
                    >
                      {entry.fornecedor ?? entry.fornecedorId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Paginação do histórico" className="mt-3">
              <ul className="pagination pagination-sm justify-content-center mb-0">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p - 1)}
                    data-testid="history-prev-page"
                  >
                    ‹ Anterior
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setPage(i)}
                      data-testid={`history-page-${i}`}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="history-next-page"
                  >
                    Próxima ›
                  </button>
                </li>
              </ul>
              <div className="text-center text-muted small mt-2">
                Página {page + 1} de {totalPages} — {totalElements} entradas no total
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

// ─── StockEntryPage ────────────────────────────────────────────────────────────
/**
 * StockEntryPage
 * @component
 * Form to register a stock entry (entrada de estoque) and view history.
 * Rendered at /admin/estoque/entrada.
 */
const StockEntryPage = () => {
  usePageTitle('Entrada de Estoque');
  const { success, error: notifyError } = useNotification();

  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedBookTitle, setSelectedBookTitle] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [historyKey, setHistoryKey] = useState(0); // bump to refresh history

  // ── Suppliers state ──────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  useEffect(() => {
    adminService
      .getSuppliers()
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoadingSuppliers(false));
  }, []);

  // ── Field change ─────────────────────────────────────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleBookSelect = useCallback((id, title) => {
    setForm((prev) => ({ ...prev, livroId: id ? String(id) : '' }));
    setSelectedBookTitle(title);
    setErrors((prev) => ({ ...prev, livroId: undefined }));
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.livroId) errs.livroId = 'Selecione um livro.';
    const qty = Number(form.quantidade);
    if (!form.quantidade || isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
      errs.quantidade = 'Informe uma quantidade inteira maior que zero.';
    }
    const cost = parseFloat(form.valorCusto);
    if (form.valorCusto === '' || isNaN(cost) || cost <= 0) {
      errs.valorCusto = 'Informe o valor de custo.';
    }
    if (!form.fornecedorId) errs.fornecedorId = 'Selecione ou informe o fornecedor.';
    if (!form.dataEntrada) errs.dataEntrada = 'Informe a data de entrada.';
    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      livroId: Number(form.livroId),
      quantidade: Number(form.quantidade),
      valorCusto: parseFloat(form.valorCusto),
      fornecedorId: Number(form.fornecedorId),
      dataEntrada: form.dataEntrada,
    };

    try {
      await adminService.createStockEntry(payload);
      success('Entrada de estoque registrada com sucesso!');
      // Reset form but keep book selected so history refreshes
      const livroId = form.livroId;
      setForm({ ...INITIAL_FORM, livroId, dataEntrada: new Date().toISOString().split('T')[0] });
      setHistoryKey((k) => k + 1); // force history refresh
    } catch (err) {
      const msg = getErrorMessage(err) || 'Erro ao registrar entrada. Tente novamente.';
      setSubmitError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSelectedBookTitle('');
    setErrors({});
    setSubmitError(null);
  };

  return (
    <div data-testid="stock-entry-page">
      {/* Header */}
      <div className="d-flex align-items-center mb-4 flex-wrap gap-2">
        <Link
          to="/admin"
          className="btn btn-sm btn-outline-secondary me-2"
          data-testid="stock-entry-back"
        >
          ← Painel
        </Link>
        <h2 className="h4 mb-0">Entrada de Estoque</h2>
      </div>

      {/* Form card */}
      <div className="card shadow-sm" data-testid="stock-entry-form-card">
        <div className="card-header bg-white fw-semibold py-3">
          Registrar Entrada
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit} noValidate data-testid="stock-entry-form">

            {/* Livro (searchable) */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Livro <span className="text-danger">*</span>
              </label>
              <BookSearchSelect
                value={form.livroId}
                selectedTitle={selectedBookTitle}
                onChange={handleBookSelect}
                error={errors.livroId}
              />
              {errors.livroId && (
                <div className="invalid-feedback d-block">{errors.livroId}</div>
              )}
              <div className="form-text">Digite o título ou ISBN para buscar.</div>
            </div>

            <div className="row">
              {/* Quantidade */}
              <div className="col-md-3 mb-3">
                <label className="form-label fw-semibold">
                  Quantidade <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className={`form-control ${errors.quantidade ? 'is-invalid' : ''}`}
                  value={form.quantidade}
                  onChange={(e) => handleChange('quantidade', e.target.value)}
                  min="1"
                  step="1"
                  placeholder="Ex: 50"
                  data-testid="field-quantidade"
                />
                {errors.quantidade && (
                  <div className="invalid-feedback">{errors.quantidade}</div>
                )}
              </div>

              {/* Valor de Custo */}
              <div className="col-md-3 mb-3">
                <label className="form-label fw-semibold">
                  Valor de Custo (R$) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text">R$</span>
                  <input
                    type="number"
                    className={`form-control ${errors.valorCusto ? 'is-invalid' : ''}`}
                    value={form.valorCusto}
                    onChange={(e) => handleChange('valorCusto', e.target.value)}
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    data-testid="field-valorCusto"
                  />
                  {errors.valorCusto && (
                    <div className="invalid-feedback">{errors.valorCusto}</div>
                  )}
                </div>
              </div>

              {/* Data de Entrada */}
              <div className="col-md-3 mb-3">
                <label className="form-label fw-semibold">
                  Data de Entrada <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className={`form-control ${errors.dataEntrada ? 'is-invalid' : ''}`}
                  value={form.dataEntrada}
                  onChange={(e) => handleChange('dataEntrada', e.target.value)}
                  data-testid="field-dataEntrada"
                />
                {errors.dataEntrada && (
                  <div className="invalid-feedback">{errors.dataEntrada}</div>
                )}
              </div>

              {/* Fornecedor */}
              <div className="col-md-3 mb-3">
                <label className="form-label fw-semibold">
                  Fornecedor <span className="text-danger">*</span>
                </label>
                {loadingSuppliers ? (
                  <div className="form-control d-flex align-items-center gap-2">
                    <span className="spinner-border spinner-border-sm" role="status" /> Carregando…
                  </div>
                ) : suppliers.length > 0 ? (
                  <select
                    className={`form-select ${errors.fornecedorId ? 'is-invalid' : ''}`}
                    value={form.fornecedorId}
                    onChange={(e) => handleChange('fornecedorId', e.target.value)}
                    data-testid="field-fornecedorId"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome ?? s.name ?? `Fornecedor #${s.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    className={`form-control ${errors.fornecedorId ? 'is-invalid' : ''}`}
                    value={form.fornecedorId}
                    onChange={(e) => handleChange('fornecedorId', e.target.value)}
                    min="1"
                    step="1"
                    placeholder="ID do fornecedor"
                    data-testid="field-fornecedorId"
                  />
                )}
                {errors.fornecedorId && (
                  <div className="invalid-feedback d-block">{errors.fornecedorId}</div>
                )}
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div
                className="alert alert-danger mt-2 mb-3"
                role="alert"
                data-testid="stock-entry-submit-error"
              >
                {submitError}
              </div>
            )}

            {/* Actions */}
            <div className="d-flex gap-2 pt-2">
              <button
                type="submit"
                className="btn btn-success"
                disabled={submitting}
                data-testid="stock-entry-submit"
              >
                {submitting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Registrando…
                  </>
                ) : (
                  '+ Registrar Entrada'
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleReset}
                disabled={submitting}
                data-testid="stock-entry-reset"
              >
                Limpar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* History table — shown when a book is selected */}
      <HistoryTable key={`${form.livroId}-${historyKey}`} livroId={form.livroId} />
    </div>
  );
};

export default StockEntryPage;
