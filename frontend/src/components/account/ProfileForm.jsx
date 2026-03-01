import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isValidPhone } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';
import { GENDER_OPTIONS, PHONE_TYPES, RANKING_LEVELS } from '../../utils/constants';

// ── Ranking badge helper ─────────────────────────────────────────────────────

const RANKING_BADGE_COLORS = {
  [RANKING_LEVELS.BRONZE]: 'bg-secondary',
  [RANKING_LEVELS.PRATA]: 'bg-secondary',
  [RANKING_LEVELS.OURO]: 'bg-warning text-dark',
  [RANKING_LEVELS.PLATINA]: 'bg-info text-dark',
};

const getRankingBadgeClass = (ranking) => RANKING_BADGE_COLORS[ranking] || 'bg-secondary';

// ── Phone field (controlled sub-form) ────────────────────────────────────────

const PhoneRow = ({ phone, index, onChange, onRemove, canRemove, disabled, errors, touched }) => {
  const dddKey = `telefone_${index}_ddd`;
  const numKey = `telefone_${index}_numero`;

  return (
    <div className="row g-2 mb-2 align-items-start" data-testid={`phone-row-${index}`}>
      {/* Tipo */}
      <div className="col-md-3">
        <select
          className="form-select form-select-sm"
          value={phone.tipo}
          onChange={(e) => onChange(index, 'tipo', e.target.value)}
          data-testid={`phone-type-${index}`}
          disabled={disabled}
          aria-label="Tipo de telefone"
        >
          {PHONE_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* DDD */}
      <div className="col-md-2">
        <input
          type="text"
          className={`form-control form-control-sm${
            errors[dddKey] && touched[dddKey] ? ' is-invalid' : ''
          }`}
          placeholder="DDD"
          value={phone.ddd}
          onChange={(e) => onChange(index, 'ddd', e.target.value)}
          data-testid={`phone-ddd-${index}`}
          maxLength={2}
          disabled={disabled}
          aria-label="DDD"
        />
        {errors[dddKey] && touched[dddKey] && (
          <div className="invalid-feedback">{errors[dddKey]}</div>
        )}
      </div>

      {/* Número */}
      <div className="col-md-5">
        <input
          type="tel"
          className={`form-control form-control-sm${
            errors[numKey] && touched[numKey] ? ' is-invalid' : ''
          }`}
          placeholder="Número"
          value={phone.numero}
          onChange={(e) => onChange(index, 'numero', e.target.value)}
          data-testid={`phone-number-${index}`}
          disabled={disabled}
          aria-label="Número de telefone"
        />
        {errors[numKey] && touched[numKey] && (
          <div className="invalid-feedback">{errors[numKey]}</div>
        )}
      </div>

      {/* Remove */}
      <div className="col-md-2">
        {canRemove && !disabled && (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm w-100"
            onClick={() => onRemove(index)}
            data-testid={`remove-phone-${index}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

PhoneRow.propTypes = {
  phone: PropTypes.shape({
    tipo: PropTypes.string,
    ddd: PropTypes.string,
    numero: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  canRemove: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  errors: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired,
};

// ── ProfileForm ──────────────────────────────────────────────────────────────

/**
 * ProfileForm
 * @component
 * @description Displays and allows editing of the authenticated customer's
 * personal data. Starts in read-only mode; an "Editar" button switches to
 * edit mode. Cancel restores original data; Save calls onSave with the diff.
 */
const ProfileForm = ({ profile, loading, saving, onSave, serverError, serverSuccess }) => {
  // ── Local controlled state (mirrors profile prop) ────────────────────────
  const [editMode, setEditMode] = useState(false);

  const [nome, setNome] = useState('');
  const [genero, setGenero] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefones, setTelefones] = useState([]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Initialise / sync from prop
  useEffect(() => {
    if (profile) {
      setNome(profile.nome || '');
      setGenero(profile.genero || '');
      setDataNascimento(profile.dataNascimento || '');
      setTelefones(
        profile.telefones?.length
          ? profile.telefones.map((t) => ({ ...t }))
          : [{ tipo: 'CELULAR', ddd: '', numero: '' }]
      );
    }
  }, [profile]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetToOriginal = () => {
    if (!profile) return;
    setNome(profile.nome || '');
    setGenero(profile.genero || '');
    setDataNascimento(profile.dataNascimento || '');
    setTelefones(
      profile.telefones?.length
        ? profile.telefones.map((t) => ({ ...t }))
        : [{ tipo: 'CELULAR', ddd: '', numero: '' }]
    );
    setErrors({});
    setTouched({});
  };

  const handleCancel = () => {
    resetToOriginal();
    setEditMode(false);
  };

  // ── Phone handlers ─────────────────────────────────────────────────────────
  const handlePhoneChange = (index, field, value) => {
    setTelefones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    const key = `telefone_${index}_${field}`;
    if (touched[key]) {
      setErrors((prev) => ({
        ...prev,
        [key]: field === 'ddd' && value.length < 2 ? 'DDD inválido.' : '',
      }));
    }
  };

  const addPhone = () => setTelefones((prev) => [...prev, { tipo: 'CELULAR', ddd: '', numero: '' }]);

  const removePhone = (index) => {
    setTelefones((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!nome.trim()) newErrors.nome = 'Nome obrigatório.';
    if (!genero) newErrors.genero = 'Gênero obrigatório.';
    if (!dataNascimento) newErrors.dataNascimento = 'Data de nascimento obrigatória.';

    telefones.forEach((tel, i) => {
      if (!tel.ddd || tel.ddd.length < 2) newErrors[`telefone_${i}_ddd`] = 'DDD inválido.';
      if (!isValidPhone(`${tel.ddd}${tel.numero}`))
        newErrors[`telefone_${i}_numero`] = 'Número inválido.';
    });

    return newErrors;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();

    const allTouched = { nome: true, genero: true, dataNascimento: true };
    telefones.forEach((_, i) => {
      allTouched[`telefone_${i}_ddd`] = true;
      allTouched[`telefone_${i}_numero`] = true;
    });
    setTouched(allTouched);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSave({ nome, genero, dataNascimento, telefones });
  };

  // ── Field class helpers ────────────────────────────────────────────────────
  const fieldClass = (key) =>
    `form-control${errors[key] && touched[key] ? ' is-invalid' : ''}`;

  const selectClass = (key) =>
    `form-select${errors[key] && touched[key] ? ' is-invalid' : ''}`;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div data-testid="profile-loading" className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} data-testid="profile-form" noValidate>
      {/* Alerts */}
      {serverError && (
        <div className="alert alert-danger" data-testid="profile-error-message" role="alert">
          {serverError}
        </div>
      )}
      {serverSuccess && (
        <div className="alert alert-success" data-testid="profile-success-message" role="status">
          {serverSuccess}
        </div>
      )}

      {/* ── Ranking (always read-only) ─────────────────────────────────── */}
      {profile?.ranking !== undefined && (
        <div className="mb-4 p-3 bg-light rounded border" data-testid="ranking-section">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <div className="small text-muted mb-1">Nível de Cliente</div>
              <span
                className={`badge fs-6 ${getRankingBadgeClass(profile.rankingNivel)}`}
                data-testid="ranking-nivel"
              >
                {profile.rankingNivel || 'BRONZE'}
              </span>
            </div>
            <div className="text-end">
              <div className="small text-muted mb-1">Total em compras</div>
              <span className="fw-semibold fs-5" data-testid="ranking-value">
                {formatCurrency(profile.ranking)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit / Cancel / Save actions ──────────────────────────────── */}
      <div className="d-flex justify-content-end gap-2 mb-4">
        {!editMode ? (
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setEditMode(true)}
            data-testid="profile-edit-button"
          >
            Editar
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleCancel}
              data-testid="profile-cancel-button"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              data-testid="profile-save-button"
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
              ) : (
                'Salvar'
              )}
            </button>
          </>
        )}
      </div>

      {/* ── Nome ──────────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="profile-nome" className="form-label">
          Nome completo
        </label>
        {editMode ? (
          <>
            <input
              id="profile-nome"
              type="text"
              className={fieldClass('nome')}
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (touched.nome)
                  setErrors((prev) => ({
                    ...prev,
                    nome: !e.target.value.trim() ? 'Nome obrigatório.' : '',
                  }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, nome: true }));
                setErrors((prev) => ({
                  ...prev,
                  nome: !nome.trim() ? 'Nome obrigatório.' : '',
                }));
              }}
              data-testid="profile-nome-input"
              required
            />
            {errors.nome && touched.nome && (
              <div className="invalid-feedback" data-testid="profile-nome-error">
                {errors.nome}
              </div>
            )}
          </>
        ) : (
          <p className="form-control-plaintext" data-testid="profile-nome-display">
            {profile?.nome || '—'}
          </p>
        )}
      </div>

      {/* ── Gênero ────────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="profile-genero" className="form-label">
          Gênero
        </label>
        {editMode ? (
          <>
            <select
              id="profile-genero"
              className={selectClass('genero')}
              value={genero}
              onChange={(e) => {
                setGenero(e.target.value);
                if (touched.genero)
                  setErrors((prev) => ({
                    ...prev,
                    genero: !e.target.value ? 'Gênero obrigatório.' : '',
                  }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, genero: true }));
                setErrors((prev) => ({
                  ...prev,
                  genero: !genero ? 'Gênero obrigatório.' : '',
                }));
              }}
              data-testid="profile-genero-select"
              required
            >
              <option value="">Selecione</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.genero && touched.genero && (
              <div className="invalid-feedback" data-testid="profile-genero-error">
                {errors.genero}
              </div>
            )}
          </>
        ) : (
          <p className="form-control-plaintext" data-testid="profile-genero-display">
            {GENDER_OPTIONS.find((o) => o.value === profile?.genero)?.label || profile?.genero || '—'}
          </p>
        )}
      </div>

      {/* ── Data de Nascimento ─────────────────────────────────────────────── */}
      <div className="mb-3">
        <label htmlFor="profile-dataNascimento" className="form-label">
          Data de Nascimento
        </label>
        {editMode ? (
          <>
            <input
              id="profile-dataNascimento"
              type="date"
              className={fieldClass('dataNascimento')}
              value={dataNascimento}
              onChange={(e) => {
                setDataNascimento(e.target.value);
                if (touched.dataNascimento)
                  setErrors((prev) => ({
                    ...prev,
                    dataNascimento: !e.target.value ? 'Data obrigatória.' : '',
                  }));
              }}
              onBlur={() => {
                setTouched((prev) => ({ ...prev, dataNascimento: true }));
                setErrors((prev) => ({
                  ...prev,
                  dataNascimento: !dataNascimento ? 'Data obrigatória.' : '',
                }));
              }}
              data-testid="profile-dataNascimento-input"
              required
            />
            {errors.dataNascimento && touched.dataNascimento && (
              <div className="invalid-feedback" data-testid="profile-dataNascimento-error">
                {errors.dataNascimento}
              </div>
            )}
          </>
        ) : (
          <p className="form-control-plaintext" data-testid="profile-dataNascimento-display">
            {profile?.dataNascimento
              ? new Intl.DateTimeFormat('pt-BR').format(
                  new Date(profile.dataNascimento + 'T00:00:00')
                )
              : '—'}
          </p>
        )}
      </div>

      {/* ── Read-only fields ──────────────────────────────────────────────── */}
      <div className="mb-3">
        <label className="form-label">Email</label>
        <p className="form-control-plaintext text-muted" data-testid="profile-email-display">
          {profile?.email || '—'}
        </p>
      </div>

      <div className="mb-4">
        <label className="form-label">CPF</label>
        <p className="form-control-plaintext text-muted" data-testid="profile-cpf-display">
          {profile?.cpf
            ? profile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
            : '—'}
        </p>
      </div>

      {/* ── Telefones ─────────────────────────────────────────────────────── */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <label className="form-label mb-0">Telefones</label>
          {editMode && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={addPhone}
              data-testid="add-phone-button"
            >
              + Adicionar
            </button>
          )}
        </div>

        {editMode ? (
          telefones.map((tel, idx) => (
            <PhoneRow
              key={idx}
              phone={tel}
              index={idx}
              onChange={handlePhoneChange}
              onRemove={removePhone}
              canRemove={telefones.length > 1}
              disabled={saving}
              errors={errors}
              touched={touched}
            />
          ))
        ) : (
          <ul className="list-unstyled mb-0" data-testid="profile-telefones-display">
            {profile?.telefones?.length ? (
              profile.telefones.map((tel, idx) => (
                <li key={idx} className="form-control-plaintext py-0">
                  <span className="badge bg-secondary me-1 text-capitalize">
                    {tel.tipo?.toLowerCase()}
                  </span>
                  ({tel.ddd}) {tel.numero}
                </li>
              ))
            ) : (
              <li className="text-muted">—</li>
            )}
          </ul>
        )}
      </div>
    </form>
  );
};

ProfileForm.propTypes = {
  /** Full profile object fetched from the API */
  profile: PropTypes.shape({
    id: PropTypes.number,
    nome: PropTypes.string,
    email: PropTypes.string,
    cpf: PropTypes.string,
    genero: PropTypes.string,
    dataNascimento: PropTypes.string,
    ranking: PropTypes.number,
    rankingNivel: PropTypes.string,
    telefones: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        tipo: PropTypes.string,
        ddd: PropTypes.string,
        numero: PropTypes.string,
      })
    ),
  }),
  /** Whether the profile is still being fetched */
  loading: PropTypes.bool,
  /** Whether a save request is in progress */
  saving: PropTypes.bool,
  /** Called with updated profile payload when save is confirmed */
  onSave: PropTypes.func.isRequired,
  /** Server-side error message */
  serverError: PropTypes.string,
  /** Server-side success message */
  serverSuccess: PropTypes.string,
};

ProfileForm.defaultProps = {
  profile: null,
  loading: false,
  saving: false,
  serverError: '',
  serverSuccess: '',
};

export default ProfileForm;
