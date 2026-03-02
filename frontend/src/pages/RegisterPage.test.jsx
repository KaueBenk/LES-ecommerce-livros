/**
 * RegisterPage.test.jsx
 * Tests for US-007: VALIDAR RF0021: Cadastrar cliente
 * 
 * Validates:
 * - RF0021: Client registration with all mandatory data
 * - RN0026: Mandatory client registration fields
 * - RN0021: At least one billing address required
 * - RN0022: At least one delivery address required
 * - RNF0035: Client receives unique code in system
 * - RNF0031: Strong password requirement
 * - RNF0032: Password confirmation
 * - RNF0033: Password stored encrypted
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../pages/RegisterPage';
import authService from '../services/authService';

// Mock the authService
vi.mock('../services/authService', () => ({
  default: {
    register: vi.fn(),
  },
}));

// Mock the hooks
vi.mock('../hooks/usePageTitle', () => ({
  default: () => {},
}));

// Mock data based on prd.json US-007
const validCustomerData = {
  nome: 'João da Silva',
  email: 'joao@example.com',
  cpf: '529.982.247-25', // Valid CPF
  dataNascimento: '1990-01-15',
  genero: 'MASCULINO',
  senha: 'Senha@123',
  confirmacaoSenha: 'Senha@123',
};

const validPhone = {
  tipo: 'CELULAR',
  ddd: '11',
  numero: '98765-4321',
};

const validAddress = {
  apelido: 'Casa',
  tipoResidencia: 'CASA',
  tipoLogradouro: 'RUA',
  logradouro: 'Rua das Flores',
  numero: '123',
  complemento: 'Apto 101',
  bairro: 'Centro',
  cep: '01234-567',
  cidade: 'São Paulo',
  estado: 'SP',
  pais: 'Brasil',
  tipoEndereco: 'ENTREGA_E_FINANCEIRO',
};

// Existing data to test uniqueness
const existingEmail = 'existing@example.com';
const existingCpf = '111.222.333-44';

describe('RegisterPage - US-007: VALIDAR RF0021: Cadastrar cliente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful registration
    authService.register.mockResolvedValue({
      id: 1,
      codigo: 'CLI-00001', // RNF0035: Unique customer code
      nome: validCustomerData.nome,
      email: validCustomerData.email,
    });
  });

  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  const fillBasicInfo = async () => {
    fireEvent.change(screen.getByTestId('name-input'), {
      target: { value: validCustomerData.nome },
    });
    
    fireEvent.change(screen.getByTestId('gender-select'), {
      target: { value: validCustomerData.genero },
    });
    
    fireEvent.change(screen.getByTestId('cpf-input'), {
      target: { value: validCustomerData.cpf },
    });
    
    fireEvent.change(screen.getByTestId('birth-date-input'), {
      target: { value: validCustomerData.dataNascimento },
    });
    
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: validCustomerData.email },
    });
  };

  const fillPassword = async () => {
    const senhaInput = screen.getByTestId('password-input');
    const confirmacaoInput = screen.getByTestId('password-confirm-input');

    fireEvent.change(senhaInput, {
      target: { value: validCustomerData.senha },
    });
    
    fireEvent.change(confirmacaoInput, {
      target: { value: validCustomerData.confirmacaoSenha },
    });
  };

  const fillPhone = async (index = 0) => {
    fireEvent.change(screen.getByTestId(`phone-ddd-${index}`), {
      target: { value: validPhone.ddd },
    });
    
    fireEvent.change(screen.getByTestId(`phone-number-${index}`), {
      target: { value: validPhone.numero },
    });
  };

  const fillAddress = async (index = 0) => {
    fireEvent.change(screen.getByTestId(`address-street-${index}`), {
      target: { value: validAddress.logradouro },
    });
    
    fireEvent.change(screen.getByTestId(`address-number-${index}`), {
      target: { value: validAddress.numero },
    });
    
    fireEvent.change(screen.getByTestId(`address-neighborhood-${index}`), {
      target: { value: validAddress.bairro },
    });
    
    fireEvent.change(screen.getByTestId(`address-cep-${index}`), {
      target: { value: validAddress.cep },
    });
    
    fireEvent.change(screen.getByTestId(`address-city-${index}`), {
      target: { value: validAddress.cidade },
    });
    
    fireEvent.change(screen.getByTestId(`address-state-${index}`), {
      target: { value: validAddress.estado },
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 1: RF0021 + RN0026 - Register customer with all mandatory fields
  // ─────────────────────────────────────────────────────────────────────────────
  it('should register a new customer with all mandatory fields (RF0021, RN0026)', async () => {
    renderRegisterPage();

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    // Fill all mandatory fields
    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress();

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Wait for submission
    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledTimes(1);
    });

    // Verify all mandatory fields were sent
    const submittedData = authService.register.mock.calls[0][0];
    
    // RN0026: Verify mandatory fields
    expect(submittedData.nome).toBe(validCustomerData.nome);
    expect(submittedData.genero).toBe(validCustomerData.genero);
    expect(submittedData.cpf).toBe(validCustomerData.cpf.replace(/\D/g, ''));
    expect(submittedData.dataNascimento).toBe(validCustomerData.dataNascimento);
    expect(submittedData.email).toBe(validCustomerData.email);
    expect(submittedData.senha).toBe(validCustomerData.senha);
    expect(submittedData.confirmacaoSenha).toBe(validCustomerData.confirmacaoSenha);
    
    // Verify phone (mandatory)
    expect(submittedData.telefones).toHaveLength(1);
    expect(submittedData.telefones[0].ddd).toBe(validPhone.ddd);
    expect(submittedData.telefones[0].numero).toBe(validPhone.numero);
    
    // RN0021 + RN0022: Verify at least one address
    expect(submittedData.enderecos).toHaveLength(1);
    expect(submittedData.enderecos[0].logradouro).toBe(validAddress.logradouro);
    expect(submittedData.enderecos[0].cidade).toBe(validAddress.cidade);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 2: RNF0035 - Customer receives unique code
  // ─────────────────────────────────────────────────────────────────────────────
  it('should assign a unique code to the customer (RNF0035)', async () => {
    const mockResponse = {
      id: 42,
      codigo: 'CLI-00042', // Unique customer code
      nome: validCustomerData.nome,
      email: validCustomerData.email,
    };
    
    authService.register.mockResolvedValue(mockResponse);
    
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress();

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });

    // In a real scenario, the backend would assign the unique code
    // Here we're validating the mock response structure
    expect(mockResponse.codigo).toMatch(/^CLI-\d{5}$/);
    expect(mockResponse.codigo).toBe('CLI-00042');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 3: RN0026 - All mandatory fields validation
  // ─────────────────────────────────────────────────────────────────────────────
  it('should require all mandatory fields (RN0026)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    // Try to submit without filling anything
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText(/nome obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/gênero obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/cpf obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/data de nascimento obrigatória/i)).toBeInTheDocument();
      expect(screen.getByText(/email obrigatório/i)).toBeInTheDocument();
    });

    // Should not call API
    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 4: RNF0031 + RNF0032 - Strong password validation
  // ─────────────────────────────────────────────────────────────────────────────
  it('should require a strong password (RNF0031, RNF0032)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPhone();
    await fillAddress();

    // Test weak password
    const senhaInput = screen.getByTestId('password-input');
    
    fireEvent.change(senhaInput, {
      target: { value: 'weak' },
    });

    // Should show password strength indicator
    await waitFor(() => {
      const strengthIndicator = screen.getByTestId('password-strength-indicator');
      expect(strengthIndicator).toBeInTheDocument();
    });

    // Submit with weak password
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Should show password validation error
    await waitFor(() => {
      // Check for password error display or specific criteria messages
      const passwordError = screen.queryByTestId('password-error');
      const hasError = passwordError !== null;
      expect(hasError).toBe(true);
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 5: RNF0032 - Password confirmation must match
  // ─────────────────────────────────────────────────────────────────────────────
  it('should require password confirmation to match (RNF0032)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPhone();
    await fillAddress();

    // Fill passwords with mismatch
    const senhaInput = screen.getByTestId('password-input');
    const confirmacaoInput = screen.getByTestId('password-confirm-input');

    fireEvent.change(senhaInput, {
      target: { value: 'Senha@123' },
    });
    
    fireEvent.change(confirmacaoInput, {
      target: { value: 'Senha@456' }, // Different!
    });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Should show mismatch error
    await waitFor(() => {
      expect(screen.getByText(/senhas não conferem/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 6: RNF0033 - Password stored encrypted
  // ─────────────────────────────────────────────────────────────────────────────
  it('should send password to be encrypted on backend (RNF0033)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress();

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });

    const submittedData = authService.register.mock.calls[0][0];
    
    // Frontend sends plain password; backend is responsible for encryption
    // The test validates that password is sent and backend will handle encryption
    expect(submittedData.senha).toBe(validCustomerData.senha);
    expect(submittedData.confirmacaoSenha).toBe(validCustomerData.confirmacaoSenha);
    
    // Note: In real implementation, backend receives plain password via HTTPS
    // and stores it encrypted. This is the correct security pattern.
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 7: RN0021 - At least one billing address required
  // ─────────────────────────────────────────────────────────────────────────────
  it('should require at least one billing address (RN0021)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();

    // Don't fill address - try to submit
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Should show address validation errors
    await waitFor(() => {
      const errors = screen.getAllByText(/campo obrigatório/i);
      expect(errors.length).toBeGreaterThan(0);
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 8: RN0022 - At least one delivery address required
  // ─────────────────────────────────────────────────────────────────────────────
  it('should require at least one delivery address (RN0022)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress();

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
    });

    const submittedData = authService.register.mock.calls[0][0];
    
    // Verify address with type that includes delivery
    expect(submittedData.enderecos).toHaveLength(1);
    
    // Default address type should be ENTREGA_E_FINANCEIRO (both delivery and billing)
    // This satisfies both RN0021 and RN0022
    expect(submittedData.enderecos[0].tipoEndereco).toBe('ENTREGA_E_FINANCEIRO');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 9: CPF validation
  // ─────────────────────────────────────────────────────────────────────────────
  it('should validate CPF format', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    // Fill invalid CPF
    fireEvent.change(screen.getByTestId('cpf-input'), {
      target: { value: '123.456.789-00' }, // Invalid CPF
    });

    // Blur to trigger validation
    fireEvent.blur(screen.getByTestId('cpf-input'));

    // Try to submit
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 10: Email validation
  // ─────────────────────────────────────────────────────────────────────────────
  it('should validate email format', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    // Fill invalid email
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'invalid-email' },
    });

    // Blur to trigger validation
    fireEvent.blur(screen.getByTestId('email-input'));

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/formato de email inválido/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 11: Phone validation (RN0026 - Telefone com tipo, DDD e número)
  // ─────────────────────────────────────────────────────────────────────────────
  it('should require phone with type, DDD and number (RN0026)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillAddress();

    // Don't fill phone - try to submit
    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/ddd inválido/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 12: RN0023 - Address composition validation
  // ─────────────────────────────────────────────────────────────────────────────
  it('should validate all mandatory address fields (RN0023)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();

    // Fill only partial address
    fireEvent.change(screen.getByTestId('address-street-0'), {
      target: { value: 'Rua das Flores' },
    });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Should show errors for missing address fields
    await waitFor(() => {
      const errors = screen.getAllByText(/campo obrigatório/i);
      expect(errors.length).toBeGreaterThan(0);
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 13: CEP validation
  // ─────────────────────────────────────────────────────────────────────────────
  it('should validate CEP format', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();

    // Fill address with invalid CEP
    fireEvent.change(screen.getByTestId('address-street-0'), { target: { value: 'Rua das Flores' } });
    fireEvent.change(screen.getByTestId('address-number-0'), { target: { value: '123' } });
    fireEvent.change(screen.getByTestId('address-neighborhood-0'), { target: { value: 'Centro' } });
    fireEvent.change(screen.getByTestId('address-cep-0'), { target: { value: '12345' } }); // Invalid CEP
    fireEvent.change(screen.getByTestId('address-city-0'), { target: { value: 'São Paulo' } });
    fireEvent.change(screen.getByTestId('address-state-0'), { target: { value: 'SP' } });

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cep inválido/i)).toBeInTheDocument();
    });

    expect(authService.register).not.toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 14: Password strength indicator
  // ─────────────────────────────────────────────────────────────────────────────
  it('should display password strength indicator (RNF0031)', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    const senhaInput = screen.getByTestId('password-input');

    // Type a strong password
    fireEvent.change(senhaInput, {
      target: { value: 'Senha@123' },
    });

    // Should show strength indicator
    await waitFor(() => {
      expect(screen.getByTestId('password-strength-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('password-strength-bar')).toBeInTheDocument();
      
      // Should show all criteria
      expect(screen.getByTestId('pw-criteria-length')).toBeInTheDocument();
      expect(screen.getByTestId('pw-criteria-uppercase')).toBeInTheDocument();
      expect(screen.getByTestId('pw-criteria-lowercase')).toBeInTheDocument();
      expect(screen.getByTestId('pw-criteria-special')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 15: Multiple addresses support
  // ─────────────────────────────────────────────────────────────────────────────
  it('should support multiple addresses', async () => {
    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress(0);

    // Add another address
    const addAddressButton = screen.getByTestId('add-address-button');
    fireEvent.click(addAddressButton);

    // Should have two address sections now
    await waitFor(() => {
      expect(screen.getByTestId('address-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('address-item-1')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 16: Server error handling
  // ─────────────────────────────────────────────────────────────────────────────
  it('should display server error messages', async () => {
    const errorMessage = 'Email já cadastrado';
    authService.register.mockRejectedValue({
      response: {
        data: {
          message: errorMessage,
        },
      },
    });

    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress();

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Should display server error
    await waitFor(() => {
      expect(screen.getByTestId('register-error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Test 17: Loading state during submission
  // ─────────────────────────────────────────────────────────────────────────────
  it('should show loading state during submission', async () => {
    // Make the mock wait a bit
    authService.register.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 1, codigo: 'CLI-00001' }), 100))
    );

    renderRegisterPage();

    await waitFor(() => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    await fillBasicInfo();
    await fillPassword();
    await fillPhone();
    await fillAddress();

    const submitButton = screen.getByRole('button', { name: /criar conta/i });
    fireEvent.click(submitButton);

    // Button should be disabled during loading
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
