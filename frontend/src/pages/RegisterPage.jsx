import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { isValidCpf, isValidEmail, validatePassword, isValidPhone } from '../utils/validators';
import { getErrorMessage } from '../utils/helpers';
import { GENDER_OPTIONS, ROUTES } from '../utils/constants';
import usePageTitle from '../hooks/usePageTitle';

/**
 * RegisterPage
 * @component
 * @description New customer registration page.
 * @returns {JSX.Element}
 */
const RegisterPage = () => {
  usePageTitle('Criar Conta');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    email: '',
    dataNascimento: '',
    genero: '',
    telefone: '',
    senha: '',
    confirmarSenha: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.nome.trim()) newErrors.nome = 'Nome obrigatório.';
    if (!isValidCpf(form.cpf)) newErrors.cpf = 'CPF inválido.';
    if (!isValidEmail(form.email)) newErrors.email = 'Email inválido.';
    if (!form.dataNascimento) newErrors.dataNascimento = 'Data de nascimento obrigatória.';
    if (!form.genero) newErrors.genero = 'Gênero obrigatório.';
    if (!isValidPhone(form.telefone)) newErrors.telefone = 'Telefone inválido.';

    const { valid, errors: pwErrors } = validatePassword(form.senha);
    if (!valid) newErrors.senha = pwErrors.join(', ');
    if (form.senha !== form.confirmarSenha) newErrors.confirmarSenha = 'Senhas não conferem.';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        nome: form.nome,
        cpf: form.cpf.replace(/\D/g, ''),
        email: form.email,
        dataNascimento: form.dataNascimento,
        genero: form.genero,
        telefone: form.telefone.replace(/\D/g, ''),
        senha: form.senha,
      });
      navigate(ROUTES.LOGIN, { state: { registered: true } });
    } catch (err) {
      setGlobalError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" data-testid="register-page">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h2 className="card-title text-center mb-4">Criar Conta</h2>

              {globalError && (
                <div className="alert alert-danger" data-testid="error-message" role="alert">
                  {globalError}
                </div>
              )}

              <form onSubmit={handleSubmit} data-testid="register-form" noValidate>
                {/* Nome */}
                <div className="mb-3">
                  <label htmlFor="nome" className="form-label">
                    Nome completo
                  </label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    className={`form-control${errors.nome ? ' is-invalid' : ''}`}
                    placeholder="Nome completo"
                    value={form.nome}
                    onChange={handleChange}
                    data-testid="name-input"
                    required
                  />
                  {errors.nome && <div className="invalid-feedback">{errors.nome}</div>}
                </div>

                {/* CPF */}
                <div className="mb-3">
                  <label htmlFor="cpf" className="form-label">
                    CPF
                  </label>
                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    className={`form-control${errors.cpf ? ' is-invalid' : ''}`}
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={handleChange}
                    data-testid="cpf-input"
                    required
                    maxLength={14}
                  />
                  {errors.cpf && <div className="invalid-feedback">{errors.cpf}</div>}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={handleChange}
                    data-testid="email-input"
                    required
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Data de nascimento */}
                <div className="mb-3">
                  <label htmlFor="dataNascimento" className="form-label">
                    Data de Nascimento
                  </label>
                  <input
                    id="dataNascimento"
                    name="dataNascimento"
                    type="date"
                    className={`form-control${errors.dataNascimento ? ' is-invalid' : ''}`}
                    value={form.dataNascimento}
                    onChange={handleChange}
                    data-testid="birth-date-input"
                    required
                  />
                  {errors.dataNascimento && (
                    <div className="invalid-feedback">{errors.dataNascimento}</div>
                  )}
                </div>

                {/* Gênero */}
                <div className="mb-3">
                  <label htmlFor="genero" className="form-label">
                    Gênero
                  </label>
                  <select
                    id="genero"
                    name="genero"
                    className={`form-select${errors.genero ? ' is-invalid' : ''}`}
                    value={form.genero}
                    onChange={handleChange}
                    data-testid="gender-select"
                    required
                  >
                    <option value="">Selecione</option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.genero && <div className="invalid-feedback">{errors.genero}</div>}
                </div>

                {/* Telefone */}
                <div className="mb-3">
                  <label htmlFor="telefone" className="form-label">
                    Telefone/Celular
                  </label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    className={`form-control${errors.telefone ? ' is-invalid' : ''}`}
                    placeholder="(11) 99999-9999"
                    value={form.telefone}
                    onChange={handleChange}
                    data-testid="phone-input"
                    required
                  />
                  {errors.telefone && <div className="invalid-feedback">{errors.telefone}</div>}
                </div>

                {/* Senha */}
                <div className="mb-3">
                  <label htmlFor="senha" className="form-label">
                    Senha
                  </label>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    className={`form-control${errors.senha ? ' is-invalid' : ''}`}
                    placeholder="Mínimo 8 chars, maiúscula, especial"
                    value={form.senha}
                    onChange={handleChange}
                    data-testid="password-input"
                    required
                  />
                  {errors.senha && <div className="invalid-feedback">{errors.senha}</div>}
                </div>

                {/* Confirmar senha */}
                <div className="mb-4">
                  <label htmlFor="confirmarSenha" className="form-label">
                    Confirmar Senha
                  </label>
                  <input
                    id="confirmarSenha"
                    name="confirmarSenha"
                    type="password"
                    className={`form-control${errors.confirmarSenha ? ' is-invalid' : ''}`}
                    placeholder="Confirme sua senha"
                    value={form.confirmarSenha}
                    onChange={handleChange}
                    data-testid="password-confirm-input"
                    required
                  />
                  {errors.confirmarSenha && (
                    <div className="invalid-feedback">{errors.confirmarSenha}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                  data-testid="register-submit"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </button>
              </form>

              <hr />

              <p className="text-center mb-0">
                Já tem conta?{' '}
                <Link to={ROUTES.LOGIN} data-testid="login-link">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
