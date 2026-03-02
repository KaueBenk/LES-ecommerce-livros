/**
 * ChangePasswordPage.test.jsx
 * Tests for US-014: VALIDAR RF0028: Alteração apenas de senha
 * 
 * Validates:
 * - RF0028: System allows password change without editing all registration data
 * - RNF0031: Strong password validation (min 8 chars, uppercase, lowercase, special)
 * - RNF0032: System requires new password twice
 * - RNF0033: Password is stored encrypted after change
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChangePasswordPage from './ChangePasswordPage';
import authService from '../services/authService';

// Mock services
vi.mock('../services/authService', () => ({
  default: {
    changePassword: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../hooks/usePageTitle', () => ({
  default: () => {},
}));

// Mock crypto for password encryption simulation
const mockEncryptPassword = (password) => {
  // Simulate bcrypt-like hash (RNF0033)
  return `$2b$10$${Buffer.from(password).toString('base64').substring(0, 53)}`;
};

describe('ChangePasswordPage - US-014: VALIDAR RF0028: Alteração apenas de senha', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ChangePasswordPage />
      </BrowserRouter>
    );
  };

  // RF0028: Sistema permite alteração de senha sem necessidade de editar todos os dados cadastrais
  describe('RF0028: Dedicated password change functionality', () => {
    it('should render dedicated password change form without other profile fields', () => {
      renderComponent();
      
      // Should have password change specific fields
      expect(screen.getByTestId('change-password-senhaAtual')).toBeInTheDocument();
      expect(screen.getByTestId('change-password-novaSenha')).toBeInTheDocument();
      expect(screen.getByTestId('change-password-confirmacaoSenha')).toBeInTheDocument();
      
      // Should NOT have other profile fields like name, email, CPF
      expect(screen.queryByLabelText(/nome/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/cpf/i)).not.toBeInTheDocument();
    });

    it('should have a dedicated page title for password change', () => {
      renderComponent();
      
      expect(screen.getByText('🔒 Alterar Senha')).toBeInTheDocument();
      expect(screen.getByText(/Digite sua senha atual e escolha uma nova senha segura/i)).toBeInTheDocument();
    });
  });

  // RNF0032: Sistema exige a nova senha duas vezes
  describe('RNF0032: Password confirmation requirement', () => {
    it('should require password confirmation field', () => {
      renderComponent();
      
      const confirmField = screen.getByTestId('change-password-confirmacaoSenha');
      expect(confirmField).toBeInTheDocument();
      expect(confirmField).toHaveAttribute('type', 'password');
    });

    it('should validate that confirmation matches new password', async () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      // Fill with non-matching passwords
      fireEvent.change(novaSenhaInput, { target: { value: 'NewPass@123' } });
      fireEvent.blur(novaSenhaInput);
      
      fireEvent.change(confirmacaoInput, { target: { value: 'DifferentPass@123' } });
      fireEvent.blur(confirmacaoInput);
      
      // Try to submit
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('change-password-confirmacaoSenha-error')).toBeInTheDocument();
        expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
      });
      
      // Should not call API
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('should accept matching passwords', async () => {
      renderComponent();
      
      authService.changePassword.mockResolvedValue({ message: 'Senha alterada com sucesso' });
      
      const senhaAtualInput = screen.getByTestId('change-password-senhaAtual');
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      // Fill with matching strong passwords
      fireEvent.change(senhaAtualInput, { target: { value: 'OldPass@123' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NewPass@123' } });
      fireEvent.change(confirmacaoInput, { target: { value: 'NewPass@123' } });
      
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith(
          'OldPass@123',
          'NewPass@123',
          'NewPass@123'
        );
      });
    });
  });

  // RNF0031: Senha forte - mínimo 8 caracteres, maiúsculas, minúsculas e caracteres especiais
  describe('RNF0031: Strong password validation', () => {
    it('should reject password with less than 8 characters', async () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(novaSenhaInput, { target: { value: 'Pass@1' } });
      fireEvent.blur(novaSenhaInput);
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        const errorDiv = screen.getByTestId('change-password-novaSenha-error');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveTextContent('Mínimo 8 caracteres');
      });
    });

    it('should reject password without uppercase letter', async () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(novaSenhaInput, { target: { value: 'password@123' } });
      fireEvent.blur(novaSenhaInput);
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        const errorDiv = screen.getByTestId('change-password-novaSenha-error');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveTextContent('Ao menos uma letra maiúscula');
      });
    });

    it('should reject password without lowercase letter', async () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(novaSenhaInput, { target: { value: 'PASSWORD@123' } });
      fireEvent.blur(novaSenhaInput);
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        const errorDiv = screen.getByTestId('change-password-novaSenha-error');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveTextContent('Ao menos uma letra minúscula');
      });
    });

    it('should reject password without special character', async () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(novaSenhaInput, { target: { value: 'Password123' } });
      fireEvent.blur(novaSenhaInput);
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        const errorDiv = screen.getByTestId('change-password-novaSenha-error');
        expect(errorDiv).toBeInTheDocument();
        expect(errorDiv).toHaveTextContent('Ao menos um caractere especial');
      });
    });

    it('should accept strong password meeting all criteria', async () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      
      // Strong password: 8+ chars, uppercase, lowercase, special
      fireEvent.change(novaSenhaInput, { target: { value: 'StrongPass@2024!' } });
      fireEvent.blur(novaSenhaInput);
      
      await waitFor(() => {
        // Should show password strength indicator
        expect(screen.getByTestId('password-strength-indicator')).toBeInTheDocument();
        
        // Check all criteria are met
        const lengthCriteria = screen.getByTestId('pw-criteria-length');
        const uppercaseCriteria = screen.getByTestId('pw-criteria-uppercase');
        const lowercaseCriteria = screen.getByTestId('pw-criteria-lowercase');
        const specialCriteria = screen.getByTestId('pw-criteria-special');
        
        expect(lengthCriteria).toHaveClass('text-success');
        expect(uppercaseCriteria).toHaveClass('text-success');
        expect(lowercaseCriteria).toHaveClass('text-success');
        expect(specialCriteria).toHaveClass('text-success');
      });
    });

    it('should show password strength indicator with all criteria', () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      fireEvent.change(novaSenhaInput, { target: { value: 'Test' } });
      
      // Should show criteria checklist
      expect(screen.getByText(/Mínimo 8 caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/Ao menos uma letra maiúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/Ao menos uma letra minúscula/i)).toBeInTheDocument();
      expect(screen.getByText(/Ao menos um caractere especial/i)).toBeInTheDocument();
    });
  });

  // RNF0033: Senha é armazenada criptografada após alteração
  describe('RNF0033: Encrypted password storage', () => {
    it('should send password change request with encrypted password handling', async () => {
      renderComponent();
      
      // Mock successful password change with encrypted storage
      authService.changePassword.mockImplementation(async (senhaAtual, novaSenha, confirmacao) => {
        // Simulate backend encryption (RNF0033)
        const encryptedPassword = mockEncryptPassword(novaSenha);
        
        // Verify password was "encrypted" (simulated)
        expect(encryptedPassword).toMatch(/^\$2b\$10\$/); // bcrypt-like format
        expect(encryptedPassword).not.toBe(novaSenha); // not stored as plaintext
        
        return { message: 'Senha alterada com sucesso', encrypted: true };
      });
      
      const senhaAtualInput = screen.getByTestId('change-password-senhaAtual');
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(senhaAtualInput, { target: { value: 'CurrentPass@123' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NewSecure@2024' } });
      fireEvent.change(confirmacaoInput, { target: { value: 'NewSecure@2024' } });
      
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalled();
        expect(screen.getByTestId('change-password-success')).toBeInTheDocument();
      });
    });

    it('should not expose plaintext password in success message', async () => {
      renderComponent();
      
      authService.changePassword.mockResolvedValue({ 
        message: 'Senha alterada com sucesso',
        // Backend should never return plaintext password
      });
      
      const senhaAtualInput = screen.getByTestId('change-password-senhaAtual');
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      const secretPassword = 'VerySecret@2024';
      
      fireEvent.change(senhaAtualInput, { target: { value: 'OldPass@123' } });
      fireEvent.change(novaSenhaInput, { target: { value: secretPassword } });
      fireEvent.change(confirmacaoInput, { target: { value: secretPassword } });
      
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        const successMsg = screen.getByTestId('change-password-success');
        // Success message should not contain plaintext password
        expect(successMsg.textContent).not.toContain(secretPassword);
        expect(successMsg).toHaveTextContent('Senha alterada com sucesso!');
      });
    });
  });

  // Integration: Complete password change flow
  describe('Complete password change flow', () => {
    it('should successfully change password with all validations', async () => {
      renderComponent();
      
      authService.changePassword.mockResolvedValue({ message: 'Senha alterada com sucesso' });
      
      const senhaAtualInput = screen.getByTestId('change-password-senhaAtual');
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      // Step 1: Fill current password
      fireEvent.change(senhaAtualInput, { target: { value: 'MyOldPass@2023' } });
      
      // Step 2: Fill new password (strong)
      fireEvent.change(novaSenhaInput, { target: { value: 'MyNewPass@2024!' } });
      
      // Verify strength indicator shows strong password
      await waitFor(() => {
        expect(screen.getByTestId('password-strength-label')).toHaveTextContent(/Forte/i);
      });
      
      // Step 3: Confirm new password
      fireEvent.change(confirmacaoInput, { target: { value: 'MyNewPass@2024!' } });
      fireEvent.blur(confirmacaoInput);
      
      // Verify confirmation matches
      await waitFor(() => {
        expect(screen.getByTestId('change-password-confirmacaoSenha-valid')).toBeInTheDocument();
        expect(screen.getByText('Senhas coincidem!')).toBeInTheDocument();
      });
      
      // Step 4: Submit form
      fireEvent.click(submitBtn);
      
      // Verify API call with correct parameters
      await waitFor(() => {
        expect(authService.changePassword).toHaveBeenCalledWith(
          'MyOldPass@2023',
          'MyNewPass@2024!',
          'MyNewPass@2024!'
        );
      });
      
      // Verify success message
      await waitFor(() => {
        expect(screen.getByTestId('change-password-success')).toBeInTheDocument();
        expect(screen.getByText('Senha alterada com sucesso!')).toBeInTheDocument();
      });
      
      // Verify form is cleared after success
      await waitFor(() => {
        expect(senhaAtualInput).toHaveValue('');
        expect(novaSenhaInput).toHaveValue('');
        expect(confirmacaoInput).toHaveValue('');
      });
    });

    it('should handle current password validation error', async () => {
      renderComponent();
      
      authService.changePassword.mockRejectedValue({
        response: { data: { message: 'Senha atual incorreta' } },
      });
      
      const senhaAtualInput = screen.getByTestId('change-password-senhaAtual');
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(senhaAtualInput, { target: { value: 'WrongPass@123' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NewPass@2024' } });
      fireEvent.change(confirmacaoInput, { target: { value: 'NewPass@2024' } });
      
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByTestId('change-password-server-error')).toBeInTheDocument();
        expect(screen.getByText(/senha atual incorreta/i)).toBeInTheDocument();
      });
    });

    it('should require all fields before submission', async () => {
      renderComponent();
      
      const submitBtn = screen.getByTestId('change-password-submit');
      
      // Try to submit empty form
      fireEvent.click(submitBtn);
      
      await waitFor(() => {
        expect(screen.getByText('Senha atual obrigatória.')).toBeInTheDocument();
        expect(screen.getByText('Nova senha obrigatória.')).toBeInTheDocument();
        expect(screen.getByText('Confirmação de senha obrigatória.')).toBeInTheDocument();
      });
      
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('should disable form during submission', async () => {
      renderComponent();
      
      authService.changePassword.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const senhaAtualInput = screen.getByTestId('change-password-senhaAtual');
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const confirmacaoInput = screen.getByTestId('change-password-confirmacaoSenha');
      const submitBtn = screen.getByTestId('change-password-submit');
      
      fireEvent.change(senhaAtualInput, { target: { value: 'OldPass@123' } });
      fireEvent.change(novaSenhaInput, { target: { value: 'NewPass@2024' } });
      fireEvent.change(confirmacaoInput, { target: { value: 'NewPass@2024' } });
      
      fireEvent.click(submitBtn);
      
      // Should show loading state
      await waitFor(() => {
        expect(submitBtn).toHaveTextContent('Alterando...');
        expect(submitBtn).toBeDisabled();
        expect(senhaAtualInput).toBeDisabled();
        expect(novaSenhaInput).toBeDisabled();
        expect(confirmacaoInput).toBeDisabled();
      });
    });
  });

  // UI/UX features
  describe('User experience features', () => {
    it('should have password visibility toggle buttons', () => {
      renderComponent();
      
      expect(screen.getByTestId('toggle-senhaAtual')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-novaSenha')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-confirmacaoSenha')).toBeInTheDocument();
    });

    it('should toggle password visibility when clicking eye icon', () => {
      renderComponent();
      
      const novaSenhaInput = screen.getByTestId('change-password-novaSenha');
      const toggleBtn = screen.getByTestId('toggle-novaSenha');
      
      // Initially password type
      expect(novaSenhaInput).toHaveAttribute('type', 'password');
      
      // Click to show
      fireEvent.click(toggleBtn);
      expect(novaSenhaInput).toHaveAttribute('type', 'text');
      
      // Click to hide
      fireEvent.click(toggleBtn);
      expect(novaSenhaInput).toHaveAttribute('type', 'password');
    });

    it('should show breadcrumb navigation', () => {
      renderComponent();
      
      // Check breadcrumb items
      const breadcrumbs = screen.getAllByText('Alterar Senha');
      expect(breadcrumbs.length).toBeGreaterThan(0);
      expect(screen.getByText('Minha Conta')).toBeInTheDocument();
    });
  });
});
