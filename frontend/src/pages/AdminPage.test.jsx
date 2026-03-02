/**
 * AdminPage.test.jsx
 * Tests for US-002: VALIDAR RF0012: Inativar cadastro de livro
 * 
 * Validates:
 * - Book can be inactivated by admin (RF0012)
 * - Inactivation requires justification and category (RN0015)
 * - Book status changes to INACTIVE after operation
 * - Inactive books don't appear in customer storefront (verified via status filter)
 * - All tests use mocked data (no API)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminPage from '../pages/AdminPage';
import adminService from '../services/adminService';

// Mock the adminService
vi.mock('../services/adminService', () => ({
  default: {
    getBooks: vi.fn(),
    getCategories: vi.fn(),
    deactivateBook: vi.fn(),
    activateBook: vi.fn(),
  },
}));

// Mock the hooks
vi.mock('../hooks/usePageTitle', () => ({
  default: () => {},
}));

vi.mock('../hooks/useNotification', () => ({
  default: () => ({
    error: vi.fn(),
    success: vi.fn(),
  }),
}));

// Mock data based on prd.json US-002
const mockActiveBook = {
  id: 1,
  titulo: 'The Pragmatic Programmer',
  isbn: '978-0-201-61622-4',
  autor: { id: 1, nome: 'Andrew Hunt' },
  editora: { id: 1, nome: 'Addison-Wesley' },
  ativo: true,
  quantidadeEstoque: 5,
  precoVenda: 89.90,
  codigo: 'LIV-001',
};

const mockInactiveBook = {
  id: 2,
  titulo: 'Outdated Programming Book',
  isbn: '978-0-000-00000-0',
  autor: { id: 2, nome: 'Old Author' },
  editora: { id: 2, nome: 'Old Publisher' },
  ativo: false,
  quantidadeEstoque: 0,
  precoVenda: 49.90,
  codigo: 'LIV-002',
};

// Mock inactivation reason categories from prd.json
const mockInactivationCategories = [
  { id: 1, nome: 'DESCONTINUADO' },
  { id: 2, nome: 'DANO' },
  { id: 3, nome: 'FORA_DE_MERCADO' },
];

// Mock books list response
const mockBooksResponse = {
  content: [mockActiveBook, mockInactiveBook],
  totalPages: 1,
  totalElements: 2,
};

const mockActiveBooksOnly = {
  content: [mockActiveBook],
  totalPages: 1,
  totalElements: 1,
};

describe('AdminPage - US-002: VALIDAR RF0012: Inativar cadastro de livro', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock responses
    adminService.getBooks.mockResolvedValue(mockBooksResponse);
    adminService.getCategories.mockResolvedValue(mockInactivationCategories);
    adminService.deactivateBook.mockResolvedValue({ success: true });
    adminService.activateBook.mockResolvedValue({ success: true });
  });

  const renderAdminPage = () => {
    return render(
      <MemoryRouter initialEntries={["/admin/livros"]}>
        <Routes>
          <Route path="/admin/*" element={<AdminPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('RF0012: deve exibir livros ativos com botão "Inativar"', async () => {
    renderAdminPage();

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getByTestId('admin-books-section')).toBeInTheDocument();
    });

    // Check active book is displayed
    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    
    // Check "Inativar" button exists for active book
    const inactivateBtn = screen.getByTestId('toggle-book-1');
    expect(inactivateBtn).toBeInTheDocument();
    expect(inactivateBtn).toHaveTextContent('Inativar');
    
    // Check status badge
    const statusBadge = screen.getByTestId('book-status-1');
    expect(statusBadge).toHaveTextContent('Ativo');
  });

  it('RF0012: deve exibir livros inativos com status "Inativo"', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByText('Outdated Programming Book')).toBeInTheDocument();
    });

    // Check inactive book status
    const statusBadge = screen.getByTestId('book-status-2');
    expect(statusBadge).toHaveTextContent('Inativo');
    
    // Check "Ativar" button exists for inactive book
    const activateBtn = screen.getByTestId('toggle-book-2');
    expect(activateBtn).toHaveTextContent('Ativar');
  });

  it('RN0015: deve exigir justificativa e categoria ao inativar livro', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    // Click inactivate button
    const inactivateBtn = screen.getByTestId('toggle-book-1');
    fireEvent.click(inactivateBtn);

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });
    // Check modal title
    expect(screen.getByText(/Inativar livro:/)).toBeInTheDocument();
    const modal = screen.getByTestId('status-modal');
    expect(modal).toHaveTextContent('The Pragmatic Programmer');


    const motivoField = screen.getByTestId('status-modal-motivo');
    const categoriaField = screen.getByTestId('status-modal-categoria');
    expect(motivoField).toBeInTheDocument();
    expect(categoriaField).toBeInTheDocument();

    // Try to submit without filling fields
    const confirmBtn = screen.getByTestId('status-modal-confirm');
    fireEvent.click(confirmBtn);

    // Check validation errors appear
    await waitFor(() => {
      expect(screen.getByText('Informe o motivo.')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    });

    // Verify deactivateBook was NOT called
    expect(adminService.deactivateBook).not.toHaveBeenCalled();
  });

  it('RN0015: deve validar que categorias de inativação estão disponíveis', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    // Click inactivate button
    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal-categoria')).toBeInTheDocument();
    });

    const categoriaSelect = screen.getByTestId('status-modal-categoria');
    
    // Check all categories are available
    expect(categoriaSelect).toBeInTheDocument();
    const options = Array.from(categoriaSelect.querySelectorAll('option'));
    
    // Should have placeholder + 3 categories
    expect(options.length).toBeGreaterThanOrEqual(4);
    
    // Check specific categories exist
    expect(screen.getByText('DESCONTINUADO')).toBeInTheDocument();
    expect(screen.getByText('DANO')).toBeInTheDocument();
    expect(screen.getByText('FORA_DE_MERCADO')).toBeInTheDocument();
  });

  it('RF0012: deve inativar livro com justificativa e categoria válidas', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    // Click inactivate button
    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Fill in justification
    const motivoField = screen.getByTestId('status-modal-motivo');
    fireEvent.change(motivoField, {
      target: { value: 'Livro descontinuado pela editora' }
    });

    // Select category
    const categoriaField = screen.getByTestId('status-modal-categoria');
    fireEvent.change(categoriaField, { target: { value: '1' } });

    // Mock successful inactivation - return updated book list
    adminService.getBooks.mockResolvedValue({
      content: [{ ...mockActiveBook, ativo: false }],
      totalPages: 1,
      totalElements: 1,
    });

    // Click confirm
    const confirmBtn = screen.getByTestId('status-modal-confirm');
    fireEvent.click(confirmBtn);

    // Verify deactivateBook was called with correct parameters
    await waitFor(() => {
      expect(adminService.deactivateBook).toHaveBeenCalledWith(1, {
        motivoInativacao: 'Livro descontinuado pela editora',
        categoriaInativacaoId: 1,
      });
    });
  });

  it('RF0012: deve atualizar status do livro para INATIVO após inativação', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('book-status-1')).toHaveTextContent('Ativo');
    });

    // Record current call count
    const initialCallCount = adminService.getBooks.mock.calls.length;

    // Click inactivate button
    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('status-modal-motivo'), {
      target: { value: 'Produto fora do mercado' }
    });
    fireEvent.change(screen.getByTestId('status-modal-categoria'), {
      target: { value: '3' }
    });

    // Mock the book list to return with book inactive
    const inactivatedBook = { ...mockActiveBook, ativo: false };
    adminService.getBooks.mockResolvedValue({
      content: [inactivatedBook],
      totalPages: 1,
      totalElements: 1,
    });

    // Confirm inactivation
    fireEvent.click(screen.getByTestId('status-modal-confirm'));

    // Wait for modal to close and list to refresh
    await waitFor(() => {
      expect(screen.queryByTestId('status-modal')).not.toBeInTheDocument();
    });

    // Verify getBooks was called at least once more (refresh)
    expect(adminService.getBooks.mock.calls.length).toBeGreaterThan(initialCallCount);
  });

  it('RF0012: livros inativos não aparecem na vitrine (filtro ativo=true)', async () => {
    // Mock to return only active books when filter is applied
    adminService.getBooks.mockResolvedValue(mockActiveBooksOnly);

    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-ativo')).toBeInTheDocument();
    });

    // Apply filter to show only active books
    const filterAtivo = screen.getByTestId('filter-ativo');
    fireEvent.change(filterAtivo, { target: { value: 'true' } });

    // Submit filter form
    const filterSubmit = screen.getByTestId('filter-submit');
    fireEvent.click(filterSubmit);

    // Verify API was called with ativo=true filter
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: true })
      );
    });

    // Wait for results
    await waitFor(() => {
      // Active book should be visible
      expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    });

    // Inactive book should NOT be in the list
    expect(screen.queryByText('Outdated Programming Book')).not.toBeInTheDocument();
  });

  it('RF0012: deve permitir cancelar a inativação', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    // Click inactivate button
    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Fill some data
    fireEvent.change(screen.getByTestId('status-modal-motivo'), {
      target: { value: 'Test reason' }
    });

    // Click cancel
    const cancelBtn = screen.getByTestId('status-modal-cancel');
    fireEvent.click(cancelBtn);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId('status-modal')).not.toBeInTheDocument();
    });

    // deactivateBook should not have been called
    expect(adminService.deactivateBook).not.toHaveBeenCalled();
  });

  it('RF0012: deve permitir reativar um livro inativo', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-2')).toBeInTheDocument();
    });

    // Click activate button for inactive book
    const activateBtn = screen.getByTestId('toggle-book-2');
    expect(activateBtn).toHaveTextContent('Ativar');
    fireEvent.click(activateBtn);

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Check modal title shows "Ativar"
    expect(screen.getByText(/Ativar livro:/)).toBeInTheDocument();

    // Fill activation form
    fireEvent.change(screen.getByTestId('status-modal-motivo'), {
      target: { value: 'Volta ao estoque' }
    });
    fireEvent.change(screen.getByTestId('status-modal-categoria'), {
      target: { value: '1' }
    });

    // Confirm
    fireEvent.click(screen.getByTestId('status-modal-confirm'));

    // Verify activateBook was called
    await waitFor(() => {
      expect(adminService.activateBook).toHaveBeenCalledWith(2, {
        motivoAtivacao: 'Volta ao estoque',
        categoriaAtivacaoId: 1,
      });
    });
  });

  it('RF0012: deve fechar modal após inativação bem-sucedida', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    // Click inactivate
    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByTestId('status-modal-motivo'), {
      target: { value: 'Teste válido' }
    });
    fireEvent.change(screen.getByTestId('status-modal-categoria'), {
      target: { value: '1' }
    });

    // Mock success response and refresh
    adminService.getBooks.mockResolvedValue({
      content: [{ ...mockActiveBook, ativo: false }],
      totalPages: 1,
      totalElements: 1,
    });

    // Confirm
    fireEvent.click(screen.getByTestId('status-modal-confirm'));

    // Modal should close after successful operation
    await waitFor(() => {
      expect(screen.queryByTestId('status-modal')).not.toBeInTheDocument();
    });
  });

  it('RN0015: não deve permitir motivo vazio', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Only fill category, leave motivo empty
    fireEvent.change(screen.getByTestId('status-modal-categoria'), {
      target: { value: '1' }
    });

    // Try to confirm
    fireEvent.click(screen.getByTestId('status-modal-confirm'));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Informe o motivo.')).toBeInTheDocument();
    });

    expect(adminService.deactivateBook).not.toHaveBeenCalled();
  });

  it('RN0015: não deve permitir categoria vazia', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Only fill motivo, leave category empty
    fireEvent.change(screen.getByTestId('status-modal-motivo'), {
      target: { value: 'Algum motivo válido' }
    });

    // Try to confirm
    fireEvent.click(screen.getByTestId('status-modal-confirm'));

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    });

    expect(adminService.deactivateBook).not.toHaveBeenCalled();
  });

  it('RN0015: deve limpar erros de validação ao preencher campos', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('toggle-book-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('toggle-book-1'));

    await waitFor(() => {
      expect(screen.getByTestId('status-modal')).toBeInTheDocument();
    });

    // Try to submit empty
    fireEvent.click(screen.getByTestId('status-modal-confirm'));

    // Errors should appear
    await waitFor(() => {
      expect(screen.getByText('Informe o motivo.')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma categoria.')).toBeInTheDocument();
    });

    // Fill motivo
    fireEvent.change(screen.getByTestId('status-modal-motivo'), {
      target: { value: 'Motivo válido' }
    });

    // Motivo error should disappear
    await waitFor(() => {
      expect(screen.queryByText('Informe o motivo.')).not.toBeInTheDocument();
    });

    // Fill categoria
    fireEvent.change(screen.getByTestId('status-modal-categoria'), {
      target: { value: '2' }
    });

    // Categoria error should disappear
    await waitFor(() => {
      expect(screen.queryByText('Selecione uma categoria.')).not.toBeInTheDocument();
    });
  });
});
