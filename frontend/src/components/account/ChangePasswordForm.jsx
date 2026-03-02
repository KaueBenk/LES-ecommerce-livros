import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { validatePassword } from '../../utils/validators';

// ── Password strength helpers (same as RegisterForm) ─────────────────────────

const getPasswordStrength = (password) => {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  return { criteria, score };
};

const STRENGTH_LABELS = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
const STRENGTH_COLORS = ['', 'danger', 'warning', 'info', 'success'];

// ── PasswordStrengthIndicator ──────────────────────────────────────────────

const PasswordStrengthIndicator = ({ password }) => {
  if (!password) return null;
  const { criteria, score } = getPasswordStrength(password);

  return (
    <div className="mt-2" data-testid="password-strength-indicator">
      <div className="progress mb-1" style={{ height: '6px' }}>
        <div
          className={`progress-bar bg-${STRENGTH_COLORS[score]}`}
          role="progressbar"
          style={{ width: `${(score / 4) * 100}%` }}
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={4}
          data-testid="password-strength-bar"
        />
      </div>
      <small className={`text-${STRENGTH_COLORS[score]}`} data-testid="password-strength-label">
        {score > 0 ? `Força: ${STRENGTH_LABELS[score]}` : ''}
      </small>
      <ul className="list-unstyled mb-0 mt-1">
        <li>
          <small
            className={criteria.length ? 'text-success' : 'text-muted'}
            data-testid="pw-criteria-length"
          >
            {criteria.length ? '✓' : '○'} Mínimo 8 caracteres
          </small>
        </li>
        <li>
          <small
            className={criteria.uppercase ? 'text-success' : 'text-muted'}
            data-testid="pw-criteria-uppercase"
          >
            {criteria.uppercase ? '✓' : '○'} Ao menos uma letra maiúscula
          </small>
        </li>
        <li>
          <small
            className={criteria.lowercase ? 'text-success' : 'text-muted'}
            data-testid="pw-criteria-lowercase"
          >
            {criteria.lowercase ? '✓' : '○'} Ao menos uma letra minúscula
          </small>
        </li>
        <li>
          <small
            className={criteria.special ? 'text-success' : 'text-muted'}
            data-testid="pw-criteria-special"
          >
            {criteria.special ? '✓' : '○'} Ao menos um caractere especial
          </small>
        </li>
      </ul>
    </div>
  );
};

PasswordStrengthIndicator.propTypes = { password: PropTypes.string.isRequired };

// ── Empty form state ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  senhaAtual: '',
  novaSenha: '',
  confirmacaoSenha: '',
};

// ── ChangePasswordForm ─────────────────────────────────────────────────────

/**
 * ChangePasswordForm
 * @component
 * @description Form that allows an authenticated user to change their password.
 * Validates current password presence, new password strength, and confirmation match.
 * Calls `onSubmit(senhaAtual, novaSenha, confirmacaoSenha)` when valid.
 */
const ChangePasswordForm = ({ onSubmit, submitting, serverError, successMessage }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);

  // ── Validation ────────────────────────────────────────────────────────────
  const validateField = (name, value, currentForm = form) => {
    switch (name) {
      case 'senhaAtual':
        return value.trim() ? '' : 'Senha atual obrigatória.';
      case 'novaSenha': {
        if (!value) return 'Nova senha obrigatória.';
        const { valid, errors: pwErrors } = validatePassword(value);
        if (!valid) return pwErrors[0];
        return '';
      }
      case 'confirmacaoSenha':
        if (!value) return 'Confirmação de senha obrigatória.';
        return value === currentForm.novaSenha ? '' : 'As senhas não coincidem.';
      default:
        return '';
    }
  };

  const validateAll = (currentForm = form) => {
    const fields = ['senhaAtual', 'novaSenha', 'confirmacaoSenha'];
    const newErrors = {};
    fields.forEach((f) => {
      const err = validateField(f, currentForm[f], currentForm);
      if (err) newErrors[f] = err;
    });
    return newErrors;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value };
    setForm(newForm);
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, newForm) }));
    }
    // Re-validate confirmacaoSenha when novaSenha changes
    if (name === 'novaSenha' && touched.confirmacaoSenha) {
      setErrors((prev) => ({
        ...prev,
        confirmacaoSenha: validateField('confirmacaoSenha', newForm.confirmacaoSenha, newForm),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value, form) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = { senhaAtual: true, novaSenha: true, confirmacaoSenha: true };
    setTouched(allTouched);
    const validationErrors = validateAll();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit(form.senhaAtual, form.novaSenha, form.confirmacaoSenha);
  };

  // Reset form on success
  React.useEffect(() => {
    if (successMessage) {
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
    }
  }, [successMessage]);

  const fieldClass = (name) =>
    `form-control${touched[name] && errors[name] ? ' is-invalid' : touched[name] && !errors[name] ? ' is-valid' : ''}`;

  return (
    <form onSubmit={handleSubmit} noValidate data-testid="change-password-form">
      {/* Server error */}
      {serverError && (
        <div className="alert alert-danger" role="alert" data-testid="change-password-server-error">
          {serverError}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="alert alert-success" role="status" data-testid="change-password-success">
          {successMessage}
        </div>
      )}

      {/* Current password */}
      <div className="mb-3">
        <label htmlFor="cp-senhaAtual" className="form-label">
          Senha Atual <span className="text-danger">*</span>
        </label>
        <div className="input-group">
          <input
            id="cp-senhaAtual"
            type={showSenhaAtual ? 'text' : 'password'}
            className={fieldClass('senhaAtual')}
            name="senhaAtual"
            value={form.senhaAtual}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="current-password"
            data-testid="change-password-senhaAtual"
            disabled={submitting}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowSenhaAtual((v) => !v)}
            tabIndex="-1"
            data-testid="toggle-senhaAtual"
            aria-label={showSenhaAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'}
          >
            {showSenhaAtual ? '🙈' : '👁'}
          </button>
          {touched.senhaAtual && errors.senhaAtual && (
            <div className="invalid-feedback" data-testid="change-password-senhaAtual-error">
              {errors.senhaAtual}
            </div>
          )}
        </div>
      </div>

      {/* New password */}
      <div className="mb-3">
        <label htmlFor="cp-novaSenha" className="form-label">
          Nova Senha <span className="text-danger">*</span>
        </label>
        <div className="input-group">
          <input
            id="cp-novaSenha"
            type={showNovaSenha ? 'text' : 'password'}
            className={fieldClass('novaSenha')}
            name="novaSenha"
            value={form.novaSenha}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            data-testid="change-password-novaSenha"
            disabled={submitting}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowNovaSenha((v) => !v)}
            tabIndex="-1"
            data-testid="toggle-novaSenha"
            aria-label={showNovaSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'}
          >
            {showNovaSenha ? '🙈' : '👁'}
          </button>
          {touched.novaSenha && errors.novaSenha && (
            <div className="invalid-feedback" data-testid="change-password-novaSenha-error">
              {errors.novaSenha}
            </div>
          )}
        </div>
        <PasswordStrengthIndicator password={form.novaSenha} />
      </div>

      {/* Confirm new password */}
      <div className="mb-4">
        <label htmlFor="cp-confirmacaoSenha" className="form-label">
          Confirmar Nova Senha <span className="text-danger">*</span>
        </label>
        <div className="input-group">
          <input
            id="cp-confirmacaoSenha"
            type={showConfirmacao ? 'text' : 'password'}
            className={fieldClass('confirmacaoSenha')}
            name="confirmacaoSenha"
            value={form.confirmacaoSenha}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="new-password"
            data-testid="change-password-confirmacaoSenha"
            disabled={submitting}
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowConfirmacao((v) => !v)}
            tabIndex="-1"
            data-testid="toggle-confirmacaoSenha"
            aria-label={showConfirmacao ? 'Ocultar confirmação' : 'Mostrar confirmação'}
          >
            {showConfirmacao ? '🙈' : '👁'}
          </button>
          {touched.confirmacaoSenha && errors.confirmacaoSenha && (
            <div className="invalid-feedback" data-testid="change-password-confirmacaoSenha-error">
              {errors.confirmacaoSenha}
            </div>
          )}
          {touched.confirmacaoSenha && !errors.confirmacaoSenha && form.confirmacaoSenha && (
            <div className="valid-feedback" data-testid="change-password-confirmacaoSenha-valid">
              Senhas coincidem!
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="d-grid">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
          data-testid="change-password-submit"
        >
          {submitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              />
              Alterando...
            </>
          ) : (
            'Alterar Senha'
          )}
        </button>
      </div>
    </form>
  );
};

ChangePasswordForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  serverError: PropTypes.string,
  successMessage: PropTypes.string,
};

ChangePasswordForm.defaultProps = {
  submitting: false,
  serverError: '',
  successMessage: '',
};

export default ChangePasswordForm;
