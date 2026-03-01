import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { isValidCpf } from '../utils/validators';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import usePageTitle from '../hooks/usePageTitle';

/**
 * LoginPage
 * @component
 * @description Login page with CPF and password form.
 * @returns {JSX.Element}
 */
const LoginPage = () => {
  usePageTitle('Entrar');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || ROUTES.HOME;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidCpf(cpf)) {
      setError('CPF inválido. Verifique e tente novamente.');
      return;
    }

    if (!senha) {
      setError('Senha obrigatória.');
      return;
    }

    setLoading(true);
    try {
      await login(cpf.replace(/\D/g, ''), senha);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" data-testid="login-page">
      <div className="row justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Entrar</h2>

              {error && (
                <div className="alert alert-danger" data-testid="error-message" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} data-testid="login-form" noValidate>
                <div className="mb-3">
                  <label htmlFor="cpf" className="form-label">
                    CPF
                  </label>
                  <input
                    id="cpf"
                    type="text"
                    className="form-control"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    data-testid="cpf-input"
                    required
                    maxLength={14}
                    autoComplete="username"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="senha" className="form-label">
                    Senha
                  </label>
                  <input
                    id="senha"
                    type="password"
                    className="form-control"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    data-testid="password-input"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                  data-testid="login-submit"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>

              <hr />

              <p className="text-center mb-0">
                Não tem conta?{' '}
                <Link to={ROUTES.REGISTER} data-testid="register-link">
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
