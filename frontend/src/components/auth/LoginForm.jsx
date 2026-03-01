import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { isValidEmail } from '../../utils/validators';
import { ROUTES } from '../../utils/constants';

/**
 * LoginForm
 * @component
 * @description Controlled login form with email/password fields, real-time
 * validation, and inline error messages.
 */
const LoginForm = ({ onSubmit, loading, serverError }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [touched, setTouched] = useState({ email: false, senha: false });
  const [errors, setErrors] = useState({});

  // ── Real-time field validation ──────────────────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value) return 'Email obrigatório.';
        if (!isValidEmail(value)) return 'Formato de email inválido.';
        return '';
      case 'senha':
        if (!value) return 'Senha obrigatória.';
        return '';
      default:
        return '';
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateField('email', value) }));
    }
  };

  const handleSenhaChange = (e) => {
    const value = e.target.value;
    setSenha(value);
    if (touched.senha) {
      setErrors((prev) => ({ ...prev, senha: validateField('senha', value) }));
    }
  };

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // ── Form submit ─────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const emailError = validateField('email', email);
    const senhaError = validateField('senha', senha);
    const newErrors = { email: emailError, senha: senhaError };

    setTouched({ email: true, senha: true });
    setErrors(newErrors);

    if (emailError || senhaError) return;

    onSubmit({ email, senha });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form" noValidate>
      {/* Server-side error */}
      {serverError && (
        <div className="alert alert-danger" data-testid="login-error-message" role="alert">
          {serverError}
        </div>
      )}

      {/* Email */}
      <div className="mb-3">
        <label htmlFor="login-email" className="form-label">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          className={`form-control${errors.email && touched.email ? ' is-invalid' : ''}`}
          placeholder="email@exemplo.com"
          value={email}
          onChange={handleEmailChange}
          onBlur={() => handleBlur('email', email)}
          data-testid="email-input"
          required
          autoComplete="email"
          disabled={loading}
        />
        {errors.email && touched.email && (
          <div className="invalid-feedback" data-testid="email-error">
            {errors.email}
          </div>
        )}
      </div>

      {/* Password */}
      <div className="mb-4">
        <label htmlFor="login-senha" className="form-label">
          Senha
        </label>
        <input
          id="login-senha"
          type="password"
          className={`form-control${errors.senha && touched.senha ? ' is-invalid' : ''}`}
          placeholder="Senha"
          value={senha}
          onChange={handleSenhaChange}
          onBlur={() => handleBlur('senha', senha)}
          data-testid="password-input"
          required
          autoComplete="current-password"
          disabled={loading}
        />
        {errors.senha && touched.senha && (
          <div className="invalid-feedback" data-testid="password-error">
            {errors.senha}
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={loading}
        data-testid="login-submit"
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </button>

      <hr />

      <p className="text-center mb-0">
        Não tem conta?{' '}
        <Link to={ROUTES.REGISTER} data-testid="register-link">
          Criar conta
        </Link>
      </p>
    </form>
  );
};

LoginForm.propTypes = {
  /** Called with { email, senha } when form is valid and submitted */
  onSubmit: PropTypes.func.isRequired,
  /** Whether a network request is in progress */
  loading: PropTypes.bool,
  /** Error message from the server to display at the top */
  serverError: PropTypes.string,
};

LoginForm.defaultProps = {
  loading: false,
  serverError: '',
};

export default LoginForm;
