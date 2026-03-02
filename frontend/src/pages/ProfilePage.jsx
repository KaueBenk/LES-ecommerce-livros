import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { useAuth } from '../store/authContext';
import customerService from '../services/customerService';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import useFetch from '../hooks/useFetch';
import ProfileForm from '../components/account/ProfileForm';

/**
 * ProfilePage
 * @component
 * @description Displays and allows editing of the authenticated customer's
 * personal profile data. Fetches profile from the API, delegates rendering
 * to ProfileForm, and handles the async save operation.
 * @returns {JSX.Element}
 */
const ProfilePage = () => {
  usePageTitle('Dados Pessoais');
  const { updateUser } = useAuth();

  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');

  const {
    data: profile,
    loading,
    error: fetchError,
    refetch,
  } = useFetch(customerService.getProfile, []);

  const handleSave = async (payload) => {
    setServerError('');
    setServerSuccess('');
    setSaving(true);
    try {
      await customerService.updateProfile(payload);
      setServerSuccess('Perfil atualizado com sucesso!');
      // Refresh profile data from API
      await refetch();
      // Sync auth context user name if changed
      if (payload.nome) {
        updateUser({ nome: payload.nome });
      }
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container page-container" data-testid="profile-page">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to={ROUTES.ACCOUNT}>Minha Conta</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Dados Pessoais
          </li>
        </ol>
      </nav>

      <h1 className="h3 mb-4">Dados Pessoais</h1>

      {/* Fetch error */}
      {fetchError && !loading && (
        <div className="alert alert-danger" data-testid="profile-fetch-error" role="alert">
          Não foi possível carregar os dados do perfil.{' '}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-2"
            onClick={refetch}
            data-testid="profile-retry-button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <ProfileForm
                profile={profile}
                loading={loading}
                saving={saving}
                onSave={handleSave}
                serverError={serverError}
                serverSuccess={serverSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
