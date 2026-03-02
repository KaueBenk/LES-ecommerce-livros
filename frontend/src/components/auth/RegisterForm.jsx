import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { isValidCpf, isValidEmail, validatePassword, isValidPhone, isValidCep } from '../../utils/validators';
import {
  ROUTES,
  GENDER_OPTIONS,
  PHONE_TYPES,
  ADDRESS_TYPES,
  RESIDENTIAL_TYPES,
  STREET_TYPES,
  BRAZIL_STATES,
} from '../../utils/constants';

// ── Default objects ──────────────────────────────────────────────────────────

const newPhone = () => ({ tipo: 'CELULAR', ddd: '', numero: '' });

const newAddress = () => ({
  apelido: '',
  tipoResidencia: 'CASA',
  tipoLogradouro: 'RUA',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cep: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  tipoEndereco: 'ENTREGA_E_FINANCEIRO',
});

// ── Password strength helpers ────────────────────────────────────────────────

/**
 * Returns an object describing how many criteria a password satisfies.
 * Score is 0-4.
 */
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

// ── PasswordStrengthIndicator ────────────────────────────────────────────────

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

PasswordStrengthIndicator.propTypes = {
  password: PropTypes.string.isRequired,
};

// ── RegisterForm ─────────────────────────────────────────────────────────────

/**
 * RegisterForm
 * @component
 * @description Full customer registration form with real-time validation,
 * password strength indicator, dynamic telefones and enderecos arrays.
 */
const RegisterForm = ({ onSubmit, loading, serverError }) => {
  // ── Personal fields ────────────────────────────────────────────────────────
  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [email, setEmail] = useState('');

  // ── Security ───────────────────────────────────────────────────────────────
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');

  // ── Dynamic arrays ─────────────────────────────────────────────────────────
  const [telefones, setTelefones] = useState([newPhone()]);
  const [enderecos, setEnderecos] = useState([newAddress()]);

  // ── Validation state ───────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // ── Field validation ───────────────────────────────────────────────────────
  const validateField = useCallback(
    (name, value) => {
      switch (name) {
        case 'nome':
          return value.trim() ? '' : 'Nome obrigatório.';
        case 'genero':
          return value ? '' : 'Gênero obrigatório.';
        case 'cpf':
          if (!value) return 'CPF obrigatório.';
          return isValidCpf(value) ? '' : 'CPF inválido.';
        case 'dataNascimento':
          return value ? '' : 'Data de nascimento obrigatória.';
        case 'email':
          if (!value) return 'Email obrigatório.';
          return isValidEmail(value) ? '' : 'Formato de email inválido.';
        case 'senha': {
          const { valid, errors: pwErrors } = validatePassword(value);
          return valid ? '' : pwErrors.join(', ');
        }
        case 'confirmacaoSenha':
          return value === senha ? '' : 'Senhas não conferem.';
        default:
          return '';
      }
    },
    [senha]
  );

  const markTouched = (name) => setTouched((prev) => ({ ...prev, [name]: true }));

  const handleBlur = (name, value) => {
    markTouched(name);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSimpleChange = (setter, name) => (e) => {
    const value = e.target.value;
    setter(value);
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  // ── Telefone handlers ──────────────────────────────────────────────────────
  const handleTelefoneChange = (index, field, value) => {
    setTelefones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    const key = `telefone_${index}_${field}`;
    if (touched[key]) {
      const error = !value ? `${field} obrigatório.` : '';
      setErrors((prev) => ({ ...prev, [key]: error }));
    }
  };

  const addTelefone = () => setTelefones((prev) => [...prev, newPhone()]);

  const removeTelefone = (index) => {
    if (telefones.length <= 1) return;
    setTelefones((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Endereco handlers ──────────────────────────────────────────────────────
  const handleEnderecoChange = (index, field, value) => {
    setEnderecos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    const key = `endereco_${index}_${field}`;
    if (touched[key]) {
      let error = '';
      if (['logradouro', 'numero', 'bairro', 'cidade', 'estado'].includes(field) && !value) {
        error = 'Campo obrigatório.';
      }
      if (field === 'cep' && value && !isValidCep(value)) {
        error = 'CEP inválido.';
      }
      setErrors((prev) => ({ ...prev, [key]: error }));
    }
  };

  const addEndereco = () => setEnderecos((prev) => [...prev, newAddress()]);

  const removeEndereco = (index) => {
    if (enderecos.length <= 1) return;
    setEnderecos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Full validation on submit ──────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    // Personal
    ['nome', 'genero', 'cpf', 'dataNascimento', 'email', 'senha', 'confirmacaoSenha'].forEach(
      (f) => {
        const value =
          f === 'nome'
            ? nome
            : f === 'genero'
            ? genero
            : f === 'cpf'
            ? cpf
            : f === 'dataNascimento'
            ? dataNascimento
            : f === 'email'
            ? email
            : f === 'senha'
            ? senha
            : confirmacaoSenha;
        const err = validateField(f, value);
        if (err) newErrors[f] = err;
      }
    );

    // Telefones
    telefones.forEach((tel, i) => {
      if (!tel.ddd || tel.ddd.length < 2) newErrors[`telefone_${i}_ddd`] = 'DDD inválido.';
      if (!isValidPhone(`${tel.ddd}${tel.numero}`))
        newErrors[`telefone_${i}_numero`] = 'Número inválido.';
    });

    // Endereços
    enderecos.forEach((end, i) => {
      if (!end.logradouro.trim()) newErrors[`endereco_${i}_logradouro`] = 'Campo obrigatório.';
      if (!end.numero.trim()) newErrors[`endereco_${i}_numero`] = 'Campo obrigatório.';
      if (!end.bairro.trim()) newErrors[`endereco_${i}_bairro`] = 'Campo obrigatório.';
      if (!end.cidade.trim()) newErrors[`endereco_${i}_cidade`] = 'Campo obrigatório.';
      if (!end.estado) newErrors[`endereco_${i}_estado`] = 'Campo obrigatório.';
      if (end.cep && !isValidCep(end.cep)) newErrors[`endereco_${i}_cep`] = 'CEP inválido.';
      if (!end.cep) newErrors[`endereco_${i}_cep`] = 'CEP obrigatório.';
    });

    return newErrors;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {
      nome: true, genero: true, cpf: true, dataNascimento: true,
      email: true, senha: true, confirmacaoSenha: true,
    };
    telefones.forEach((_, i) => {
      allTouched[`telefone_${i}_ddd`] = true;
      allTouched[`telefone_${i}_numero`] = true;
    });
    enderecos.forEach((_, i) => {
      ['logradouro', 'numero', 'bairro', 'cep', 'cidade', 'estado'].forEach((f) => {
        allTouched[`endereco_${i}_${f}`] = true;
      });
    });
    setTouched(allTouched);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSubmit({
      nome,
      genero,
      cpf: cpf.replace(/\D/g, ''),
      dataNascimento,
      email,
      senha,
      confirmacaoSenha,
      telefones: telefones.map((t) => ({
        tipo: t.tipo,
        ddd: t.ddd,
        numero: t.numero,
      })),
      enderecos: enderecos.map((end) => ({
        apelido: end.apelido,
        tipoResidencia: end.tipoResidencia,
        tipoLogradouro: end.tipoLogradouro,
        logradouro: end.logradouro,
        numero: end.numero,
        complemento: end.complemento,
        bairro: end.bairro,
        cep: end.cep,
        cidade: end.cidade,
        estado: end.estado,
        pais: end.pais,
        tipoEndereco: end.tipoEndereco,
      })),
    });
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const fieldClass = (key) =>
    `form-control${errors[key] && touched[key] ? ' is-invalid' : ''}`;

  const selectClass = (key) =>
    `form-select${errors[key] && touched[key] ? ' is-invalid' : ''}`;

  return (
    <form onSubmit={handleSubmit} data-testid="register-form" noValidate>
      {/* Server-side error */}
      {serverError && (
        <div className="alert alert-danger" data-testid="register-error-message" role="alert">
          {serverError}
        </div>
      )}

      {/* ── Section: Dados pessoais ── */}
      <h5 className="mb-3 text-muted fw-semibold">Dados Pessoais</h5>

      {/* Nome */}
      <div className="mb-3">
        <label htmlFor="reg-nome" className="form-label">
          Nome completo <span className="text-danger">*</span>
        </label>
        <input
          id="reg-nome"
          type="text"
          className={fieldClass('nome')}
          placeholder="Nome completo"
          value={nome}
          onChange={handleSimpleChange(setNome, 'nome')}
          onBlur={() => handleBlur('nome', nome)}
          data-testid="name-input"
          required
          disabled={loading}
        />
        {errors.nome && touched.nome && (
          <div className="invalid-feedback" data-testid="name-error">{errors.nome}</div>
        )}
      </div>

      {/* Gênero */}
      <div className="mb-3">
        <label htmlFor="reg-genero" className="form-label">
          Gênero <span className="text-danger">*</span>
        </label>
        <select
          id="reg-genero"
          className={selectClass('genero')}
          value={genero}
          onChange={handleSimpleChange(setGenero, 'genero')}
          onBlur={() => handleBlur('genero', genero)}
          data-testid="gender-select"
          required
          disabled={loading}
        >
          <option value="">Selecione</option>
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.genero && touched.genero && (
          <div className="invalid-feedback" data-testid="gender-error">{errors.genero}</div>
        )}
      </div>

      {/* CPF */}
      <div className="mb-3">
        <label htmlFor="reg-cpf" className="form-label">
          CPF <span className="text-danger">*</span>
        </label>
        <input
          id="reg-cpf"
          type="text"
          className={fieldClass('cpf')}
          placeholder="000.000.000-00"
          value={cpf}
          onChange={handleSimpleChange(setCpf, 'cpf')}
          onBlur={() => handleBlur('cpf', cpf)}
          data-testid="cpf-input"
          required
          maxLength={14}
          disabled={loading}
        />
        {errors.cpf && touched.cpf && (
          <div className="invalid-feedback" data-testid="cpf-error">{errors.cpf}</div>
        )}
      </div>

      {/* Data de Nascimento */}
      <div className="mb-3">
        <label htmlFor="reg-dataNascimento" className="form-label">
          Data de Nascimento <span className="text-danger">*</span>
        </label>
        <input
          id="reg-dataNascimento"
          type="date"
          className={fieldClass('dataNascimento')}
          value={dataNascimento}
          onChange={handleSimpleChange(setDataNascimento, 'dataNascimento')}
          onBlur={() => handleBlur('dataNascimento', dataNascimento)}
          data-testid="birth-date-input"
          required
          disabled={loading}
        />
        {errors.dataNascimento && touched.dataNascimento && (
          <div className="invalid-feedback" data-testid="birth-date-error">
            {errors.dataNascimento}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="mb-3">
        <label htmlFor="reg-email" className="form-label">
          Email <span className="text-danger">*</span>
        </label>
        <input
          id="reg-email"
          type="email"
          className={fieldClass('email')}
          placeholder="email@exemplo.com"
          value={email}
          onChange={handleSimpleChange(setEmail, 'email')}
          onBlur={() => handleBlur('email', email)}
          data-testid="email-input"
          required
          autoComplete="email"
          disabled={loading}
        />
        {errors.email && touched.email && (
          <div className="invalid-feedback" data-testid="email-error">{errors.email}</div>
        )}
      </div>

      {/* ── Section: Segurança ── */}
      <h5 className="mb-3 mt-4 text-muted fw-semibold">Segurança</h5>

      {/* Senha */}
      <div className="mb-3">
        <label htmlFor="reg-senha" className="form-label">
          Senha <span className="text-danger">*</span>
        </label>
        <input
          id="reg-senha"
          type="password"
          className={fieldClass('senha')}
          placeholder="Mínimo 8 chars, maiúscula, especial"
          value={senha}
          onChange={handleSimpleChange(setSenha, 'senha')}
          onBlur={() => handleBlur('senha', senha)}
          data-testid="password-input"
          required
          autoComplete="new-password"
          disabled={loading}
        />
        <PasswordStrengthIndicator password={senha} />
        {errors.senha && touched.senha && (
          <div className="invalid-feedback d-block" data-testid="password-error">
            {errors.senha}
          </div>
        )}
      </div>

      {/* Confirmação de Senha */}
      <div className="mb-4">
        <label htmlFor="reg-confirmacaoSenha" className="form-label">
          Confirmar Senha <span className="text-danger">*</span>
        </label>
        <input
          id="reg-confirmacaoSenha"
          type="password"
          className={fieldClass('confirmacaoSenha')}
          placeholder="Confirme sua senha"
          value={confirmacaoSenha}
          onChange={handleSimpleChange(setConfirmacaoSenha, 'confirmacaoSenha')}
          onBlur={() => handleBlur('confirmacaoSenha', confirmacaoSenha)}
          data-testid="password-confirm-input"
          required
          autoComplete="new-password"
          disabled={loading}
        />
        {errors.confirmacaoSenha && touched.confirmacaoSenha && (
          <div className="invalid-feedback" data-testid="password-confirm-error">
            {errors.confirmacaoSenha}
          </div>
        )}
      </div>

      {/* ── Section: Telefones ── */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0 text-muted fw-semibold">Telefones</h5>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={addTelefone}
          data-testid="add-phone-button"
          disabled={loading}
        >
          + Adicionar Telefone
        </button>
      </div>

      {telefones.map((tel, idx) => (
        <div key={idx} className="card mb-3 border-light bg-light" data-testid={`phone-item-${idx}`}>
          <div className="card-body p-3">
            {telefones.length > 1 && (
              <div className="d-flex justify-content-end mb-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeTelefone(idx)}
                  data-testid={`remove-phone-${idx}`}
                  disabled={loading}
                >
                  Remover
                </button>
              </div>
            )}
            <div className="row g-2">
              {/* Tipo */}
              <div className="col-md-4">
                <label htmlFor={`tel-tipo-${idx}`} className="form-label form-label-sm">
                  Tipo
                </label>
                <select
                  id={`tel-tipo-${idx}`}
                  className="form-select form-select-sm"
                  value={tel.tipo}
                  onChange={(e) => handleTelefoneChange(idx, 'tipo', e.target.value)}
                  data-testid={`phone-type-${idx}`}
                  disabled={loading}
                >
                  {PHONE_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DDD */}
              <div className="col-md-3">
                <label htmlFor={`tel-ddd-${idx}`} className="form-label form-label-sm">
                  DDD <span className="text-danger">*</span>
                </label>
                <input
                  id={`tel-ddd-${idx}`}
                  type="text"
                  className={`form-control form-control-sm${
                    errors[`telefone_${idx}_ddd`] && touched[`telefone_${idx}_ddd`] ? ' is-invalid' : ''
                  }`}
                  placeholder="11"
                  value={tel.ddd}
                  onChange={(e) => handleTelefoneChange(idx, 'ddd', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`telefone_${idx}_ddd`]: true }));
                    setErrors((prev) => ({
                      ...prev,
                      [`telefone_${idx}_ddd`]: tel.ddd.length < 2 ? 'DDD inválido.' : '',
                    }));
                  }}
                  data-testid={`phone-ddd-${idx}`}
                  maxLength={2}
                  disabled={loading}
                />
                {errors[`telefone_${idx}_ddd`] && touched[`telefone_${idx}_ddd`] && (
                  <div className="invalid-feedback" data-testid={`phone-ddd-error-${idx}`}>
                    {errors[`telefone_${idx}_ddd`]}
                  </div>
                )}
              </div>

              {/* Número */}
              <div className="col-md-5">
                <label htmlFor={`tel-num-${idx}`} className="form-label form-label-sm">
                  Número <span className="text-danger">*</span>
                </label>
                <input
                  id={`tel-num-${idx}`}
                  type="tel"
                  className={`form-control form-control-sm${
                    errors[`telefone_${idx}_numero`] && touched[`telefone_${idx}_numero`] ? ' is-invalid' : ''
                  }`}
                  placeholder="987654321"
                  value={tel.numero}
                  onChange={(e) => handleTelefoneChange(idx, 'numero', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`telefone_${idx}_numero`]: true }));
                    setErrors((prev) => ({
                      ...prev,
                      [`telefone_${idx}_numero`]: !isValidPhone(`${tel.ddd}${tel.numero}`)
                        ? 'Número inválido.'
                        : '',
                    }));
                  }}
                  data-testid={`phone-number-${idx}`}
                  disabled={loading}
                />
                {errors[`telefone_${idx}_numero`] && touched[`telefone_${idx}_numero`] && (
                  <div className="invalid-feedback" data-testid={`phone-number-error-${idx}`}>
                    {errors[`telefone_${idx}_numero`]}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Section: Endereços ── */}
      <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
        <h5 className="mb-0 text-muted fw-semibold">Endereços</h5>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={addEndereco}
          data-testid="add-address-button"
          disabled={loading}
        >
          + Adicionar Endereço
        </button>
      </div>

      {enderecos.map((end, idx) => (
        <div key={idx} className="card mb-3 border-light bg-light" data-testid={`address-item-${idx}`}>
          <div className="card-body p-3">
            {enderecos.length > 1 && (
              <div className="d-flex justify-content-end mb-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeEndereco(idx)}
                  data-testid={`remove-address-${idx}`}
                  disabled={loading}
                >
                  Remover
                </button>
              </div>
            )}

            <div className="row g-2">
              {/* Apelido */}
              <div className="col-md-6">
                <label htmlFor={`end-apelido-${idx}`} className="form-label form-label-sm">
                  Apelido
                </label>
                <input
                  id={`end-apelido-${idx}`}
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Ex: Casa, Trabalho"
                  value={end.apelido}
                  onChange={(e) => handleEnderecoChange(idx, 'apelido', e.target.value)}
                  data-testid={`address-apelido-${idx}`}
                  disabled={loading}
                />
              </div>

              {/* Tipo Endereço */}
              <div className="col-md-6">
                <label htmlFor={`end-tipo-${idx}`} className="form-label form-label-sm">
                  Tipo <span className="text-danger">*</span>
                </label>
                <select
                  id={`end-tipo-${idx}`}
                  className="form-select form-select-sm"
                  value={end.tipoEndereco}
                  onChange={(e) => handleEnderecoChange(idx, 'tipoEndereco', e.target.value)}
                  data-testid={`address-type-${idx}`}
                  disabled={loading}
                >
                  {ADDRESS_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Residência */}
              <div className="col-md-6">
                <label htmlFor={`end-tipoRes-${idx}`} className="form-label form-label-sm">
                  Tipo de Residência
                </label>
                <select
                  id={`end-tipoRes-${idx}`}
                  className="form-select form-select-sm"
                  value={end.tipoResidencia}
                  onChange={(e) => handleEnderecoChange(idx, 'tipoResidencia', e.target.value)}
                  data-testid={`address-residence-type-${idx}`}
                  disabled={loading}
                >
                  {RESIDENTIAL_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Logradouro */}
              <div className="col-md-6">
                <label htmlFor={`end-tipoLogr-${idx}`} className="form-label form-label-sm">
                  Tipo de Logradouro
                </label>
                <select
                  id={`end-tipoLogr-${idx}`}
                  className="form-select form-select-sm"
                  value={end.tipoLogradouro}
                  onChange={(e) => handleEnderecoChange(idx, 'tipoLogradouro', e.target.value)}
                  data-testid={`address-street-type-${idx}`}
                  disabled={loading}
                >
                  {STREET_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Logradouro */}
              <div className="col-md-8">
                <label htmlFor={`end-logr-${idx}`} className="form-label form-label-sm">
                  Logradouro <span className="text-danger">*</span>
                </label>
                <input
                  id={`end-logr-${idx}`}
                  type="text"
                  className={`form-control form-control-sm${
                    errors[`endereco_${idx}_logradouro`] && touched[`endereco_${idx}_logradouro`]
                      ? ' is-invalid'
                      : ''
                  }`}
                  placeholder="Nome da rua"
                  value={end.logradouro}
                  onChange={(e) => handleEnderecoChange(idx, 'logradouro', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`endereco_${idx}_logradouro`]: true }));
                  }}
                  data-testid={`address-street-${idx}`}
                  disabled={loading}
                />
                {errors[`endereco_${idx}_logradouro`] && touched[`endereco_${idx}_logradouro`] && (
                  <div className="invalid-feedback">
                    {errors[`endereco_${idx}_logradouro`]}
                  </div>
                )}
              </div>

              {/* Número */}
              <div className="col-md-4">
                <label htmlFor={`end-num-${idx}`} className="form-label form-label-sm">
                  Número <span className="text-danger">*</span>
                </label>
                <input
                  id={`end-num-${idx}`}
                  type="text"
                  className={`form-control form-control-sm${
                    errors[`endereco_${idx}_numero`] && touched[`endereco_${idx}_numero`]
                      ? ' is-invalid'
                      : ''
                  }`}
                  placeholder="123"
                  value={end.numero}
                  onChange={(e) => handleEnderecoChange(idx, 'numero', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`endereco_${idx}_numero`]: true }));
                  }}
                  data-testid={`address-number-${idx}`}
                  disabled={loading}
                />
                {errors[`endereco_${idx}_numero`] && touched[`endereco_${idx}_numero`] && (
                  <div className="invalid-feedback">{errors[`endereco_${idx}_numero`]}</div>
                )}
              </div>

              {/* Complemento */}
              <div className="col-md-6">
                <label htmlFor={`end-comp-${idx}`} className="form-label form-label-sm">
                  Complemento
                </label>
                <input
                  id={`end-comp-${idx}`}
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Apto, bloco, etc."
                  value={end.complemento}
                  onChange={(e) => handleEnderecoChange(idx, 'complemento', e.target.value)}
                  data-testid={`address-complement-${idx}`}
                  disabled={loading}
                />
              </div>

              {/* Bairro */}
              <div className="col-md-6">
                <label htmlFor={`end-bairro-${idx}`} className="form-label form-label-sm">
                  Bairro <span className="text-danger">*</span>
                </label>
                <input
                  id={`end-bairro-${idx}`}
                  type="text"
                  className={`form-control form-control-sm${
                    errors[`endereco_${idx}_bairro`] && touched[`endereco_${idx}_bairro`]
                      ? ' is-invalid'
                      : ''
                  }`}
                  placeholder="Bairro"
                  value={end.bairro}
                  onChange={(e) => handleEnderecoChange(idx, 'bairro', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`endereco_${idx}_bairro`]: true }));
                  }}
                  data-testid={`address-neighborhood-${idx}`}
                  disabled={loading}
                />
                {errors[`endereco_${idx}_bairro`] && touched[`endereco_${idx}_bairro`] && (
                  <div className="invalid-feedback">{errors[`endereco_${idx}_bairro`]}</div>
                )}
              </div>

              {/* CEP */}
              <div className="col-md-4">
                <label htmlFor={`end-cep-${idx}`} className="form-label form-label-sm">
                  CEP <span className="text-danger">*</span>
                </label>
                <input
                  id={`end-cep-${idx}`}
                  type="text"
                  className={`form-control form-control-sm${
                    errors[`endereco_${idx}_cep`] && touched[`endereco_${idx}_cep`]
                      ? ' is-invalid'
                      : ''
                  }`}
                  placeholder="00000-000"
                  value={end.cep}
                  onChange={(e) => handleEnderecoChange(idx, 'cep', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`endereco_${idx}_cep`]: true }));
                  }}
                  data-testid={`address-cep-${idx}`}
                  maxLength={9}
                  disabled={loading}
                />
                {errors[`endereco_${idx}_cep`] && touched[`endereco_${idx}_cep`] && (
                  <div className="invalid-feedback">{errors[`endereco_${idx}_cep`]}</div>
                )}
              </div>

              {/* Cidade */}
              <div className="col-md-5">
                <label htmlFor={`end-cidade-${idx}`} className="form-label form-label-sm">
                  Cidade <span className="text-danger">*</span>
                </label>
                <input
                  id={`end-cidade-${idx}`}
                  type="text"
                  className={`form-control form-control-sm${
                    errors[`endereco_${idx}_cidade`] && touched[`endereco_${idx}_cidade`]
                      ? ' is-invalid'
                      : ''
                  }`}
                  placeholder="Cidade"
                  value={end.cidade}
                  onChange={(e) => handleEnderecoChange(idx, 'cidade', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`endereco_${idx}_cidade`]: true }));
                  }}
                  data-testid={`address-city-${idx}`}
                  disabled={loading}
                />
                {errors[`endereco_${idx}_cidade`] && touched[`endereco_${idx}_cidade`] && (
                  <div className="invalid-feedback">{errors[`endereco_${idx}_cidade`]}</div>
                )}
              </div>

              {/* Estado */}
              <div className="col-md-3">
                <label htmlFor={`end-estado-${idx}`} className="form-label form-label-sm">
                  Estado <span className="text-danger">*</span>
                </label>
                <select
                  id={`end-estado-${idx}`}
                  className={`form-select form-select-sm${
                    errors[`endereco_${idx}_estado`] && touched[`endereco_${idx}_estado`]
                      ? ' is-invalid'
                      : ''
                  }`}
                  value={end.estado}
                  onChange={(e) => handleEnderecoChange(idx, 'estado', e.target.value)}
                  onBlur={() => {
                    setTouched((prev) => ({ ...prev, [`endereco_${idx}_estado`]: true }));
                  }}
                  data-testid={`address-state-${idx}`}
                  disabled={loading}
                >
                  <option value="">UF</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                {errors[`endereco_${idx}_estado`] && touched[`endereco_${idx}_estado`] && (
                  <div className="invalid-feedback">{errors[`endereco_${idx}_estado`]}</div>
                )}
              </div>

              {/* País */}
              <div className="col-md-12">
                <label htmlFor={`end-pais-${idx}`} className="form-label form-label-sm">
                  País
                </label>
                <input
                  id={`end-pais-${idx}`}
                  type="text"
                  className="form-control form-control-sm"
                  value={end.pais}
                  onChange={(e) => handleEnderecoChange(idx, 'pais', e.target.value)}
                  data-testid={`address-country-${idx}`}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ── Submit ── */}
      <button
        type="submit"
        className="btn btn-primary w-100 mt-2"
        disabled={loading}
        data-testid="register-submit"
      >
        {loading ? (
          <>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            Criando conta...
          </>
        ) : (
          'Criar Conta'
        )}
      </button>

      <hr />

      <p className="text-center mb-0">
        Já tem conta?{' '}
        <Link to={ROUTES.LOGIN} data-testid="login-link">
          Entrar
        </Link>
      </p>
    </form>
  );
};

RegisterForm.propTypes = {
  /** Called with the full validated form payload when the form is submitted */
  onSubmit: PropTypes.func.isRequired,
  /** Whether a network request is in progress */
  loading: PropTypes.bool,
  /** Error message from the server to display at the top */
  serverError: PropTypes.string,
};

RegisterForm.defaultProps = {
  loading: false,
  serverError: '',
};

export default RegisterForm;
