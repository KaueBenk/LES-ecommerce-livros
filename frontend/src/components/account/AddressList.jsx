import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ADDRESS_TYPES } from '../../utils/constants';

// ── Type badge ────────────────────────────────────────────────────────────────

const TYPE_BADGE = {
  ENTREGA: 'bg-primary',
  FINANCEIRO: 'bg-success',
  AMBOS: 'bg-info text-dark',
  COBRANCA: 'bg-success',
};

const getTypeBadge = (tipoEndereco) => TYPE_BADGE[tipoEndereco] || 'bg-secondary';

const getTypeLabel = (tipoEndereco) =>
  (tipoEndereco === 'FINANCEIRO' ? 'Cobrança' : null) ||
  ADDRESS_TYPES.find((t) => t.value === tipoEndereco)?.label ||
  (tipoEndereco === 'AMBOS' ? 'Entrega e Financeiro' : tipoEndereco || '—');

// ── Delete confirmation ───────────────────────────────────────────────────────

const DeleteConfirmDialog = ({ address, onConfirm, onCancel, isBlocked }) => (
  <div
    className="modal d-block"
    tabIndex="-1"
    role="dialog"
    aria-modal="true"
    data-testid="delete-confirm-modal"
    style={{ background: 'rgba(0,0,0,0.5)' }}
  >
    <div className="modal-dialog modal-dialog-centered" role="document">
      <div className="modal-content">
        <div className="modal-header border-0">
          <h5 className="modal-title text-danger">Remover Endereço</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onCancel}
            aria-label="Fechar"
            data-testid="delete-confirm-close"
          />
        </div>
        <div className="modal-body">
          {isBlocked ? (
            <div className="alert alert-warning mb-0" data-testid="delete-blocked-message">
              <strong>Não é possível remover este endereço.</strong>
              <br />
              Você precisa manter ao menos um endereço de{' '}
              <strong>entrega</strong> e um de <strong>cobrança (financeiro)</strong>.
            </div>
          ) : (
            <>
              <p className="mb-1">Tem certeza que deseja remover este endereço?</p>
              {address?.apelido && (
                <p className="text-muted small mb-0">
                  <em>{address.apelido}</em> — {address.logradouro}, {address.numero}
                </p>
              )}
            </>
          )}
        </div>
        <div className="modal-footer border-0">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            data-testid="delete-cancel-button"
          >
            Cancelar
          </button>
          {!isBlocked && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onConfirm}
              data-testid="delete-confirm-button"
            >
              Remover
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

DeleteConfirmDialog.propTypes = {
  address: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isBlocked: PropTypes.bool.isRequired,
};

DeleteConfirmDialog.defaultProps = { address: null };

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Returns true if deleting `target` would leave zero delivery OR zero billing
 * addresses among the remaining ones.
 */
const wouldViolateMinimum = (addresses, targetId) => {
  const remaining = addresses.filter((a) => a.id !== targetId);

  const hasDelivery = remaining.some(
    (a) =>
      a.tipoEndereco === 'ENTREGA' ||
      a.tipoEndereco === 'AMBOS'
  );
  const hasBilling = remaining.some(
    (a) =>
      a.tipoEndereco === 'AMBOS' ||
      a.tipoEndereco === 'COBRANCA' ||
      a.tipoEndereco === 'FINANCEIRO'
  );

  return !hasDelivery || !hasBilling;
};

// ── AddressList ────────────────────────────────────────────────────────────────

/**
 * AddressList
 * @component
 * @description Renders a list of address cards with Add / Edit / Delete actions.
 * Deletion is blocked when it would leave zero delivery or billing addresses.
 */
const AddressList = ({ addresses, loading, onAdd, onEdit, onDelete, deleting }) => {
  const [confirmTarget, setConfirmTarget] = useState(null); // address object to delete

  const handleDeleteClick = (address) => setConfirmTarget(address);

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    onDelete(confirmTarget.id);
    setConfirmTarget(null);
  };

  const handleCancelDelete = () => setConfirmTarget(null);

  if (loading) {
    return (
      <div className="text-center py-5" data-testid="address-list-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando endereços...</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="address-list">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Endereços</h5>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onAdd}
          data-testid="add-address-button"
        >
          + Novo Endereço
        </button>
      </div>

      {/* Empty state */}
      {(!addresses || addresses.length === 0) && (
        <div
          className="text-center text-muted py-5 border rounded"
          data-testid="address-list-empty"
        >
          <div className="fs-1 mb-2">📍</div>
          <p className="mb-0">Nenhum endereço cadastrado.</p>
          <p className="small">Clique em "+ Novo Endereço" para adicionar.</p>
        </div>
      )}

      {/* Address cards */}
      <div className="row g-3">
        {addresses &&
          addresses.map((addr) => {
            const blocked = wouldViolateMinimum(addresses, addr.id);
            return (
              <div key={addr.id} className="col-md-6" data-testid={`address-card-${addr.id}`}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    {/* Header row: apelido + type badge */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title mb-0">
                        {addr.apelido || 'Endereço'}
                      </h6>
                      <span
                        className={`badge ${getTypeBadge(addr.tipoEndereco)}`}
                        data-testid={`address-type-badge-${addr.id}`}
                      >
                        {getTypeLabel(addr.tipoEndereco)}
                      </span>
                    </div>

                    {/* Address details */}
                    <p className="card-text text-muted small mb-1">
                      {addr.tipoLogradouro} {addr.logradouro}, {addr.numero}
                      {addr.complemento ? `, ${addr.complemento}` : ''}
                    </p>
                    <p className="card-text text-muted small mb-1">
                      {addr.bairro} — {addr.cidade}/{addr.estado}
                    </p>
                    <p className="card-text text-muted small mb-0">CEP {addr.cep}</p>
                  </div>

                  {/* Actions */}
                  <div className="card-footer bg-transparent border-0 d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => onEdit(addr)}
                      data-testid={`edit-address-${addr.id}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm ${blocked ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                      onClick={() => handleDeleteClick(addr)}
                      data-testid={`delete-address-${addr.id}`}
                      aria-label={
                        blocked
                          ? 'Não é possível remover este endereço'
                          : 'Remover endereço'
                      }
                    >
                      {deleting === addr.id ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : (
                        'Remover'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Delete confirmation modal */}
      {confirmTarget && (
        <DeleteConfirmDialog
          address={confirmTarget}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isBlocked={wouldViolateMinimum(addresses, confirmTarget.id)}
        />
      )}
    </div>
  );
};

AddressList.propTypes = {
  /** Array of address objects */
  addresses: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
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
    })
  ),
  /** Whether addresses are being loaded */
  loading: PropTypes.bool,
  /** Called when user clicks "+ Novo Endereço" */
  onAdd: PropTypes.func.isRequired,
  /** Called with address object when user clicks "Editar" */
  onEdit: PropTypes.func.isRequired,
  /** Called with address id when user confirms deletion */
  onDelete: PropTypes.func.isRequired,
  /** Id of address currently being deleted (shows spinner) */
  deleting: PropTypes.number,
};

AddressList.defaultProps = {
  addresses: [],
  loading: false,
  deleting: null,
};

export default AddressList;
