import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CREDIT_CARD_BRANDS } from '../../utils/constants';

const EMPTY_CARD = {
  numero: '',
  nomeImpresso: '',
  bandeira: 'VISA',
  codigoSeguranca: '',
};

const normalizeBrandToCode = (bandeira) => {
  if (!bandeira) return 'VISA';
  const raw = (typeof bandeira === 'object' ? bandeira?.nome : bandeira).toUpperCase();
  if (raw === 'VISA') return 'VISA';
  if (raw === 'MASTERCARD') return 'MASTERCARD';
  if (raw === 'ELO') return 'ELO';
  if (raw === 'AMEX' || raw === 'AMERICAN EXPRESS') return 'AMEX';
  return 'VISA';
};

/**
 * Formats a card number string with spaces every 4 digits.
 */
const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

/**
 * CreditCardForm
 * @component
 * @description Modal form for adding or editing a credit card.
 * Pre-fills when `card` prop is provided (edit mode).
 */
const CreditCardForm = ({ card, onSave, onClose, saving, serverError }) => {
  const [form, setForm] = useState(EMPTY_CARD);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Pre-fill on edit
  useEffect(() => {
    if (card) {
      setForm({
        numero: card.numero || '',
        nomeImpresso: card.nomeImpresso || '',
        bandeira: normalizeBrandToCode(card.bandeira),
        codigoSeguranca: card.codigoSeguranca || '',
      });
    } else {
      setForm(EMPTY_CARD);
    }
    setErrors({});
    setTouched({});
  }, [card]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'numero': {
        const digits = value.replace(/\D/g, '');
        if (!digits) return 'Número do cartão obrigatório.';
        if (digits.length < 13 || digits.length > 16) return 'Número do cartão inválido.';
        return '';
      }
      case 'nomeImpresso':
        return value.trim().length >= 2 ? '' : 'Nome impresso obrigatório (mín. 2 caracteres).';
      case 'bandeira':
        return value ? '' : 'Bandeira obrigatória.';
      case 'codigoSeguranca': {
        const cvv = value.replace(/\D/g, '');
        if (!cvv) return 'Código de segurança obrigatório.';
        if (cvv.length < 3 || cvv.length > 4) return 'Código de segurança inválido (3-4 dígitos).';
        return '';
      }
      default:
        return '';
    }
  };

  const validateAll = () => {
    const fields = ['numero', 'nomeImpresso', 'bandeira', 'codigoSeguranca'];
    const newErrors = {};
    fields.forEach((f) => {
      const err = validateField(f, form[f]);
      if (err) newErrors[f] = err;
    });
    return newErrors;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'numero') formatted = formatCardNumber(value);
    if (name === 'codigoSeguranca') formatted = value.replace(/\D/g, '').slice(0, 4);
    if (name === 'nomeImpresso') formatted = value.toUpperCase();
    setForm((prev) => ({ ...prev, [name]: formatted }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, formatted) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = { numero: true, nomeImpresso: true, bandeira: true, codigoSeguranca: true };
    setTouched(allTouched);
    const validationErrors = validateAll();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    // Strip spaces from card number before submitting
    onSave({
      ...form,
      numero: form.numero.replace(/\s/g, ''),
    });
  };

  const isEditMode = !!card?.id;

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      data-testid="credit-card-form-modal"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title" data-testid="credit-card-form-title">
              {isEditMode ? 'Editar Cartão' : 'Adicionar Cartão'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Fechar"
              data-testid="credit-card-form-close"
              disabled={saving}
            />
          </div>

          {/* Body */}
          <div className="modal-body">
            {serverError && (
              <div className="alert alert-danger" role="alert" data-testid="credit-card-form-server-error">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate data-testid="credit-card-form">
              {/* Card number */}
              <div className="mb-3">
                <label htmlFor="cc-numero" className="form-label">
                  Número do Cartão <span className="text-danger">*</span>
                </label>
                <input
                  id="cc-numero"
                  type="text"
                  className={`form-control${touched.numero && errors.numero ? ' is-invalid' : touched.numero && !errors.numero ? ' is-valid' : ''}`}
                  name="numero"
                  value={form.numero}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0000 0000 0000 0000"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  data-testid="credit-card-numero"
                  disabled={isEditMode} // card number not editable
                />
                {touched.numero && errors.numero && (
                  <div className="invalid-feedback" data-testid="credit-card-numero-error">
                    {errors.numero}
                  </div>
                )}
                {isEditMode && (
                  <div className="form-text text-muted">O número do cartão não pode ser alterado.</div>
                )}
              </div>

              {/* Name on card */}
              <div className="mb-3">
                <label htmlFor="cc-nomeImpresso" className="form-label">
                  Nome Impresso no Cartão <span className="text-danger">*</span>
                </label>
                <input
                  id="cc-nomeImpresso"
                  type="text"
                  className={`form-control${touched.nomeImpresso && errors.nomeImpresso ? ' is-invalid' : touched.nomeImpresso && !errors.nomeImpresso ? ' is-valid' : ''}`}
                  name="nomeImpresso"
                  value={form.nomeImpresso}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="NOME COMO ESTÁ NO CARTÃO"
                  autoComplete="cc-name"
                  data-testid="credit-card-nome"
                />
                {touched.nomeImpresso && errors.nomeImpresso && (
                  <div className="invalid-feedback" data-testid="credit-card-nome-error">
                    {errors.nomeImpresso}
                  </div>
                )}
              </div>

              {/* Brand */}
              <div className="mb-3">
                <label htmlFor="cc-bandeira" className="form-label">
                  Bandeira <span className="text-danger">*</span>
                </label>
                <select
                  id="cc-bandeira"
                  className={`form-select${touched.bandeira && errors.bandeira ? ' is-invalid' : ''}`}
                  name="bandeira"
                  value={form.bandeira}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  data-testid="credit-card-bandeira"
                >
                  {CREDIT_CARD_BRANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                {touched.bandeira && errors.bandeira && (
                  <div className="invalid-feedback">{errors.bandeira}</div>
                )}
              </div>

              {/* CVV */}
              <div className="mb-3">
                <label htmlFor="cc-cvv" className="form-label">
                  Código de Segurança (CVV) <span className="text-danger">*</span>
                </label>
                <input
                  id="cc-cvv"
                  type="text"
                  className={`form-control${touched.codigoSeguranca && errors.codigoSeguranca ? ' is-invalid' : touched.codigoSeguranca && !errors.codigoSeguranca ? ' is-valid' : ''}`}
                  name="codigoSeguranca"
                  value={form.codigoSeguranca}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="000"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  data-testid="credit-card-cvv"
                  style={{ maxWidth: '120px' }}
                />
                {touched.codigoSeguranca && errors.codigoSeguranca && (
                  <div className="invalid-feedback" data-testid="credit-card-cvv-error">
                    {errors.codigoSeguranca}
                  </div>
                )}
              </div>

              {/* Footer inside form for submit */}
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={saving}
                  data-testid="credit-card-form-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  data-testid="credit-card-form-submit"
                >
                  {saving ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Salvando...
                    </>
                  ) : isEditMode ? (
                    'Salvar Alterações'
                  ) : (
                    'Adicionar Cartão'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

CreditCardForm.propTypes = {
  card: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  serverError: PropTypes.string,
};

CreditCardForm.defaultProps = {
  card: null,
  saving: false,
  serverError: '',
};

export default CreditCardForm;
