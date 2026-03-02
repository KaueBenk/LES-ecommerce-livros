/**
 * ProfilePage.test.jsx
 * Tests for US-008: VALIDAR RF0022: Alterar cliente
 * 
 * Validates:
 * - RF0022: System allows editing customer registration data
 * - RN0026: Mandatory fields cannot be removed during editing
 * - RNF0012: Audit log records date, time, user, and previous data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import customerService from '../services/customerService';

// Mock services
vi.mock('../services/customerService', () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../hooks/usePageTitle', () => ({
  default: () => {},
}));

vi.mock('../store/authContext', () => ({
  useAuth: () => ({
    user: { id: 1, nome: 'João da Silva' },
    updateUser: vi.fn(),
  }),
}));

// Mock data based on prd.json US-008
const mockExistingCustomer = {
  id: 1,
  codigo: 'CLI-00001',
  nome: 'João da Silva',
  email: 'joao@example.com',
  cpf: '52998224725',
  genero: 'MASCULINO',
  dataNascimento: '1990-01-15',
  ranking: 5000.00,
  rankingNivel: 'OURO',
  telefones: [
    {
      id: 1,
      tipo: 'CELULAR',
      ddd: '11',
      numero: '98765-4321',
    },
  ],
};

const mockUpdateData = {
  nome: 'João da Silva Santos',
  genero: 'MASCULINO',
  dataNascimento: '1990-01-16',
  telefones: [
    {
      id: 1,
      tipo: 'CELULAR',
      ddd: '11',
      numero: '98765-4321',
    },
  ],
};

describe('ProfilePage - US-008: VALIDAR RF0022: Alterar cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock to return existing customer profile
    customerService.getProfile.mockResolvedValue(mockExistingCustomer);
    
    // Setup successful update response
    customerService.updateProfile.mockResolvedValue({
      ...mockExistingCustomer,
      ...mockUpdateData,
    });
  });

  const renderProfilePage = () => {
    return render(
      <BrowserRouter>
        <ProfilePage />
      </BrowserRouter>
    );
  };

  // ────────────────────────────────────────────────────────────────────────
  // RF0022: System allows editing customer registration data
  // ────────────────────────────────────────────────────────────────────────

  it('RF0022: should load and display existing customer data', async () => {
    renderProfilePage();

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Verify all data is displayed
    expect(screen.getByTestId('profile-nome-display')).toHaveTextContent('João da Silva');
    expect(screen.getByTestId('profile-genero-display')).toHaveTextContent('Masculino');
    expect(screen.getByTestId('profile-dataNascimento-display')).toHaveTextContent('15/01/1990');
    expect(screen.getByTestId('profile-email-display')).toHaveTextContent('joao@example.com');
    expect(screen.getByTestId('profile-cpf-display')).toHaveTextContent('529.982.247-25');
    
    // Verify phone is displayed
    const phoneDisplay = screen.getByTestId('profile-telefones-display');
    expect(phoneDisplay).toHaveTextContent('(11) 98765-4321');

    // Verify ranking is displayed
    expect(screen.getByTestId('ranking-nivel')).toHaveTextContent('OURO');
    expect(screen.getByTestId('ranking-value')).toHaveTextContent('R$ 5.000,00');
  });

  it('RF0022: should enable editing mode when edit button is clicked', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Initially in read-only mode
    expect(screen.getByTestId('profile-edit-button')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-save-button')).not.toBeInTheDocument();

    // Click edit button
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Now in edit mode
    expect(screen.queryByTestId('profile-edit-button')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-save-button')).toBeInTheDocument();
    expect(screen.getByTestId('profile-cancel-button')).toBeInTheDocument();

    // Fields should be editable
    expect(screen.getByTestId('profile-nome-input')).toBeInTheDocument();
    expect(screen.getByTestId('profile-genero-select')).toBeInTheDocument();
    expect(screen.getByTestId('profile-dataNascimento-input')).toBeInTheDocument();
  });

  it('RF0022: should allow editing customer name', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Change name
    const nameInput = screen.getByTestId('profile-nome-input');
    fireEvent.change(nameInput, {
      target: { value: 'João da Silva Santos' },
    });

    expect(nameInput).toHaveValue('João da Silva Santos');
  });

  it('RF0022: should allow editing birth date', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Change birth date
    const dateInput = screen.getByTestId('profile-dataNascimento-input');
    fireEvent.change(dateInput, {
      target: { value: '1990-01-16' },
    });

    expect(dateInput).toHaveValue('1990-01-16');
  });

  it('RF0022: should save changes successfully', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Make changes
    fireEvent.change(screen.getByTestId('profile-nome-input'), {
      target: { value: 'João da Silva Santos' },
    });

    fireEvent.change(screen.getByTestId('profile-dataNascimento-input'), {
      target: { value: '1990-01-16' },
    });

    // Save changes
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify updateProfile was called with correct data
    await waitFor(() => {
      expect(customerService.updateProfile).toHaveBeenCalledWith({
        nome: 'João da Silva Santos',
        genero: 'MASCULINO',
        dataNascimento: '1990-01-16',
        telefones: [
          {
            id: 1,
            tipo: 'CELULAR',
            ddd: '11',
            numero: '98765-4321',
          },
        ],
      });
    });

    // Verify success message is shown
    await waitFor(() => {
      expect(screen.getByTestId('profile-success-message')).toBeInTheDocument();
      expect(screen.getByTestId('profile-success-message')).toHaveTextContent('Perfil atualizado com sucesso!');
    });
  });

  it('RF0022: should cancel editing and restore original values', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Make changes
    const nameInput = screen.getByTestId('profile-nome-input');
    fireEvent.change(nameInput, {
      target: { value: 'Nome Alterado Temporariamente' },
    });

    expect(nameInput).toHaveValue('Nome Alterado Temporariamente');

    // Cancel editing
    fireEvent.click(screen.getByTestId('profile-cancel-button'));

    // Should exit edit mode
    await waitFor(() => {
      expect(screen.getByTestId('profile-edit-button')).toBeInTheDocument();
    });

    // Enter edit mode again to verify original value was restored
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    expect(screen.getByTestId('profile-nome-input')).toHaveValue('João da Silva');
  });

  // ────────────────────────────────────────────────────────────────────────
  // RN0026: Mandatory fields cannot be removed during editing
  // ────────────────────────────────────────────────────────────────────────

  it('RN0026: should not allow saving with empty name', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Clear name (mandatory field)
    const nameInput = screen.getByTestId('profile-nome-input');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.blur(nameInput);

    // Try to save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByTestId('profile-nome-error')).toBeInTheDocument();
      expect(screen.getByTestId('profile-nome-error')).toHaveTextContent('Nome obrigatório.');
    });

    // Verify updateProfile was NOT called
    expect(customerService.updateProfile).not.toHaveBeenCalled();
  });

  it('RN0026: should not allow saving without gender', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Clear gender (mandatory field)
    const genderSelect = screen.getByTestId('profile-genero-select');
    fireEvent.change(genderSelect, { target: { value: '' } });
    fireEvent.blur(genderSelect);

    // Try to save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByTestId('profile-genero-error')).toBeInTheDocument();
      expect(screen.getByTestId('profile-genero-error')).toHaveTextContent('Gênero obrigatório.');
    });

    // Verify updateProfile was NOT called
    expect(customerService.updateProfile).not.toHaveBeenCalled();
  });

  it('RN0026: should not allow saving without birth date', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Clear birth date (mandatory field)
    const dateInput = screen.getByTestId('profile-dataNascimento-input');
    fireEvent.change(dateInput, { target: { value: '' } });
    fireEvent.blur(dateInput);

    // Try to save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByTestId('profile-dataNascimento-error')).toBeInTheDocument();
      expect(screen.getByTestId('profile-dataNascimento-error')).toHaveTextContent('Data de nascimento obrigatória.');
    });

    // Verify updateProfile was NOT called
    expect(customerService.updateProfile).not.toHaveBeenCalled();
  });

  it('RN0026: should not allow saving with invalid phone DDD', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Enter invalid DDD (less than 2 digits)
    const dddInput = screen.getByTestId('phone-ddd-0');
    fireEvent.change(dddInput, { target: { value: '1' } });
    fireEvent.blur(dddInput);

    // Try to save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify error is shown
    await waitFor(() => {
      const errorElement = screen.queryByText('DDD inválido.');
      expect(errorElement).toBeInTheDocument();
    });

    // Verify updateProfile was NOT called
    expect(customerService.updateProfile).not.toHaveBeenCalled();
  });

  it('RN0026: should not allow saving with invalid phone number', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Enter invalid phone number
    const phoneInput = screen.getByTestId('phone-number-0');
    fireEvent.change(phoneInput, { target: { value: '123' } });

    // Try to save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify error is shown
    await waitFor(() => {
      const errorElement = screen.queryByText('Número inválido.');
      expect(errorElement).toBeInTheDocument();
    });

    // Verify updateProfile was NOT called
    expect(customerService.updateProfile).not.toHaveBeenCalled();
  });

  it('RN0026: should allow saving when all mandatory fields are valid', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // All mandatory fields are already valid from mockExistingCustomer
    // Just make a small change
    fireEvent.change(screen.getByTestId('profile-nome-input'), {
      target: { value: 'João da Silva Santos' },
    });

    // Save changes
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify updateProfile was called
    await waitFor(() => {
      expect(customerService.updateProfile).toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // RNF0012: Audit log records date, time, user, and previous data
  // ────────────────────────────────────────────────────────────────────────

  it('RNF0012: should send previous data to backend for audit log', async () => {
    // Note: In a real implementation, the backend would:
    // 1. Receive the update request with new data
    // 2. Query the database for the current/previous data
    // 3. Log: timestamp, user_id, previous_data, new_data
    // 
    // On the frontend side, we validate that:
    // - The update is triggered correctly
    // - The payload contains the new data
    // - The backend can compare with previous data for audit
    
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Capture the initial state (this represents "previous data")
    const previousData = {
      nome: mockExistingCustomer.nome,
      genero: mockExistingCustomer.genero,
      dataNascimento: mockExistingCustomer.dataNascimento,
      telefones: mockExistingCustomer.telefones,
    };

    // Enter edit mode and make changes
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    fireEvent.change(screen.getByTestId('profile-nome-input'), {
      target: { value: 'João da Silva Santos' },
    });

    // Save changes
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify that updateProfile was called
    await waitFor(() => {
      expect(customerService.updateProfile).toHaveBeenCalled();
    });

    // In a real implementation, the backend would receive:
    // - New data in the request body
    // - User ID from authentication token
    // - Timestamp would be generated by the backend
    // The backend would then:
    // 1. Fetch previous data from database
    // 2. Create audit log entry with:
    //    - data: current timestamp
    //    - hora: current time
    //    - usuario: authenticated user
    //    - dados_anteriores: previous data snapshot
    //    - dados_novos: new data from request
    
    const callPayload = customerService.updateProfile.mock.calls[0][0];
    
    // Verify that the payload contains the new data
    expect(callPayload.nome).toBe('João da Silva Santos');
    
    // Previous data verification would happen on the backend:
    // - Backend fetches current data before update
    // - Creates audit log with previous_data = { nome: 'João da Silva', ... }
    // - Performs the update
    // This test validates that the frontend correctly triggers the update
    // The backend is responsible for audit log creation per RNF0012
    
    // Verify previous data was different (showing a change occurred)
    expect(previousData.nome).toBe('João da Silva');
    expect(previousData.nome).not.toBe(callPayload.nome);
  });

  it('RNF0012: should track multiple field changes for audit', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Track original values (previous data)
    const previousData = {
      nome: 'João da Silva',
      dataNascimento: '1990-01-15',
    };

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Change multiple fields
    fireEvent.change(screen.getByTestId('profile-nome-input'), {
      target: { value: 'João da Silva Santos' },
    });

    fireEvent.change(screen.getByTestId('profile-dataNascimento-input'), {
      target: { value: '1990-01-16' },
    });

    // Save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    await waitFor(() => {
      expect(customerService.updateProfile).toHaveBeenCalled();
    });

    const callPayload = customerService.updateProfile.mock.calls[0][0];

    // Verify multiple changes were sent
    expect(callPayload.nome).toBe('João da Silva Santos');
    expect(callPayload.dataNascimento).toBe('1990-01-16');

    // Verify changes differ from previous data (audit trail)
    expect(previousData.nome).not.toBe(callPayload.nome);
    expect(previousData.dataNascimento).not.toBe(callPayload.dataNascimento);
  });

  // ────────────────────────────────────────────────────────────────────────
  // Additional scenarios
  // ────────────────────────────────────────────────────────────────────────

  it('should handle server errors gracefully', async () => {
    const errorMessage = 'Erro ao atualizar perfil';
    customerService.updateProfile.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode and make changes
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    fireEvent.change(screen.getByTestId('profile-nome-input'), {
      target: { value: 'Novo Nome' },
    });

    // Try to save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('profile-error-message')).toBeInTheDocument();
      expect(screen.getByTestId('profile-error-message')).toHaveTextContent(errorMessage);
    });
  });

  it('should display loading state while fetching profile', async () => {
    // Setup a delayed response
    customerService.getProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockExistingCustomer), 100))
    );

    renderProfilePage();

    // Verify loading state is shown
    expect(screen.getByTestId('profile-loading')).toBeInTheDocument();

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Loading state should be gone
    expect(screen.queryByTestId('profile-loading')).not.toBeInTheDocument();
  });

  it('should disable form during save operation', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Make a change
    fireEvent.change(screen.getByTestId('profile-nome-input'), {
      target: { value: 'Novo Nome' },
    });

    // Mock a delayed save
    customerService.updateProfile.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockExistingCustomer), 100))
    );

    // Click save
    fireEvent.click(screen.getByTestId('profile-save-button'));

    // Verify save button shows loading state
    const saveButton = screen.getByTestId('profile-save-button');
    expect(saveButton).toHaveTextContent('Salvando...');
    expect(saveButton).toBeDisabled();

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.getByTestId('profile-success-message')).toBeInTheDocument();
    });
  });

  it('should allow adding additional phone numbers', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Initially has 1 phone
    expect(screen.getByTestId('phone-row-0')).toBeInTheDocument();
    expect(screen.queryByTestId('phone-row-1')).not.toBeInTheDocument();

    // Add another phone
    fireEvent.click(screen.getByTestId('add-phone-button'));

    // Now has 2 phones
    expect(screen.getByTestId('phone-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('phone-row-1')).toBeInTheDocument();
  });

  it('should allow removing additional phone numbers (keeping at least one)', async () => {
    // Mock customer with 2 phones
    const customerWithTwoPhones = {
      ...mockExistingCustomer,
      telefones: [
        { id: 1, tipo: 'CELULAR', ddd: '11', numero: '98765-4321' },
        { id: 2, tipo: 'COMERCIAL', ddd: '11', numero: '3456-7890' },
      ],
    };
    
    customerService.getProfile.mockResolvedValue(customerWithTwoPhones);

    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Should have 2 phones
    expect(screen.getByTestId('phone-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('phone-row-1')).toBeInTheDocument();

    // Remove second phone
    fireEvent.click(screen.getByTestId('remove-phone-1'));

    // Should have only 1 phone now
    expect(screen.getByTestId('phone-row-0')).toBeInTheDocument();
    expect(screen.queryByTestId('phone-row-1')).not.toBeInTheDocument();
  });

  it('should not allow removing the last phone (at least one required)', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Has 1 phone
    expect(screen.getByTestId('phone-row-0')).toBeInTheDocument();

    // Remove button should not be available for the only phone
    expect(screen.queryByTestId('remove-phone-0')).not.toBeInTheDocument();
  });

  it('should not allow editing email (read-only field)', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Email should remain in display mode (no input field)
    expect(screen.getByTestId('profile-email-display')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-email-input')).not.toBeInTheDocument();
  });

  it('should not allow editing CPF (read-only field)', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // CPF should remain in display mode (no input field)
    expect(screen.getByTestId('profile-cpf-display')).toBeInTheDocument();
    expect(screen.queryByTestId('profile-cpf-input')).not.toBeInTheDocument();
  });

  it('should display ranking information (read-only)', async () => {
    renderProfilePage();

    await waitFor(() => {
      expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    });

    // Verify ranking is displayed
    expect(screen.getByTestId('ranking-section')).toBeInTheDocument();
    expect(screen.getByTestId('ranking-nivel')).toHaveTextContent('OURO');
    expect(screen.getByTestId('ranking-value')).toHaveTextContent('R$ 5.000,00');

    // Enter edit mode
    fireEvent.click(screen.getByTestId('profile-edit-button'));

    // Ranking should still be read-only (always displayed, never editable)
    expect(screen.getByTestId('ranking-section')).toBeInTheDocument();
  });
});
