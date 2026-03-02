import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CREDIT_CARD_BRANDS } from '../../utils/constants';

// ── Brand helpers ─────────────────────────────────────────────────────────────

const getBrandLabel = (bandeira) =>
  CREDIT_CARD_BRANDS.find((b) => b.value === bandeira)?.label || bandeira || '—';

/**
 * Returns a colored badge class and text for each card brand.
 */
const BRAND_STYLES = {
  VISA: { bg: 'bg-primary', text: 'text-white' },
  MASTERCARD: { bg: 'bg-danger', text: 'text-white' },
  ELO: { bg: 'bg-warning', text: 'text-dark' },
  AMEX: { bg: 'bg-info', text: 'text-dark' },
  HIPERCARD: { bg: 'bg-danger', text: 'text-white' },
  DINERS: { bg: 'bg-dark', text: 'text-white' },
  OUTRO: { bg: 'bg-secondary', text: 'text-white' },
};

const getBrandStyle = (bandeira) =>
  BRAND_STYLES[bandeira] || { bg: 'bg-secondary', text: 'text-white' };

/** Returns last 4 digits, or the whole string if < 4 chars */
const lastFour = (numero) => {
  if (!numero) return '????';
  const digits = String(numero).replace(/\D/g, '');
  return digits.slice(-4) || '????';
};

// ── Delete confirmation dialog ────────────────────────────────────────────────

const DeleteConfirmDialog = ({ card, onConfirm, onCancel }) => (
  <div
    className="modal d-block"
    tabIndex="-1"
    role="dialog"
    aria-modal="true"
    data-testid="card-delete-confirm-modal"
    style={{ background: 'rgba(0,0,0,0.5)' }}
  >
    <div className="modal-dialog modal-dialog-centered" role="document">
      <div className="modal-content">
        <div className="modal-header border-0">
          <h5 className="modal-title text-danger">Remover Cartão</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onCancel}
            aria-label="Fechar"
            data-testid="card-delete-cancel-btn"
          />
        </div>
        <div className="modal-body">
          <p className="mb-1">Tem certeza que deseja remover este cartão?</p>
          {card && (
            <p className="text-muted small mb-0">
              {getBrandLabel(card.bandeira)} •••• {lastFour(card.numero)}
            </p>
          )}
        </div>
        <div className="modal-footer border-0">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
            data-testid="card-delete-cancel"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            data-testid="card-delete-confirm"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  </div>
);

DeleteConfirmDialog.propTypes = {
  card: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

DeleteConfirmDialog.defaultProps = { card: null };

// ── Card item ─────────────────────────────────────────────────────────────────

const CreditCardItem = ({ card, onEdit, onDelete, onSetPreferred, settingPreferred, deleting }) => {
  const { bg, text } = getBrandStyle(card.bandeira);
  const isDeleting = deleting === card.id;
  const isSettingPreferred = settingPreferred === card.id;

  return (
    <div
      className={`card mb-3 ${card.preferencial ? 'border-success' : ''}`}
      data-testid={`credit-card-item-${card.id}`}
    >
      <div className="card-body d-flex flex-wrap align-items-center gap-3">
        {/* Brand badge */}
        <span
          className={`badge ${bg} ${text} fs-6 px-3 py-2`}
          style={{ minWidth: '90px', textAlign: 'center' }}
          data-testid={`card-brand-badge-${card.id}`}
        >
          {getBrandLabel(card.bandeira)}
        </span>

        {/* Card info */}
        <div className="flex-grow-1">
          <div className="fw-semibold" data-testid={`card-number-${card.id}`}>
            •••• •••• •••• {lastFour(card.numero)}
          </div>
          {card.nomeImpresso && (
            <div className="text-muted small" data-testid={`card-name-${card.id}`}>
              {card.nomeImpresso}
            </div>
          )}
        </div>

        {/* Preferred badge */}
        {card.preferencial && (
          <span
            className="badge bg-success"
            data-testid={`card-preferred-badge-${card.id}`}
          >
            ★ Preferido
          </span>
        )}

        {/* Actions */}
        <div className="d-flex gap-2 flex-wrap">
          {!card.preferencial && (
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={() => onSetPreferred(card.id)}
              disabled={isSettingPreferred || isDeleting}
              data-testid={`card-set-preferred-btn-${card.id}`}
              title="Definir como preferido"
            >
              {isSettingPreferred ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : (
                '★ Preferido'
              )}
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => onEdit(card)}
            disabled={isDeleting}
            data-testid={`card-edit-btn-${card.id}`}
            title="Editar cartão"
          >
            Editar
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => onDelete(card)}
            disabled={isDeleting || isSettingPreferred}
            data-testid={`card-delete-btn-${card.id}`}
            title="Remover cartão"
          >
            {isDeleting ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            ) : (
              'Remover'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

CreditCardItem.propTypes = {
  card: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetPreferred: PropTypes.func.isRequired,
  settingPreferred: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  deleting: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CreditCardItem.defaultProps = { settingPreferred: null, deleting: null };

// ── Main list ─────────────────────────────────────────────────────────────────

/**
 * CreditCardList
 * @component
 * @description Displays customer credit cards with brand badges, preferred marking,
 * set-preferred and delete actions.
 */
const CreditCardList = ({
  cards,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onSetPreferred,
  deleting,
  settingPreferred,
}) => {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteRequest = (card) => setDeleteTarget(card);
  const handleDeleteCancel = () => setDeleteTarget(null);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5" data-testid="credit-cards-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando cartões...</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="credit-card-list">
      {/* Add button */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted small">
          {cards.length === 0
            ? 'Nenhum cartão cadastrado.'
            : `${cards.length} cartão${cards.length > 1 ? 'ões' : ''} cadastrado${cards.length > 1 ? 's' : ''}`}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAdd}
          data-testid="credit-card-add-btn"
        >
          + Adicionar Cartão
        </button>
      </div>

      {/* Empty state */}
      {cards.length === 0 && (
        <div className="text-center py-5 text-muted" data-testid="credit-cards-empty">
          <div className="fs-1 mb-2">💳</div>
          <p>Você ainda não possui cartões cadastrados.</p>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={onAdd}
            data-testid="credit-card-add-first-btn"
          >
            Adicionar meu primeiro cartão
          </button>
        </div>
      )}

      {/* Cards */}
      {cards.map((card) => (
        <CreditCardItem
          key={card.id}
          card={card}
          onEdit={onEdit}
          onDelete={handleDeleteRequest}
          onSetPreferred={onSetPreferred}
          deleting={deleting}
          settingPreferred={settingPreferred}
        />
      ))}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmDialog
          card={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

CreditCardList.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetPreferred: PropTypes.func.isRequired,
  deleting: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  settingPreferred: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

CreditCardList.defaultProps = {
  loading: false,
  deleting: null,
  settingPreferred: null,
};

export default CreditCardList;
