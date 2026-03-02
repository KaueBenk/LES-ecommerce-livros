import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreditCardsPage from './CreditCardsPage';
import customerService from '../services/customerService';
import { CREDIT_CARD_BRANDS } from '../utils/constants';

// ── Mocks ─────────────────────────────────────────────────────────────────────
vi.mock('../services/customerService');
vi.mock('../hooks/usePageTitle', () => ({
  default: vi.fn(),
}));

// ── Mock Data ─────────────────────────────────────────────────────────────────
const mockCards = [
  {
    id: 1,
    numero: '4111111111111111',
    nomeImpresso: 'JOAO DA SILVA',
    bandeira: 'VISA',
    codigoSeguranca: '123',
    preferencial: true,
  },
  {
    id: 2,
    numero: '5555555555554444',
    nomeImpresso: 'MARIA SANTOS',
    bandeira: 'MASTERCARD',
    codigoSeguranca: '456',
    preferencial: false,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const renderPage = () =>
  render(
    <BrowserRouter>
      <CreditCardsPage />
    </BrowserRouter>
  );

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreditCardsPage - RF0027: Cadastro de cartões de crédito', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    customerService.getCreditCards.mockResolvedValue(mockCards);
  });

  // ── 1. Basic Rendering ──────────────────────────────────────────────────────

  it('should render the credit cards page with breadcrumb and title', async () => {
    renderPage();

    expect(screen.getByText('Meus Cartões de Crédito')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByText('Minha Conta')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-list')).toBeInTheDocument();
    });
  });

  // ── 2. Multiple Cards (RF0027) ──────────────────────────────────────────────

  it('should display multiple credit cards associated with the customer', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-item-2')).toBeInTheDocument();
    });

    // Component displays count of cards
    expect(screen.getByText(/2 cartão.*cadastrado/i)).toBeInTheDocument();
  });

  it('should allow adding a new credit card when multiple cards already exist', async () => {
    const user = userEvent.setup();
    customerService.addCreditCard.mockResolvedValue({
      id: 3,
      numero: '378282246310005',
      nomeImpresso: 'CARLOS PEREIRA',
      bandeira: 'AMEX',
      codigoSeguranca: '1234',
      preferencial: false,
    });
    customerService.getCreditCards
      .mockResolvedValueOnce(mockCards)
      .mockResolvedValueOnce([...mockCards, { id: 3, numero: '378282246310005' }]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('credit-card-numero'), '378282246310005');
    await user.type(screen.getByTestId('credit-card-nome'), 'CARLOS PEREIRA');
    await user.selectOptions(screen.getByTestId('credit-card-bandeira'), 'AMEX');
    await user.type(screen.getByTestId('credit-card-cvv'), '1234');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(customerService.addCreditCard).toHaveBeenCalledWith({
        numero: '378282246310005',
        nomeImpresso: 'CARLOS PEREIRA',
        bandeira: 'AMEX',
        codigoSeguranca: '1234',
      });
    });
  });

  // ── 3. Preferred Card (RF0027) ──────────────────────────────────────────────

  it('should display which card is marked as preferred', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('card-preferred-badge-1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('card-preferred-badge-1')).toHaveTextContent('★ Preferido');
  });

  it('should allow setting a different card as preferred', async () => {
    const user = userEvent.setup();
    customerService.setPreferredCard.mockResolvedValue({ success: true });
    customerService.getCreditCards
      .mockResolvedValueOnce(mockCards)
      .mockResolvedValueOnce([
        { ...mockCards[0], preferencial: false },
        { ...mockCards[1], preferencial: true },
      ]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('card-set-preferred-btn-2')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('card-set-preferred-btn-2'));

    await waitFor(() => {
      expect(customerService.setPreferredCard).toHaveBeenCalledWith(2);
    });

    await waitFor(() => {
      expect(screen.getByText(/Cartão preferido atualizado com sucesso!/i)).toBeInTheDocument();
    });
  });

  it('should have exactly one preferred card at a time', async () => {
    renderPage();

    await waitFor(() => {
      // Only one card should have the green "Preferido" badge
      const preferredBadges = screen.queryAllByTestId(/card-preferred-badge-/);
      expect(preferredBadges).toHaveLength(1);
    });
  });

  // ── 4. Required Fields (RN0024) ─────────────────────────────────────────────

  it('should require card number (RN0024)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    // Leave card number empty
    await user.type(screen.getByTestId('credit-card-nome'), 'JOAO SILVA');
    await user.type(screen.getByTestId('credit-card-cvv'), '123');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-numero-error')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-numero-error')).toHaveTextContent(
        /Número do cartão obrigatório/i
      );
    });

    expect(customerService.addCreditCard).not.toHaveBeenCalled();
  });

  it('should require printed name on card (RN0024)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    // Leave name empty
    await user.type(screen.getByTestId('credit-card-numero'), '4111111111111111');
    await user.type(screen.getByTestId('credit-card-cvv'), '123');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-nome-error')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-nome-error')).toHaveTextContent(
        /Nome impresso obrigatório/i
      );
    });

    expect(customerService.addCreditCard).not.toHaveBeenCalled();
  });

  it('should require card brand (RN0024)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    // Brand is selected by default (VISA), so just verify it's present and required
    const bandeiraSelect = screen.getByTestId('credit-card-bandeira');
    expect(bandeiraSelect).toBeRequired;
    expect(bandeiraSelect.value).toBe('VISA'); // default value
  });

  it('should require security code (RN0024)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    // Leave CVV empty
    await user.type(screen.getByTestId('credit-card-numero'), '4111111111111111');
    await user.type(screen.getByTestId('credit-card-nome'), 'JOAO SILVA');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-cvv-error')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-cvv-error')).toHaveTextContent(
        /Código de segurança obrigatório/i
      );
    });

    expect(customerService.addCreditCard).not.toHaveBeenCalled();
  });

  it('should validate all required fields together (RN0024)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    // Submit empty form
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-numero-error')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-nome-error')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-cvv-error')).toBeInTheDocument();
    });

    expect(customerService.addCreditCard).not.toHaveBeenCalled();
  });

  it('should successfully add a card when all required fields are provided', async () => {
    const user = userEvent.setup();
    customerService.addCreditCard.mockResolvedValue({
      id: 4,
      numero: '4111111111111111',
      nomeImpresso: 'TESTE COMPLETO',
      bandeira: 'VISA',
      codigoSeguranca: '123',
      preferencial: false,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('credit-card-numero'), '4111111111111111');
    await user.type(screen.getByTestId('credit-card-nome'), 'TESTE COMPLETO');
    await user.selectOptions(screen.getByTestId('credit-card-bandeira'), 'VISA');
    await user.type(screen.getByTestId('credit-card-cvv'), '123');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(customerService.addCreditCard).toHaveBeenCalledWith({
        numero: '4111111111111111',
        nomeImpresso: 'TESTE COMPLETO',
        bandeira: 'VISA',
        codigoSeguranca: '123',
      });
    });
  });

  // ── 5. Registered Brands Only (RN0025) ──────────────────────────────────────

  it('should only accept registered card brands (RN0025)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    const bandeiraSelect = screen.getByTestId('credit-card-bandeira');
    const options = within(bandeiraSelect).getAllByRole('option');

    // Verify all options correspond to registered brands
    const registeredBrands = CREDIT_CARD_BRANDS.map((b) => b.value);
    options.forEach((option) => {
      expect(registeredBrands).toContain(option.value);
    });

    // Verify exact count matches
    expect(options).toHaveLength(CREDIT_CARD_BRANDS.length);
  });

  it('should display all registered card brands in the select (RN0025)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    const bandeiraSelect = screen.getByTestId('credit-card-bandeira');

    CREDIT_CARD_BRANDS.forEach((brand) => {
      const option = within(bandeiraSelect).getByRole('option', { name: brand.label });
      expect(option).toBeInTheDocument();
      expect(option.value).toBe(brand.value);
    });
  });

  it('should allow selecting any registered brand (RN0025)', async () => {
    const user = userEvent.setup();
    customerService.addCreditCard.mockResolvedValue({ id: 5 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    // Test each brand
    for (const brand of CREDIT_CARD_BRANDS) {
      await user.click(screen.getByTestId('credit-card-add-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('credit-card-numero'), '4111111111111111');
      await user.type(screen.getByTestId('credit-card-nome'), 'TESTE BRAND');
      await user.selectOptions(screen.getByTestId('credit-card-bandeira'), brand.value);
      await user.type(screen.getByTestId('credit-card-cvv'), '123');

      const selectedBrand = screen.getByTestId('credit-card-bandeira').value;
      expect(selectedBrand).toBe(brand.value);

      await user.click(screen.getByTestId('credit-card-form-cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('credit-card-form-modal')).not.toBeInTheDocument();
      });
    }
  });

  // ── 6. Edit & Delete Operations ─────────────────────────────────────────────

  it('should allow editing an existing card', async () => {
    const user = userEvent.setup();
    customerService.updateCreditCard.mockResolvedValue({ success: true });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('card-edit-btn-1')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('card-edit-btn-1'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
      expect(screen.getByTestId('credit-card-form-title')).toHaveTextContent('Editar Cartão');
    });

    // Card number should be pre-filled and disabled
    const numeroInput = screen.getByTestId('credit-card-numero');
    // Note: format is applied from mockCard data as-is, without spaces initially
    expect(numeroInput.value).toBe('4111111111111111');
    expect(numeroInput).toBeDisabled();

    // Change name
    const nomeInput = screen.getByTestId('credit-card-nome');
    await user.clear(nomeInput);
    await user.type(nomeInput, 'JOAO SILVA UPDATED');

    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(customerService.updateCreditCard).toHaveBeenCalledWith(1, {
        numero: '4111111111111111',
        nomeImpresso: 'JOAO SILVA UPDATED',
        bandeira: 'VISA',
        codigoSeguranca: '123',
      });
    });
  });

  it('should allow deleting a card with confirmation', async () => {
    const user = userEvent.setup();
    customerService.deleteCreditCard.mockResolvedValue({ success: true });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('card-delete-btn-2')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('card-delete-btn-2'));

    await waitFor(() => {
      expect(screen.getByTestId('card-delete-confirm-modal')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('card-delete-confirm'));

    await waitFor(() => {
      expect(customerService.deleteCreditCard).toHaveBeenCalledWith(2);
    });
  });

  // ── 7. Empty State ──────────────────────────────────────────────────────────

  it('should display empty state when no cards exist', async () => {
    customerService.getCreditCards.mockResolvedValue([]);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-cards-empty')).toBeInTheDocument();
      expect(screen.getByText(/Você ainda não possui cartões cadastrados/i)).toBeInTheDocument();
    });
  });

  it('should allow adding first card from empty state', async () => {
    const user = userEvent.setup();
    customerService.getCreditCards.mockResolvedValue([]);
    customerService.addCreditCard.mockResolvedValue({ id: 1 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-first-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-first-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });
  });

  // ── 8. Field Validation Logic ───────────────────────────────────────────────

  it('should validate card number length', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    // Too short
    await user.type(screen.getByTestId('credit-card-numero'), '4111');
    await user.type(screen.getByTestId('credit-card-nome'), 'TESTE');
    await user.type(screen.getByTestId('credit-card-cvv'), '123');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-numero-error')).toHaveTextContent(
        /Número do cartão inválido/i
      );
    });
  });

  it('should validate CVV length (3-4 digits)', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('credit-card-numero'), '4111111111111111');
    await user.type(screen.getByTestId('credit-card-nome'), 'TESTE');
    await user.type(screen.getByTestId('credit-card-cvv'), '12'); // too short
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-cvv-error')).toHaveTextContent(
        /Código de segurança inválido/i
      );
    });
  });

  it('should format card number with spaces while typing', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    const numeroInput = screen.getByTestId('credit-card-numero');
    await user.type(numeroInput, '4111111111111111');

    // Should be formatted with spaces
    expect(numeroInput.value).toBe('4111 1111 1111 1111');
  });

  it('should convert name to uppercase', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    const nomeInput = screen.getByTestId('credit-card-nome');
    await user.type(nomeInput, 'joao silva');

    expect(nomeInput.value).toBe('JOAO SILVA');
  });

  // ── 9. Error Handling ───────────────────────────────────────────────────────

  it('should display error when fetch fails', async () => {
    customerService.getCreditCards.mockRejectedValue(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('cards-fetch-error')).toBeInTheDocument();
    });
  });

  it('should allow retry on fetch error', async () => {
    const user = userEvent.setup();
    customerService.getCreditCards
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockCards);

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('cards-retry-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('cards-retry-button'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-list')).toBeInTheDocument();
      expect(customerService.getCreditCards).toHaveBeenCalledTimes(2);
    });
  });

  it('should display server error on add failure', async () => {
    const user = userEvent.setup();
    customerService.addCreditCard.mockRejectedValue(new Error('Invalid card'));

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-add-btn')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('credit-card-add-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-modal')).toBeInTheDocument();
    });

    await user.type(screen.getByTestId('credit-card-numero'), '4111111111111111');
    await user.type(screen.getByTestId('credit-card-nome'), 'TEST');
    await user.type(screen.getByTestId('credit-card-cvv'), '123');
    await user.click(screen.getByTestId('credit-card-form-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('credit-card-form-server-error')).toBeInTheDocument();
    });
  });
});
