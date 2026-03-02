import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import customerService from '../services/customerService';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import useFetch from '../hooks/useFetch';
import CreditCardList from '../components/account/CreditCardList';
import CreditCardForm from '../components/account/CreditCardForm';

/**
 * CreditCardsPage
 * @component
 * @description Customer credit card management page.
 * Fetches all cards, provides Add/Edit/Delete/SetPreferred via modal form.
 * @returns {JSX.Element}
 */
const CreditCardsPage = () => {
  usePageTitle('Meus Cartões');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // card object being edited
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // id being deleted
  const [settingPreferred, setSettingPreferred] = useState(null); // id being set as preferred
  const [formError, setFormError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [pageError, setPageError] = useState('');

  const {
    data: cards,
    loading,
    error: fetchError,
    refetch,
  } = useFetch(customerService.getCreditCards, []);

  // ── Modal open/close ──────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (card) => {
    setEditTarget(card);
    setFormError('');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setFormError('');
  };

  // ── Save (create or update) ───────────────────────────────────────────────
  const handleSave = async (payload) => {
    setFormError('');
    setSaving(true);
    try {
      if (editTarget?.id) {
        await customerService.updateCreditCard(editTarget.id, payload);
        setPageSuccess('Cartão atualizado com sucesso!');
      } else {
        await customerService.addCreditCard(payload);
        setPageSuccess('Cartão adicionado com sucesso!');
      }
      setPageError('');
      closeForm();
      await refetch();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setPageSuccess('');
    setPageError('');
    setDeleting(id);
    try {
      await customerService.deleteCreditCard(id);
      setPageSuccess('Cartão removido com sucesso.');
      await refetch();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  // ── Set preferred ─────────────────────────────────────────────────────────
  const handleSetPreferred = async (id) => {
    setPageSuccess('');
    setPageError('');
    setSettingPreferred(id);
    try {
      await customerService.setPreferredCard(id);
      setPageSuccess('Cartão preferido atualizado com sucesso!');
      await refetch();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setSettingPreferred(null);
    }
  };

  return (
    <div className="container page-container" data-testid="credit-cards-page">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={ROUTES.ACCOUNT}>Minha Conta</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Cartões de Crédito
          </li>
        </ol>
      </nav>

      <h1 className="h3 mb-4">Meus Cartões de Crédito</h1>

      {/* Page-level messages */}
      {pageSuccess && (
        <div
          className="alert alert-success alert-dismissible"
          role="status"
          data-testid="cards-success-message"
        >
          {pageSuccess}
          <button
            type="button"
            className="btn-close"
            onClick={() => setPageSuccess('')}
            aria-label="Fechar"
          />
        </div>
      )}
      {pageError && (
        <div
          className="alert alert-danger alert-dismissible"
          role="alert"
          data-testid="cards-error-message"
        >
          {pageError}
          <button
            type="button"
            className="btn-close"
            onClick={() => setPageError('')}
            aria-label="Fechar"
          />
        </div>
      )}

      {/* Fetch error */}
      {fetchError && !loading && (
        <div className="alert alert-danger" role="alert" data-testid="cards-fetch-error">
          Não foi possível carregar os cartões.{' '}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={refetch}
            data-testid="cards-retry-button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Card list */}
      <CreditCardList
        cards={cards || []}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        onSetPreferred={handleSetPreferred}
        deleting={deleting}
        settingPreferred={settingPreferred}
      />

      {/* Create / Edit modal */}
      {showForm && (
        <CreditCardForm
          card={editTarget}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
          serverError={formError}
        />
      )}
    </div>
  );
};

export default CreditCardsPage;
