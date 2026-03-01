import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import customerService from '../services/customerService';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import useFetch from '../hooks/useFetch';
import AddressList from '../components/account/AddressList';
import AddressForm from '../components/account/AddressForm';

/**
 * AddressesPage
 * @component
 * @description Customer address management page.
 * Fetches all addresses, provides Add/Edit/Delete via modal form.
 * @returns {JSX.Element}
 */
const AddressesPage = () => {
  usePageTitle('Meus Endereços');

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // address object being edited
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // id being deleted
  const [formError, setFormError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');
  const [pageError, setPageError] = useState('');

  const {
    data: addresses,
    loading,
    error: fetchError,
    refetch,
  } = useFetch(customerService.getAddresses, []);

  // ── Modal open/close ──────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (address) => {
    setEditTarget(address);
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
        await customerService.updateAddress(editTarget.id, payload);
      } else {
        await customerService.addAddress(payload);
      }
      setPageSuccess(
        editTarget?.id ? 'Endereço atualizado com sucesso!' : 'Endereço adicionado com sucesso!'
      );
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
      await customerService.deleteAddress(id);
      setPageSuccess('Endereço removido com sucesso.');
      await refetch();
    } catch (err) {
      setPageError(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="container page-container" data-testid="addresses-page">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={ROUTES.ACCOUNT}>Minha Conta</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Endereços
          </li>
        </ol>
      </nav>

      <h1 className="h3 mb-4">Meus Endereços</h1>

      {/* Page-level messages */}
      {pageSuccess && (
        <div
          className="alert alert-success alert-dismissible"
          role="status"
          data-testid="addresses-success-message"
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
          data-testid="addresses-error-message"
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
        <div className="alert alert-danger" role="alert" data-testid="addresses-fetch-error">
          Não foi possível carregar os endereços.{' '}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={refetch}
            data-testid="addresses-retry-button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Address list */}
      <AddressList
        addresses={addresses || []}
        loading={loading}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {/* Create / Edit modal */}
      {showForm && (
        <AddressForm
          address={editTarget}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
          serverError={formError}
        />
      )}
    </div>
  );
};

export default AddressesPage;
