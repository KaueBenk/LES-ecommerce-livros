import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import adminService from '../services/adminService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = ['Informações Básicas', 'Dados Físicos', 'Preço & Categorias'];

const Stepper = ({ currentStep }) => (
  <div className="d-flex align-items-center mb-5" data-testid="book-form-stepper">
    {STEPS.map((label, idx) => {
      const stepNum = idx + 1;
      const isDone = currentStep > stepNum;
      const isActive = currentStep === stepNum;
      return (
        <React.Fragment key={stepNum}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 100 }}>
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold ${
                isDone
                  ? 'bg-success text-white'
                  : isActive
                  ? 'bg-primary text-white'
                  : 'bg-light text-muted border'
              }`}
              style={{ width: 40, height: 40 }}
              data-testid={`book-step-circle-${stepNum}`}
            >
              {isDone ? '✓' : stepNum}
            </div>
            <small
              className={`mt-1 text-center ${
                isActive ? 'fw-semibold text-primary' : isDone ? 'text-success' : 'text-muted'
              }`}
              style={{ fontSize: '0.72rem' }}
            >
              {label}
            </small>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className="flex-grow-1 mx-2"
              style={{
                height: 2,
                backgroundColor: isDone ? '#198754' : '#dee2e6',
                marginBottom: '1.5rem',
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ─── Field helpers ────────────────────────────────────────────────────────────

const Field = ({ label, required, error, children, hint }) => (
  <div className="mb-3">
    <label className="form-label fw-semibold">
      {label}
      {required && <span className="text-danger ms-1">*</span>}
    </label>
    {children}
    {hint && <div className="form-text text-muted">{hint}</div>}
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
);

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

const Step1 = ({ form, errors, onChange, authors, publishers, loadingRefs }) => (
  <div data-testid="book-form-step1">
    <h5 className="fw-bold mb-4">Informações Básicas</h5>

    <Field label="Título" required error={errors.titulo}>
      <input
        type="text"
        className={`form-control ${errors.titulo ? 'is-invalid' : ''}`}
        value={form.titulo}
        onChange={(e) => onChange('titulo', e.target.value)}
        placeholder="Ex: Clean Code"
        data-testid="field-titulo"
      />
    </Field>

    <div className="row">
      <div className="col-md-6">
        <Field label="Autor" required error={errors.autorId}>
          {loadingRefs ? (
            <div className="form-control d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" /> Carregando…
            </div>
          ) : (
            <select
              className={`form-select ${errors.autorId ? 'is-invalid' : ''}`}
              value={form.autorId}
              onChange={(e) => onChange('autorId', e.target.value)}
              data-testid="field-autorId"
            >
              <option value="">Selecione um autor</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="col-md-6">
        <Field label="Editora" required error={errors.editoraId}>
          {loadingRefs ? (
            <div className="form-control d-flex align-items-center gap-2">
              <span className="spinner-border spinner-border-sm" role="status" /> Carregando…
            </div>
          ) : (
            <select
              className={`form-select ${errors.editoraId ? 'is-invalid' : ''}`}
              value={form.editoraId}
              onChange={(e) => onChange('editoraId', e.target.value)}
              data-testid="field-editoraId"
            >
              <option value="">Selecione uma editora</option>
              {publishers.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </div>

    <div className="row">
      <div className="col-md-4">
        <Field label="Edição" required error={errors.edicao}>
          <input
            type="text"
            className={`form-control ${errors.edicao ? 'is-invalid' : ''}`}
            value={form.edicao}
            onChange={(e) => onChange('edicao', e.target.value)}
            placeholder="Ex: 1ª"
            data-testid="field-edicao"
          />
        </Field>
      </div>
      <div className="col-md-4">
        <Field label="Ano de Publicação" required error={errors.ano}>
          <input
            type="number"
            className={`form-control ${errors.ano ? 'is-invalid' : ''}`}
            value={form.ano}
            onChange={(e) => onChange('ano', e.target.value)}
            placeholder="Ex: 2008"
            min="1000"
            max="2099"
            data-testid="field-ano"
          />
        </Field>
      </div>
      <div className="col-md-4">
        <Field label="ISBN" required error={errors.isbn} hint="13 dígitos sem traços">
          <input
            type="text"
            className={`form-control ${errors.isbn ? 'is-invalid' : ''}`}
            value={form.isbn}
            onChange={(e) => onChange('isbn', e.target.value)}
            placeholder="Ex: 9780132350884"
            maxLength={13}
            data-testid="field-isbn"
          />
        </Field>
      </div>
    </div>
  </div>
);

// ─── Step 2: Physical Properties ─────────────────────────────────────────────

const Step2 = ({ form, errors, onChange }) => (
  <div data-testid="book-form-step2">
    <h5 className="fw-bold mb-4">Dados Físicos</h5>

    <div className="row">
      <div className="col-md-4">
        <Field label="Número de Páginas" error={errors.numeroPaginas}>
          <input
            type="number"
            className={`form-control ${errors.numeroPaginas ? 'is-invalid' : ''}`}
            value={form.numeroPaginas}
            onChange={(e) => onChange('numeroPaginas', e.target.value)}
            min="1"
            placeholder="Ex: 464"
            data-testid="field-numeroPaginas"
          />
        </Field>
      </div>
      <div className="col-md-8">
        <Field label="Código de Barras" error={errors.codigoBarras}>
          <input
            type="text"
            className={`form-control ${errors.codigoBarras ? 'is-invalid' : ''}`}
            value={form.codigoBarras}
            onChange={(e) => onChange('codigoBarras', e.target.value)}
            placeholder="Ex: 9780132350884"
            data-testid="field-codigoBarras"
          />
        </Field>
      </div>
    </div>

    <Field label="Sinopse" error={errors.sinopse}>
      <textarea
        className={`form-control ${errors.sinopse ? 'is-invalid' : ''}`}
        value={form.sinopse}
        onChange={(e) => onChange('sinopse', e.target.value)}
        rows={4}
        placeholder="Descrição do livro…"
        data-testid="field-sinopse"
      />
    </Field>

    <h6 className="fw-semibold mt-4 mb-3">Dimensões</h6>
    <div className="row g-3">
      <div className="col-6 col-md-3">
        <Field label="Altura (cm)" error={errors.altura}>
          <input
            type="number"
            className={`form-control ${errors.altura ? 'is-invalid' : ''}`}
            value={form.altura}
            onChange={(e) => onChange('altura', e.target.value)}
            min="0"
            step="0.1"
            placeholder="24.0"
            data-testid="field-altura"
          />
        </Field>
      </div>
      <div className="col-6 col-md-3">
        <Field label="Largura (cm)" error={errors.largura}>
          <input
            type="number"
            className={`form-control ${errors.largura ? 'is-invalid' : ''}`}
            value={form.largura}
            onChange={(e) => onChange('largura', e.target.value)}
            min="0"
            step="0.1"
            placeholder="17.0"
            data-testid="field-largura"
          />
        </Field>
      </div>
      <div className="col-6 col-md-3">
        <Field label="Profundidade (cm)" error={errors.profundidade}>
          <input
            type="number"
            className={`form-control ${errors.profundidade ? 'is-invalid' : ''}`}
            value={form.profundidade}
            onChange={(e) => onChange('profundidade', e.target.value)}
            min="0"
            step="0.1"
            placeholder="3.0"
            data-testid="field-profundidade"
          />
        </Field>
      </div>
      <div className="col-6 col-md-3">
        <Field label="Peso (kg)" error={errors.peso}>
          <input
            type="number"
            className={`form-control ${errors.peso ? 'is-invalid' : ''}`}
            value={form.peso}
            onChange={(e) => onChange('peso', e.target.value)}
            min="0"
            step="0.01"
            placeholder="0.50"
            data-testid="field-peso"
          />
        </Field>
      </div>
    </div>
  </div>
);

// ─── Step 3: Pricing & Categories ─────────────────────────────────────────────

const Step3 = ({ form, errors, onChange, categories, pricingGroups, loadingRefs, bookId }) => {
  // Pricing group selection
  const selectedGroup = pricingGroups.find((g) => String(g.id) === String(form.grupoPrecificacaoId));
  const margemRaw = selectedGroup?.margem ?? selectedGroup?.margemLucro;
  const margemPercent = margemRaw != null ? (Number(margemRaw) <= 1 ? Number(margemRaw) * 100 : Number(margemRaw)) : null;
  const hasMargem = margemPercent != null && form.valorCusto;

  // Computed price range from cost and margin
  const cost = hasMargem ? parseFloat(form.valorCusto) : null;
  const margem = hasMargem ? margemPercent : null;
  const targetPrice = hasMargem ? cost * (1 + margem / 100) : null;
  const minPrice = hasMargem ? targetPrice * (1 - margem / 100) : null;
  const maxPrice = hasMargem ? targetPrice * (1 + margem / 100) : null;

  // Margin indicator for actual sale price
  const salePrice = form.precoVenda !== '' ? parseFloat(form.precoVenda) : null;
  const hasSalePrice = salePrice !== null && !isNaN(salePrice) && salePrice > 0;
  const isWithinMargin = hasMargem && hasSalePrice
    ? salePrice >= minPrice && salePrice <= maxPrice
    : null;
  // True when we have a margin + sale price and it's outside range
  const isOutside = isWithinMargin === false;

  const handleCategoryToggle = (catId) => {
    const current = form.categoriaIds ?? [];
    const next = current.includes(catId)
      ? current.filter((id) => id !== catId)
      : [...current, catId];
    onChange('categoriaIds', next);
  };

  return (
    <div data-testid="book-form-step3">
      <h5 className="fw-bold mb-4">Preço &amp; Categorias</h5>

      {/* Pricing group */}
      <Field label="Grupo de Precificação" error={errors.grupoPrecificacaoId}>
        {loadingRefs ? (
          <div className="form-control d-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm" role="status" /> Carregando…
          </div>
        ) : pricingGroups.length === 0 ? (
          <div className="alert alert-warning py-2 small mb-0">
            Nenhum grupo de precificação disponível. O campo será ignorado no envio.
          </div>
        ) : (
          <select
            className={`form-select ${errors.grupoPrecificacaoId ? 'is-invalid' : ''}`}
            value={form.grupoPrecificacaoId}
            onChange={(e) => onChange('grupoPrecificacaoId', e.target.value)}
            data-testid="field-grupoPrecificacaoId"
          >
              <option value="">Selecione um grupo</option>
              {pricingGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                  {g.margem != null || g.margemLucro != null
                    ? ` (margem ${Number(g.margem ?? g.margemLucro) <= 1 ? Number(g.margem ?? g.margemLucro) * 100 : Number(g.margem ?? g.margemLucro)}%)`
                    : ''}
                </option>
              ))}
            </select>
        )}
      </Field>

      {/* Cost input (new books only) */}
      {!bookId && (
        <Field
          label="Valor de Custo (R$)"
          hint="Usado para calcular o intervalo de preço de venda"
          error={errors.valorCusto}
        >
          <div className="input-group" style={{ maxWidth: 200 }}>
            <span className="input-group-text">R$</span>
            <input
              type="number"
              className="form-control"
              value={form.valorCusto ?? ''}
              onChange={(e) => onChange('valorCusto', e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              data-testid="field-valorCusto"
            />
          </div>
        </Field>
      )}

      {/* Margin range card */}
      {hasMargem && (
        <div className="card border-0 bg-light mb-4" data-testid="margin-range-card">
          <div className="card-body py-3">
            <p className="small fw-semibold mb-2 text-secondary">
              Intervalo de Preço Permitido
              <span className="ms-1 text-muted">(margem {margem}%)</span>
            </p>
            <div className="d-flex gap-4">
              <div>
                <span className="text-muted small">Mínimo</span>
                <div className="fw-bold text-dark" data-testid="margin-min-price">
                  {formatCurrency(minPrice)}
                </div>
              </div>
              <div className="text-muted align-self-end mb-1">—</div>
              <div>
                <span className="text-muted small">Máximo</span>
                <div className="fw-bold text-dark" data-testid="margin-max-price">
                  {formatCurrency(maxPrice)}
                </div>
              </div>
              <div className="ms-auto align-self-end mb-1 small text-muted">
                Referência: <span className="fw-semibold text-success" data-testid="price-preview-value">{formatCurrency(targetPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actual sale price input */}
      <Field label="Preço de Venda (R$)" error={errors.precoVenda}>
        <div className="d-flex align-items-center gap-3" style={{ maxWidth: 300 }}>
          <div className="input-group">
            <span className="input-group-text">R$</span>
            <input
              type="number"
              className={`form-control ${
                errors.precoVenda
                  ? 'is-invalid'
                  : isWithinMargin === true
                  ? 'is-valid'
                  : isWithinMargin === false
                  ? 'is-invalid'
                  : ''
              }`}
              value={form.precoVenda ?? ''}
              onChange={(e) => onChange('precoVenda', e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              data-testid="field-precoVenda"
            />
          </div>
          {isWithinMargin === true && (
            <span className="badge bg-success px-3 py-2" data-testid="margin-indicator-within">
              ✓ Dentro da margem
            </span>
          )}
          {isWithinMargin === false && (
            <span className="badge bg-danger px-3 py-2" data-testid="margin-indicator-outside">
              ✗ Fora da margem
            </span>
          )}
        </div>
      </Field>

      {/* Managerial authorization — only shown when outside margin */}
      {isOutside && (
        <div className="alert alert-warning d-flex align-items-start gap-3" role="alert" data-testid="authorization-alert">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span
                className="badge bg-danger px-3 py-2"
                data-testid="requires-authorization-badge"
              >
                ⚠ Requer autorização gerencial
              </span>
            </div>
            <p className="mb-1 fw-semibold">Preço fora do intervalo da margem definida.</p>
            <p className="mb-2 small">
              Para salvar um preço fora do intervalo é necessária autorização gerencial.
            </p>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="autorizacaoGerencial"
                checked={form.autorizacaoGerencial ?? false}
                onChange={(e) => onChange('autorizacaoGerencial', e.target.checked)}
                data-testid="checkbox-autorizacaoGerencial"
              />
              <label className="form-check-label fw-semibold" htmlFor="autorizacaoGerencial">
                Confirmo que possuo autorização gerencial para este preço
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Categories multi-select */}
      <Field label="Categorias" error={errors.categoriaIds}>
        {loadingRefs ? (
          <div className="d-flex align-items-center gap-2 text-muted small">
            <span className="spinner-border spinner-border-sm" role="status" /> Carregando…
          </div>
        ) : categories.length === 0 ? (
          <p className="text-muted small">Nenhuma categoria disponível.</p>
        ) : (
          <div
            className="row g-2 mt-0"
            data-testid="categories-grid"
            style={{ maxHeight: 260, overflowY: 'auto' }}
          >
            {categories.map((cat) => {
              const isChecked = (form.categoriaIds ?? []).includes(cat.id);
              return (
                <div key={cat.id} className="col-6 col-md-4">
                  <div
                    className={`form-check border rounded px-3 py-2 ${
                      isChecked ? 'border-primary bg-primary bg-opacity-10' : ''
                    }`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleCategoryToggle(cat.id)}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={`cat-${cat.id}`}
                      checked={isChecked}
                      onChange={() => handleCategoryToggle(cat.id)}
                      data-testid={`category-checkbox-${cat.id}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      htmlFor={`cat-${cat.id}`}
                      className="form-check-label small"
                      style={{ cursor: 'pointer' }}
                    >
                      {cat.nome}
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Field>
    </div>
  );
};

// ─── Validation ───────────────────────────────────────────────────────────────

const INITIAL_FORM = {
  titulo: '',
  autorId: '',
  editoraId: '',
  edicao: '',
  ano: '',
  isbn: '',
  numeroPaginas: '',
  sinopse: '',
  altura: '',
  largura: '',
  profundidade: '',
  peso: '',
  codigoBarras: '',
  grupoPrecificacaoId: '',
  categoriaIds: [],
  valorCusto: '',
  precoVenda: '',
  autorizacaoGerencial: false,
};

const validateStep = (step, form, existingBooks = [], currentBookId = null) => {
  const errs = {};
  if (step === 1) {
    if (!form.titulo.trim()) errs.titulo = 'Título é obrigatório.';
    if (!form.autorId) errs.autorId = 'Selecione um autor.';
    if (!form.editoraId) errs.editoraId = 'Selecione uma editora.';
    if (!form.edicao.trim()) errs.edicao = 'Edição é obrigatória.';
    if (!form.ano || isNaN(Number(form.ano)) || Number(form.ano) < 1000 || Number(form.ano) > 2099) {
      errs.ano = 'Informe um ano válido (1000–2099).';
    }
    if (!form.isbn.trim() || !/^\d{10,13}$/.test(form.isbn.replace(/[- ]/g, ''))) {
      errs.isbn = 'ISBN deve ter entre 10 e 13 dígitos numéricos.';
    } else {
      // Check for ISBN duplicate
      const normalizedIsbn = form.isbn.replace(/[- ]/g, '');
      const duplicate = existingBooks.find((book) => {
        const bookIsbn = (book.isbn || '').replace(/[- ]/g, '');
        return bookIsbn === normalizedIsbn && String(book.id) !== String(currentBookId);
      });
      if (duplicate) {
        errs.isbn = `ISBN já cadastrado no livro "${duplicate.titulo}".`;
      }
    }
  }
  if (step === 2) {
    if (form.numeroPaginas && (isNaN(Number(form.numeroPaginas)) || Number(form.numeroPaginas) < 1)) {
      errs.numeroPaginas = 'Informe um número de páginas válido.';
    }
    if (form.altura && isNaN(Number(form.altura))) errs.altura = 'Valor inválido.';
    if (form.largura && isNaN(Number(form.largura))) errs.largura = 'Valor inválido.';
    if (form.profundidade && isNaN(Number(form.profundidade))) errs.profundidade = 'Valor inválido.';
    if (form.peso && isNaN(Number(form.peso))) errs.peso = 'Valor inválido.';
  }
  if (step === 3) {
    if (form.precoVenda === '' || form.precoVenda === null) {
      errs.precoVenda = 'Preço de venda é obrigatório.';
    } else {
      const v = parseFloat(form.precoVenda);
      if (isNaN(v) || v <= 0) errs.precoVenda = 'Informe um preço de venda válido.';
    }
  }
  return errs;
};

// ─── Payload builder ──────────────────────────────────────────────────────────

const buildPayload = (form) => {
  const payload = {
    titulo: form.titulo.trim(),
    autorId: Number(form.autorId),
    editoraId: Number(form.editoraId),
    edicao: form.edicao.trim(),
    ano: Number(form.ano),
    isbn: form.isbn.replace(/[- ]/g, '').trim(), // Normalize ISBN (remove dashes/spaces)
  };
  if (form.numeroPaginas) payload.numeroPaginas = Number(form.numeroPaginas);
  if (form.sinopse) payload.sinopse = form.sinopse.trim();
  if (form.altura) payload.altura = parseFloat(form.altura);
  if (form.largura) payload.largura = parseFloat(form.largura);
  if (form.profundidade) payload.profundidade = parseFloat(form.profundidade);
  if (form.peso) payload.peso = parseFloat(form.peso);
  if (form.codigoBarras) payload.codigoBarras = form.codigoBarras.trim();
  if (form.grupoPrecificacaoId) payload.grupoPrecificacaoId = Number(form.grupoPrecificacaoId);
  if (form.categoriaIds?.length) payload.categoriaIds = form.categoriaIds;
  if (form.precoVenda !== '' && form.precoVenda !== null) {
    const pv = parseFloat(form.precoVenda);
    if (!isNaN(pv) && pv > 0) payload.precoVenda = pv;
  }
  if (form.autorizacaoGerencial) payload.autorizacaoGerencial = true;
  return payload;
};

// ─── BookFormPage ─────────────────────────────────────────────────────────────

/**
 * BookFormPage
 * @component
 * Multi-step form for creating or editing a book.
 * Rendered at /admin/livros/novo and /admin/livros/:bookId/editar.
 */
const BookFormPage = () => {
  const { bookId } = useParams();
  const isEdit = !!bookId;
  usePageTitle(isEdit ? 'Editar Livro' : 'Novo Livro');
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Reference data
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pricingGroups, setPricingGroups] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingBook, setLoadingBook] = useState(isEdit);
  
  // Existing books for ISBN validation
  const [existingBooks, setExistingBooks] = useState([]);

  // ── Load reference data + existing book ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      try {
        const [authorsData, publishersData, categoriesData, pricingData, booksData] = await Promise.all([
          adminService.getAuthors(),
          adminService.getPublishers(),
          adminService.getCategories(),
          adminService.getPricingGroups(),
          adminService.getBooks({ size: 1000 }), // Load all books for ISBN check
        ]);
        if (!cancelled) {
          setAuthors(Array.isArray(authorsData) ? authorsData : []);
          setPublishers(Array.isArray(publishersData) ? publishersData : []);
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
          setPricingGroups(Array.isArray(pricingData) ? pricingData : []);
          setExistingBooks(booksData?.content || []);
        }
      } catch (err) {
        if (!cancelled) notifyError('Erro ao carregar dados de referência.');
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    };
    loadAll();
    return () => { cancelled = true; };
  }, [notifyError]);

  // ── Load existing book for editing ─────────────────────────────────────
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    setLoadingBook(true);
    adminService
      .getBook(bookId)
      .then((book) => {
        if (!cancelled && book) {
          setForm({
            titulo: book.titulo ?? '',
            autorId: String(book.autorId ?? book.autor?.id ?? ''),
            editoraId: String(book.editoraId ?? book.editora?.id ?? ''),
            edicao: book.edicao ?? '',
            ano: String(book.ano ?? ''),
            isbn: book.isbn ?? '',
            numeroPaginas: String(book.numeroPaginas ?? ''),
            sinopse: book.sinopse ?? '',
            altura: String(book.altura ?? ''),
            largura: String(book.largura ?? ''),
            profundidade: String(book.profundidade ?? ''),
            peso: String(book.peso ?? ''),
            codigoBarras: book.codigoBarras ?? '',
            grupoPrecificacaoId: String(book.grupoPrecificacaoId ?? book.grupoPrecificacao?.id ?? ''),
            categoriaIds: (book.categorias ?? []).map((c) => c.id ?? c),
            valorCusto: '',
            precoVenda: String(book.precoVenda ?? book.valorVenda ?? ''),
            autorizacaoGerencial: false,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) notifyError(getErrorMessage(err) || 'Erro ao carregar livro.');
      })
      .finally(() => {
        if (!cancelled) setLoadingBook(false);
      });
  }, [bookId, isEdit, notifyError]);

  // ── Field change ────────────────────────────────────────────────────────
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────────
  const handleNext = () => {
    const errs = validateStep(currentStep, form, existingBooks, bookId);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep((s) => s + 1);
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep((s) => s - 1);
  };

  const handleCancel = () => navigate(-1);

  // ── Margin check ────────────────────────────────────────────────────────
  const _selGroup = pricingGroups.find((g) => String(g.id) === String(form.grupoPrecificacaoId));
  const _margemRaw = _selGroup?.margem ?? _selGroup?.margemLucro;
  const _margemPercent = _margemRaw != null
    ? (Number(_margemRaw) <= 1 ? Number(_margemRaw) * 100 : Number(_margemRaw))
    : null;
  const _hasMargem = _margemPercent != null && form.valorCusto;
  const _targetPrice = _hasMargem
    ? parseFloat(form.valorCusto) * (1 + _margemPercent / 100)
    : null;
  const _minPrice = _hasMargem ? _targetPrice * (1 - _margemPercent / 100) : null;
  const _maxPrice = _hasMargem ? _targetPrice * (1 + _margemPercent / 100) : null;
  const _salePrice = form.precoVenda !== '' ? parseFloat(form.precoVenda) : null;
  const _hasSalePrice = _salePrice !== null && !isNaN(_salePrice) && _salePrice > 0;
  const isOutsideMargin = _hasMargem && _hasSalePrice
    ? _salePrice < _minPrice || _salePrice > _maxPrice
    : false;
  const canSubmit = !isOutsideMargin || !!form.autorizacaoGerencial;

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validateStep(currentStep, form, existingBooks, bookId);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = buildPayload(form);
      if (isEdit) {
        await adminService.updateBook(bookId, payload);
        success('Livro atualizado com sucesso!');
      } else {
        await adminService.createBook(payload);
        success('Livro criado com sucesso!');
      }
      navigate('/admin/livros');
    } catch (err) {
      const msg = getErrorMessage(err) || 'Erro ao salvar livro. Tente novamente.';
      setSubmitError(msg);
      notifyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBook) {
    return (
      <div className="container page-container" data-testid="book-form-loading">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container page-container" data-testid="book-form-page">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm me-3"
          onClick={handleCancel}
          data-testid="book-form-back-btn"
        >
          ← Voltar
        </button>
        <h1 className="h3 mb-0">{isEdit ? 'Editar Livro' : 'Novo Livro'}</h1>
      </div>

      <Stepper currentStep={currentStep} />

      {/* Form card */}
      <div className="card shadow-sm">
        <div className="card-body p-4">
          {currentStep === 1 && (
            <Step1
              form={form}
              errors={errors}
              onChange={handleChange}
              authors={authors}
              publishers={publishers}
              loadingRefs={loadingRefs}
            />
          )}
          {currentStep === 2 && (
            <Step2
              form={form}
              errors={errors}
              onChange={handleChange}
            />
          )}
          {currentStep === 3 && (
            <Step3
              form={form}
              errors={errors}
              onChange={handleChange}
              categories={categories}
              pricingGroups={pricingGroups}
              loadingRefs={loadingRefs}
              bookId={bookId}
            />
          )}

          {/* Submit error */}
          {submitError && currentStep === 3 && (
            <div className="alert alert-danger mt-4" role="alert" data-testid="book-form-submit-error">
              {submitError}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="card-footer d-flex justify-content-between align-items-center">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={currentStep === 1 ? handleCancel : handlePrev}
            disabled={submitting}
            data-testid="book-form-prev-btn"
          >
            {currentStep === 1 ? 'Cancelar' : '← Anterior'}
          </button>

          <span className="text-muted small">
            Passo {currentStep} de {STEPS.length}
          </span>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              data-testid="book-form-next-btn"
            >
              Próximo →
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitting || !canSubmit}
              title={!canSubmit ? 'Autorize o preço fora da margem antes de salvar' : undefined}
              data-testid="book-form-submit-btn"
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Salvando…
                </>
              ) : isEdit ? (
                'Salvar Alterações'
              ) : (
                'Criar Livro'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookFormPage;
