import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { isValidCep } from '../../utils/validators';
import {
  ADDRESS_TYPES,
  RESIDENTIAL_TYPES,
  STREET_TYPES,
  BRAZIL_STATES,
} from '../../utils/constants';

const EMPTY_ADDRESS = {
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
};

/**
 * AddressForm
 * @component
 * @description Modal form for creating or editing a customer address.
 * Pre-fills when `address` prop is provided (edit mode).
 */
const AddressForm = ({ address, onSave, onClose, saving, serverError }) => {
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Pre-fill on edit
  useEffect(() => {
    if (address) {
      setForm({
        apelido: address.apelido || '',
        tipoResidencia: address.tipoResidencia || 'CASA',
        tipoLogradouro: address.tipoLogradouro || 'RUA',
        logradouro: address.logradouro || '',
        numero: address.numero || '',
        complemento: address.complemento || '',
        bairro: address.bairro || '',
        cep: address.cep || '',
        cidade: address.cidade || '',
        estado: address.estado || '',
        pais: address.pais || 'Brasil',
        tipoEndereco: address.tipoEndereco || 'ENTREGA_E_FINANCEIRO',
      });
    } else {
      setForm(EMPTY_ADDRESS);
    }
    setErrors({});
    setTouched({});
  }, [address]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateField = (name, value) => {
    switch (name) {
      case 'logradouro':
        return value.trim() ? '' : 'Logradouro obrigatório.';
      case 'numero':
        return value.trim() ? '' : 'Número obrigatório.';
      case 'bairro':
        return value.trim() ? '' : 'Bairro obrigatório.';
      case 'cep':
        if (!value) return 'CEP obrigatório.';
        return isValidCep(value) ? '' : 'CEP inválido (00000-000).';
      case 'cidade':
        return value.trim() ? '' : 'Cidade obrigatória.';
      case 'estado':
        return value ? '' : 'Estado obrigatório.';
      default:
        return '';
    }
  };

  const validateAll = () => {
    const required = ['logradouro', 'numero', 'bairro', 'cep', 'cidade', 'estado'];
    const newErrors = {};
    required.forEach((f) => {
      const err = validateField(f, form[f]);
      if (err) newErrors[f] = err;
    });
    return newErrors;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const required = ['logradouro', 'numero', 'bairro', 'cep', 'cidade', 'estado'];
    const allTouched = {};
    required.forEach((f) => (allTouched[f] = true));
    setTouched(allTouched);

    const validationErrors = validateAll();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSave({ ...form });
  };

  // ── Field helpers ──────────────────────────────────────────────────────────
  const fc = (name) =>
    `form-control${errors[name] && touched[name] ? ' is-invalid' : ''}`;
  const sc = (name) =>
    `form-select${errors[name] && touched[name] ? ' is-invalid' : ''}`;

  return (
    /* Bootstrap modal */
    <div
      className="modal d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      data-testid="address-form-modal"
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable" role="document">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title" data-testid="address-form-title">
              {address ? 'Editar Endereço' : 'Novo Endereço'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Fechar"
              data-testid="address-form-close"
              disabled={saving}
            />
          </div>

          {/* Body */}
          <div className="modal-body">
            {serverError && (
              <div className="alert alert-danger" role="alert" data-testid="address-form-error">
                {serverError}
              </div>
            )}

            <form id="address-form" onSubmit={handleSubmit} noValidate data-testid="address-form">
              <div className="row g-3">
                {/* Apelido */}
                <div className="col-md-6">
                  <label htmlFor="af-apelido" className="form-label">
                    Apelido
                  </label>
                  <input
                    id="af-apelido"
                    name="apelido"
                    type="text"
                    className="form-control"
                    placeholder="Ex: Casa, Trabalho"
                    value={form.apelido}
                    onChange={handleChange}
                    data-testid="address-apelido-input"
                    disabled={saving}
                  />
                </div>

                {/* Tipo Endereço */}
                <div className="col-md-6">
                  <label htmlFor="af-tipoEndereco" className="form-label">
                    Tipo de Endereço <span className="text-danger">*</span>
                  </label>
                  <select
                    id="af-tipoEndereco"
                    name="tipoEndereco"
                    className="form-select"
                    value={form.tipoEndereco}
                    onChange={handleChange}
                    data-testid="address-tipo-select"
                    disabled={saving}
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
                  <label htmlFor="af-tipoResidencia" className="form-label">
                    Tipo de Residência
                  </label>
                  <select
                    id="af-tipoResidencia"
                    name="tipoResidencia"
                    className="form-select"
                    value={form.tipoResidencia}
                    onChange={handleChange}
                    data-testid="address-residencia-select"
                    disabled={saving}
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
                  <label htmlFor="af-tipoLogradouro" className="form-label">
                    Tipo de Logradouro
                  </label>
                  <select
                    id="af-tipoLogradouro"
                    name="tipoLogradouro"
                    className="form-select"
                    value={form.tipoLogradouro}
                    onChange={handleChange}
                    data-testid="address-logradouro-tipo-select"
                    disabled={saving}
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
                  <label htmlFor="af-logradouro" className="form-label">
                    Logradouro <span className="text-danger">*</span>
                  </label>
                  <input
                    id="af-logradouro"
                    name="logradouro"
                    type="text"
                    className={fc('logradouro')}
                    placeholder="Nome da rua / avenida"
                    value={form.logradouro}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    data-testid="address-logradouro-input"
                    required
                    disabled={saving}
                  />
                  {errors.logradouro && touched.logradouro && (
                    <div className="invalid-feedback" data-testid="address-logradouro-error">
                      {errors.logradouro}
                    </div>
                  )}
                </div>

                {/* Número */}
                <div className="col-md-4">
                  <label htmlFor="af-numero" className="form-label">
                    Número <span className="text-danger">*</span>
                  </label>
                  <input
                    id="af-numero"
                    name="numero"
                    type="text"
                    className={fc('numero')}
                    placeholder="123"
                    value={form.numero}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    data-testid="address-numero-input"
                    required
                    disabled={saving}
                  />
                  {errors.numero && touched.numero && (
                    <div className="invalid-feedback" data-testid="address-numero-error">
                      {errors.numero}
                    </div>
                  )}
                </div>

                {/* Complemento */}
                <div className="col-md-6">
                  <label htmlFor="af-complemento" className="form-label">
                    Complemento
                  </label>
                  <input
                    id="af-complemento"
                    name="complemento"
                    type="text"
                    className="form-control"
                    placeholder="Apto, bloco, sala…"
                    value={form.complemento}
                    onChange={handleChange}
                    data-testid="address-complemento-input"
                    disabled={saving}
                  />
                </div>

                {/* Bairro */}
                <div className="col-md-6">
                  <label htmlFor="af-bairro" className="form-label">
                    Bairro <span className="text-danger">*</span>
                  </label>
                  <input
                    id="af-bairro"
                    name="bairro"
                    type="text"
                    className={fc('bairro')}
                    placeholder="Bairro"
                    value={form.bairro}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    data-testid="address-bairro-input"
                    required
                    disabled={saving}
                  />
                  {errors.bairro && touched.bairro && (
                    <div className="invalid-feedback" data-testid="address-bairro-error">
                      {errors.bairro}
                    </div>
                  )}
                </div>

                {/* CEP */}
                <div className="col-md-4">
                  <label htmlFor="af-cep" className="form-label">
                    CEP <span className="text-danger">*</span>
                  </label>
                  <input
                    id="af-cep"
                    name="cep"
                    type="text"
                    className={fc('cep')}
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    data-testid="address-cep-input"
                    required
                    maxLength={9}
                    disabled={saving}
                  />
                  {errors.cep && touched.cep && (
                    <div className="invalid-feedback" data-testid="address-cep-error">
                      {errors.cep}
                    </div>
                  )}
                </div>

                {/* Cidade */}
                <div className="col-md-5">
                  <label htmlFor="af-cidade" className="form-label">
                    Cidade <span className="text-danger">*</span>
                  </label>
                  <input
                    id="af-cidade"
                    name="cidade"
                    type="text"
                    className={fc('cidade')}
                    placeholder="Cidade"
                    value={form.cidade}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    data-testid="address-cidade-input"
                    required
                    disabled={saving}
                  />
                  {errors.cidade && touched.cidade && (
                    <div className="invalid-feedback" data-testid="address-cidade-error">
                      {errors.cidade}
                    </div>
                  )}
                </div>

                {/* Estado */}
                <div className="col-md-3">
                  <label htmlFor="af-estado" className="form-label">
                    Estado <span className="text-danger">*</span>
                  </label>
                  <select
                    id="af-estado"
                    name="estado"
                    className={sc('estado')}
                    value={form.estado}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    data-testid="address-estado-select"
                    required
                    disabled={saving}
                  >
                    <option value="">UF</option>
                    {BRAZIL_STATES.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                  {errors.estado && touched.estado && (
                    <div className="invalid-feedback" data-testid="address-estado-error">
                      {errors.estado}
                    </div>
                  )}
                </div>

                {/* País */}
                <div className="col-md-12">
                  <label htmlFor="af-pais" className="form-label">
                    País
                  </label>
                  <input
                    id="af-pais"
                    name="pais"
                    type="text"
                    className="form-control"
                    value={form.pais}
                    onChange={handleChange}
                    data-testid="address-pais-input"
                    disabled={saving}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={saving}
              data-testid="address-form-cancel-button"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="address-form"
              className="btn btn-primary"
              disabled={saving}
              data-testid="address-form-save-button"
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
          </div>
        </div>
      </div>
    </div>
  );
};

AddressForm.propTypes = {
  /** Existing address for edit mode; null/undefined for create mode */
  address: PropTypes.shape({
    id: PropTypes.number,
    apelido: PropTypes.string,
    tipoResidencia: PropTypes.string,
    tipoLogradouro: PropTypes.string,
    logradouro: PropTypes.string,
    numero: PropTypes.string,
    complemento: PropTypes.string,
    bairro: PropTypes.string,
    cep: PropTypes.string,
    cidade: PropTypes.string,
    estado: PropTypes.string,
    pais: PropTypes.string,
    tipoEndereco: PropTypes.string,
  }),
  /** Called with the validated address payload */
  onSave: PropTypes.func.isRequired,
  /** Called when the modal should be closed */
  onClose: PropTypes.func.isRequired,
  /** Whether a save request is in progress */
  saving: PropTypes.bool,
  /** Server-side error message */
  serverError: PropTypes.string,
};

AddressForm.defaultProps = {
  address: null,
  saving: false,
  serverError: '',
};

export default AddressForm;
