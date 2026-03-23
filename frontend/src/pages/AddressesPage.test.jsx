/**
 * AddressesPage.test.jsx
 * Tests for US-012: VALIDAR RF0026: Cadastro de endereços de entrega
 * 
 * Validates:
 * - RF0026: Multiple delivery addresses can be associated with a customer
 * - RN0023: Address mandatory fields are validated
 * - RF0034/RNF0035: Addresses can be edited independently without changing other data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddressesPage from './AddressesPage';
import customerService from '../services/customerService';

// Mock services
vi.mock('../services/customerService', () => ({
  default: {
    getAddresses: vi.fn(),
    addAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../hooks/usePageTitle', () => ({
  default: () => {},
}));

// Mock data based on US-012 acceptance criteria
const mockAddresses = [
  {
    id: 1,
    apelido: 'Casa',
    tipoResidencia: 'CASA',
    tipoLogradouro: 'RUA',
    logradouro: 'das Flores',
    numero: '123',
    complemento: 'Apto 101',
    bairro: 'Centro',
    cep: '12345-678',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    tipoEndereco: 'ENTREGA',
  },
  {
    id: 2,
    apelido: 'Trabalho',
    tipoResidencia: 'COMERCIAL',
    tipoLogradouro: 'AVENIDA',
    logradouro: 'Paulista',
    numero: '1000',
    complemento: 'Sala 505',
    bairro: 'Bela Vista',
    cep: '01310-100',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    tipoEndereco: 'FINANCEIRO',
  },
  {
    id: 3,
    apelido: 'Casa dos Pais',
    tipoResidencia: 'CASA',
    tipoLogradouro: 'RUA',
    logradouro: 'dos Jacarandás',
    numero: '456',
    complemento: '',
    bairro: 'Jardim Primavera',
    cep: '13500-000',
    cidade: 'Rio Claro',
    estado: 'SP',
    pais: 'Brasil',
    tipoEndereco: 'AMBOS',
  },
];

const newAddressPayload = {
  apelido: 'Escritório',
  tipoResidencia: 'COMERCIAL',
  tipoLogradouro: 'AVENIDA',
  logradouro: 'Brasil',
  numero: '2000',
  complemento: 'Sala 10',
  bairro: 'Jardim América',
  cep: '01431-000',
  cidade: 'São Paulo',
  estado: 'SP',
  pais: 'Brasil',
  tipoEndereco: 'ENTREGA',
};

describe('AddressesPage - US-012: VALIDAR RF0026: Cadastro de endereços de entrega', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customerService.getAddresses.mockResolvedValue(mockAddresses);
  });

  const renderAddressesPage = () => {
    return render(
      <BrowserRouter>
        <AddressesPage />
      </BrowserRouter>
    );
  };

  // ────────────────────────────────────────────────────────────────────────
  // RF0026: Multiple delivery addresses can be associated with a customer
  // ────────────────────────────────────────────────────────────────────────

  it('RF0026: should display multiple addresses for a customer', async () => {
    renderAddressesPage();

    // Wait for addresses to load
    await waitFor(() => {
      expect(screen.getByTestId('address-list')).toBeInTheDocument();
    });

    // Verify all three addresses are displayed
    expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('address-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('address-card-3')).toBeInTheDocument();

    // Verify data loads from mocked service
    expect(customerService.getAddresses).toHaveBeenCalledTimes(1);
  });

  it('RF0026: should identify each address with a short phrase (apelido)', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByText('Casa')).toBeInTheDocument();
    });

    // Verify all addresses have their apelidos displayed
    expect(screen.getByText('Casa')).toBeInTheDocument();
    expect(screen.getByText('Trabalho')).toBeInTheDocument();
    expect(screen.getByText('Casa dos Pais')).toBeInTheDocument();
  });

  it('RF0026: should allow adding a new delivery address', async () => {
    customerService.addAddress.mockResolvedValue({
      id: 4,
      ...newAddressPayload,
    });

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    // Click to open add form
    const addButton = screen.getByTestId('add-address-button');
    fireEvent.click(addButton);

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Verify form is in "create" mode
    expect(screen.getByTestId('address-form-title')).toHaveTextContent('Novo Endereço');

    // Fill in all fields
    fireEvent.change(screen.getByTestId('address-apelido-input'), {
      target: { value: newAddressPayload.apelido },
    });
    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: newAddressPayload.logradouro },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: newAddressPayload.numero },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: newAddressPayload.bairro },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: newAddressPayload.cep },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: newAddressPayload.cidade },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: newAddressPayload.estado },
    });
    fireEvent.change(screen.getByTestId('address-tipo-select'), {
      target: { value: newAddressPayload.tipoEndereco },
    });

    // Submit form
    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Verify service was called with correct payload
    await waitFor(() => {
      expect(customerService.addAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          apelido: newAddressPayload.apelido,
          logradouro: newAddressPayload.logradouro,
          numero: newAddressPayload.numero,
          bairro: newAddressPayload.bairro,
          cep: newAddressPayload.cep,
          cidade: newAddressPayload.cidade,
          estado: newAddressPayload.estado,
          tipoEndereco: newAddressPayload.tipoEndereco,
        })
      );
    });

    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('addresses-success-message')).toHaveTextContent(
        'Endereço adicionado com sucesso!'
      );
    });

    // Verify addresses are refetched (initial + after add)
    expect(customerService.getAddresses).toHaveBeenCalledTimes(2);
  });

  it('RF0026: should support multiple addresses of type ENTREGA (delivery)', async () => {
    const multipleDeliveryAddresses = [
      { ...mockAddresses[0], id: 1, tipoEndereco: 'ENTREGA' },
      { ...mockAddresses[1], id: 2, tipoEndereco: 'ENTREGA' },
      { ...mockAddresses[2], id: 3, tipoEndereco: 'FINANCEIRO' }, // One billing to satisfy minimum
    ];

    customerService.getAddresses.mockResolvedValue(multipleDeliveryAddresses);
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-type-badge-1')).toHaveTextContent('Entrega');
      expect(screen.getByTestId('address-type-badge-2')).toHaveTextContent('Entrega');
    });

    // Both delivery addresses should be displayed
    expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('address-card-2')).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────────────
  // RN0023: Mandatory address fields validation
  // ────────────────────────────────────────────────────────────────────────

  it('RN0023: should validate mandatory field - logradouro', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Fill only some fields, leave logradouro empty
    const logradouroInput = screen.getByTestId('address-logradouro-input');
    fireEvent.change(logradouroInput, { target: { value: '' } });
    fireEvent.blur(logradouroInput);

    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Centro' },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    // Try to submit
    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Verify error message appears
    await waitFor(() => {
      expect(screen.getByTestId('address-logradouro-error')).toHaveTextContent(
        'Logradouro obrigatório'
      );
    });

    // Verify service was NOT called
    expect(customerService.addAddress).not.toHaveBeenCalled();
  });

  it('RN0023: should validate mandatory field - numero', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Fill all but numero
    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'das Flores' },
    });
    const numeroInput = screen.getByTestId('address-numero-input');
    fireEvent.change(numeroInput, { target: { value: '' } });
    fireEvent.blur(numeroInput);
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Centro' },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Verify error
    await waitFor(() => {
      expect(screen.getByTestId('address-numero-error')).toHaveTextContent('Número obrigatório');
    });

    expect(customerService.addAddress).not.toHaveBeenCalled();
  });

  it('RN0023: should validate mandatory field - bairro', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'das Flores' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    const bairroInput = screen.getByTestId('address-bairro-input');
    fireEvent.change(bairroInput, { target: { value: '' } });
    fireEvent.blur(bairroInput);
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-bairro-error')).toHaveTextContent('Bairro obrigatório');
    });

    expect(customerService.addAddress).not.toHaveBeenCalled();
  });

  it('RN0023: should validate mandatory field - cep with format', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'das Flores' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Centro' },
    });

    // Invalid CEP format
    const cepInput = screen.getByTestId('address-cep-input');
    fireEvent.change(cepInput, { target: { value: '123' } });
    fireEvent.blur(cepInput);

    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-cep-error')).toHaveTextContent('CEP inválido');
    });

    expect(customerService.addAddress).not.toHaveBeenCalled();
  });

  it('RN0023: should validate mandatory field - cidade', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'das Flores' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Centro' },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    const cidadeInput = screen.getByTestId('address-cidade-input');
    fireEvent.change(cidadeInput, { target: { value: '' } });
    fireEvent.blur(cidadeInput);
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-cidade-error')).toHaveTextContent('Cidade obrigatória');
    });

    expect(customerService.addAddress).not.toHaveBeenCalled();
  });

  it('RN0023: should validate mandatory field - estado', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'das Flores' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Centro' },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'São Paulo' },
    });

    // Leave estado empty (default "")
    const estadoSelect = screen.getByTestId('address-estado-select');
    fireEvent.change(estadoSelect, { target: { value: '' } });
    fireEvent.blur(estadoSelect);

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-estado-error')).toHaveTextContent('Estado obrigatório');
    });

    expect(customerService.addAddress).not.toHaveBeenCalled();
  });

  it('RN0023: should accept valid address with all mandatory fields', async () => {
    customerService.addAddress.mockResolvedValue({
      id: 5,
      ...newAddressPayload,
    });

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Fill all mandatory fields correctly
    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: newAddressPayload.logradouro },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: newAddressPayload.numero },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: newAddressPayload.bairro },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: newAddressPayload.cep },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: newAddressPayload.cidade },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: newAddressPayload.estado },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Should successfully call service
    await waitFor(() => {
      expect(customerService.addAddress).toHaveBeenCalledWith(
        expect.objectContaining({
          logradouro: newAddressPayload.logradouro,
          numero: newAddressPayload.numero,
          bairro: newAddressPayload.bairro,
          cep: newAddressPayload.cep,
          cidade: newAddressPayload.cidade,
          estado: newAddressPayload.estado,
        })
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // RF0034/RNF0035: Addresses can be edited independently
  // ────────────────────────────────────────────────────────────────────────

  it('RF0034: should allow editing an existing address without affecting others', async () => {
    const updatedAddress = {
      ...mockAddresses[0],
      apelido: 'Casa Principal',
      numero: '456',
    };

    customerService.updateAddress.mockResolvedValue(updatedAddress);

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
    });

    // Click edit on first address
    fireEvent.click(screen.getByTestId('edit-address-1'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Verify form is in "edit" mode
    expect(screen.getByTestId('address-form-title')).toHaveTextContent('Editar Endereço');

    // Verify pre-filled values
    expect(screen.getByTestId('address-apelido-input')).toHaveValue('Casa');
    expect(screen.getByTestId('address-logradouro-input')).toHaveValue('das Flores');
    expect(screen.getByTestId('address-numero-input')).toHaveValue('123');

    // Change some fields
    fireEvent.change(screen.getByTestId('address-apelido-input'), {
      target: { value: 'Casa Principal' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '456' },
    });

    // Submit
    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Verify update service was called with correct ID
    await waitFor(() => {
      expect(customerService.updateAddress).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          apelido: 'Casa Principal',
          numero: '456',
          logradouro: 'das Flores', // unchanged
        })
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('addresses-success-message')).toHaveTextContent(
        'Endereço atualizado com sucesso!'
      );
    });

    // Verify addresses are refetched
    expect(customerService.getAddresses).toHaveBeenCalledTimes(2);
  });

  it('RF0034: should edit address without requiring re-entry of all customer data', async () => {
    const updatedAddress = {
      ...mockAddresses[1],
      bairro: 'Jardins',
    };

    customerService.updateAddress.mockResolvedValue(updatedAddress);

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-2')).toBeInTheDocument();
    });

    // Edit second address
    fireEvent.click(screen.getByTestId('edit-address-2'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Form should ONLY show address fields, not customer profile fields
    expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();

    // Change just one field
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Jardins' },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Verify only address data is sent, not profile data
    await waitFor(() => {
      expect(customerService.updateAddress).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          bairro: 'Jardins',
          apelido: 'Trabalho',
          logradouro: 'Paulista',
        })
      );
    });

    // Ensure no profile update calls were made
    expect(customerService.updateProfile).not.toBeDefined();
  });

  it('RF0034: should allow deletion of an address', async () => {
    customerService.deleteAddress.mockResolvedValue({ success: true });

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
    });

    // Click delete on first address
    fireEvent.click(screen.getByTestId('delete-address-1'));

    // Confirm deletion dialog appears
    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    });

    expect(screen.getByText(/Tem certeza que deseja remover/i)).toBeInTheDocument();

    // Confirm deletion
    fireEvent.click(screen.getByTestId('delete-confirm-button'));

    // Verify service was called
    await waitFor(() => {
      expect(customerService.deleteAddress).toHaveBeenCalledWith(1);
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('addresses-success-message')).toHaveTextContent(
        'Endereço removido com sucesso'
      );
    });

    // Verify addresses are refetched
    expect(customerService.getAddresses).toHaveBeenCalledTimes(2);
  });

  it('RF0034: should prevent deletion when it would leave zero delivery addresses', async () => {
    // Only one delivery address, one billing
    const minimalAddresses = [
      { ...mockAddresses[0], id: 1, tipoEndereco: 'ENTREGA' },
      { ...mockAddresses[1], id: 2, tipoEndereco: 'FINANCEIRO' },
    ];

    customerService.getAddresses.mockResolvedValue(minimalAddresses);
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
    });

    // Try to delete the only delivery address
    fireEvent.click(screen.getByTestId('delete-address-1'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    });

    // Should show blocking message
    expect(screen.getByTestId('delete-blocked-message')).toHaveTextContent(
      /Não é possível remover este endereço/i
    );
    expect(screen.getByTestId('delete-blocked-message')).toHaveTextContent(/entrega/i);
    expect(screen.getByTestId('delete-blocked-message')).toHaveTextContent(/cobrança/i);

    // Confirm button should NOT be present
    expect(screen.queryByTestId('delete-confirm-button')).not.toBeInTheDocument();
  });

  it('RF0034: should prevent deletion when it would leave zero billing addresses', async () => {
    // One delivery, only one billing address
    const minimalAddresses = [
      { ...mockAddresses[0], id: 1, tipoEndereco: 'ENTREGA' },
      { ...mockAddresses[1], id: 2, tipoEndereco: 'FINANCEIRO' },
    ];

    customerService.getAddresses.mockResolvedValue(minimalAddresses);
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-2')).toBeInTheDocument();
    });

    // Try to delete the only billing address
    fireEvent.click(screen.getByTestId('delete-address-2'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    });

    // Should show blocking message
    expect(screen.getByTestId('delete-blocked-message')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-confirm-button')).not.toBeInTheDocument();
  });

  it('RF0034: should allow deletion of AMBOS address when other typed addresses exist', async () => {
    // Have separate delivery and billing addresses, plus one combined
    const addresses = [
      { ...mockAddresses[0], id: 1, tipoEndereco: 'ENTREGA' },
      { ...mockAddresses[1], id: 2, tipoEndereco: 'FINANCEIRO' },
      { ...mockAddresses[2], id: 3, tipoEndereco: 'AMBOS' },
    ];

    customerService.getAddresses.mockResolvedValue(addresses);
    customerService.deleteAddress.mockResolvedValue({ success: true });

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-3')).toBeInTheDocument();
    });

    // Delete the combined address (should be allowed)
    fireEvent.click(screen.getByTestId('delete-address-3'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    });

    // Should NOT show blocking message (we have separate delivery and billing)
    expect(screen.queryByTestId('delete-blocked-message')).not.toBeInTheDocument();

    // Confirm button SHOULD be present
    expect(screen.getByTestId('delete-confirm-button')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('delete-confirm-button'));

    await waitFor(() => {
      expect(customerService.deleteAddress).toHaveBeenCalledWith(3);
    });
  });

  // ────────────────────────────────────────────────────────────────────────
  // Additional edge cases and UX tests
  // ────────────────────────────────────────────────────────────────────────

  it('should display empty state when no addresses exist', async () => {
    customerService.getAddresses.mockResolvedValue([]);
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-list-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('Nenhum endereço cadastrado.')).toBeInTheDocument();
  });

  it('should display loading state while fetching addresses', () => {
    // Don't resolve immediately
    customerService.getAddresses.mockImplementation(() => new Promise(() => {}));

    renderAddressesPage();

    expect(screen.getByTestId('address-list-loading')).toBeInTheDocument();
    expect(screen.getByText('Carregando endereços...')).toBeInTheDocument();
  });

  it('should handle fetch error gracefully', async () => {
    customerService.getAddresses.mockRejectedValue(new Error('Network error'));

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('addresses-fetch-error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Não foi possível carregar os endereços/i)).toBeInTheDocument();
    expect(screen.getByTestId('addresses-retry-button')).toBeInTheDocument();
  });

  it('should allow retrying after fetch error', async () => {
    customerService.getAddresses.mockRejectedValueOnce(new Error('Network error'));

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('addresses-fetch-error')).toBeInTheDocument();
    });

    // Fix the mock and retry
    customerService.getAddresses.mockResolvedValue(mockAddresses);
    fireEvent.click(screen.getByTestId('addresses-retry-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-list')).toBeInTheDocument();
    });

    expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
  });

  it('should handle add address error', async () => {
    customerService.addAddress.mockRejectedValue(new Error('Server error'));

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Fill and submit
    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    // Error should appear in form
    await waitFor(() => {
      expect(screen.getByTestId('address-form-error')).toHaveTextContent('Server error');
    });

    // Form should stay open
    expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
  });

  it('should close form when cancel is clicked', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('address-form-cancel-button'));

    // Form should close
    await waitFor(() => {
      expect(screen.queryByTestId('address-form-modal')).not.toBeInTheDocument();
    });
  });

  it('should close form when X button is clicked', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('address-form-close'));

    await waitFor(() => {
      expect(screen.queryByTestId('address-form-modal')).not.toBeInTheDocument();
    });
  });

  it('should dismiss success message when X is clicked', async () => {
    customerService.addAddress.mockResolvedValue({
      id: 4,
      ...newAddressPayload,
    });

    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('add-address-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-address-button'));

    await waitFor(() => {
      expect(screen.getByTestId('address-form-modal')).toBeInTheDocument();
    });

    // Fill and submit
    fireEvent.change(screen.getByTestId('address-logradouro-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('address-numero-input'), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByTestId('address-bairro-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('address-cep-input'), {
      target: { value: '12345-678' },
    });
    fireEvent.change(screen.getByTestId('address-cidade-input'), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByTestId('address-estado-select'), {
      target: { value: 'SP' },
    });

    fireEvent.click(screen.getByTestId('address-form-save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('addresses-success-message')).toBeInTheDocument();
    });

    // Close success message
    const closeButton = screen.getByTestId('addresses-success-message').querySelector('.btn-close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('addresses-success-message')).not.toBeInTheDocument();
    });
  });

  it('should cancel deletion when cancel button is clicked', async () => {
    renderAddressesPage();

    await waitFor(() => {
      expect(screen.getByTestId('address-card-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-address-1'));

    await waitFor(() => {
      expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-cancel-button'));

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument();
    });

    // Service should not have been called
    expect(customerService.deleteAddress).not.toHaveBeenCalled();
  });
});
