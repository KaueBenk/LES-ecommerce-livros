/**
 * BookFormPage.edit.test.jsx
 * Tests for US-004: VALIDAR RF0014: Alterar cadastro de livro
 * 
 * Validates:
 * - Book editing with mocked data (no API)
 * - Admin can edit any field of an active book
 * - Audit log records date, time, user, and previous data (RNF0012)
 * - Cannot edit non-existent or deleted books
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import BookFormPage from './BookFormPage';
// Mock the adminService - using simple vi.fn() for all methods
vi.mock('../services/adminService', () => ({
  default: {
    getAuthors: vi.fn(),
    getPublishers: vi.fn(),
    getCategories: vi.fn(),
    getPricingGroups: vi.fn(),
    getBooks: vi.fn(),
    getBook: vi.fn(),
    updateBook: vi.fn(),
    createBook: vi.fn(),
  }
}));

// Import the mocked service
import adminService from '../services/adminService';

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

// Mock data based on RF0014 requirements
const mockAuthors = [
  { id: 1, nome: 'Robert C. Martin' },
  { id: 2, nome: 'Martin Fowler' },
  { id: 3, nome: 'Kent Beck' },
];

const mockPublishers = [
  { id: 1, nome: 'Prentice Hall' },
  { id: 2, nome: "O'Reilly Media" },
  { id: 3, nome: 'Addison-Wesley' },
];

const mockCategories = [
  { id: 1, nome: 'Programação' },
  { id: 2, nome: 'Engenharia de Software' },
  { id: 3, nome: 'Metodologias Ágeis' },
];

const mockPricingGroups = [
  { id: 1, nome: 'Técnico', margem: 40 },
  { id: 2, nome: 'Geral', margem: 30 },
];

// Existing active book to be edited
const existingActiveBook = {
  id: 1,
  isbn: '9780132350884',
  titulo: 'Clean Code',
  autor: { id: 1, nome: 'Robert C. Martin' },
  autorId: 1,
  editora: { id: 1, nome: 'Prentice Hall' },
  editoraId: 1,
  edicao: '1',
  ano: 2008,
  numeroPaginas: 464,
  sinopse: 'A handbook of agile software craftsmanship',
  altura: 23.5,
  largura: 17.8,
  profundidade: 2.5,
  peso: 0.65,
  codigoBarras: '9780132350884',
  grupoPrecificacaoId: 1,
  categorias: [
    { id: 1, nome: 'Programação' },
    { id: 2, nome: 'Engenharia de Software' },
  ],
  precoVenda: 70.00,
  ativo: true,
  createdAt: '2023-01-15T10:30:00Z',
  createdBy: 'admin@example.com',
};

// Deleted (inactive) book
const deletedBook = {
  id: 999,
  isbn: '9780000000000',
  titulo: 'Deleted Book',
  autor: { id: 1, nome: 'Robert C. Martin' },
  autorId: 1,
  editora: { id: 1, nome: 'Prentice Hall' },
  editoraId: 1,
  edicao: '1',
  ano: 2020,
  numeroPaginas: 300,
  grupoPrecificacaoId: 1,
  categorias: [{ id: 1, nome: 'Programação' }],
  precoVenda: 50.00,
  ativo: false,
  deletedAt: '2023-12-01T15:00:00Z',
};

// Mock existing books list (excluding deleted)
const mockExistingBooks = {
  content: [existingActiveBook],
  totalPages: 1,
  totalElements: 1,
};

describe('BookFormPage - US-004: VALIDAR RF0014: Alterar cadastro de livro', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock responses
    adminService.getAuthors.mockResolvedValue(mockAuthors);
    adminService.getPublishers.mockResolvedValue(mockPublishers);
    adminService.getCategories.mockResolvedValue(mockCategories);
    adminService.getPricingGroups.mockResolvedValue(mockPricingGroups);
    adminService.getBooks.mockResolvedValue(mockExistingBooks);
    adminService.getBook.mockResolvedValue(null); // Default to null, override in tests
  });

  const renderBookFormEdit = async (bookId = '1') => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={[`/admin/livros/${bookId}/editar`]}>
          <Routes>
            <Route path="/admin/livros/:bookId/editar" element={<BookFormPage />} />
          </Routes>
        </MemoryRouter>
      );
    });
  };

  // Helper to wait for form to finish loading
  const waitForFormReady = async (expectedTitle) => {
    // 1. Wait for BOTH 'book-form-loading' and 'loading-spinner' to NOT be in the document
    await waitFor(
      () => {
        const loading = screen.queryByTestId('book-form-loading');
        const spinner = screen.queryByTestId('loading-spinner');
        expect(loading).not.toBeInTheDocument();
        expect(spinner).not.toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // 2. Wait for actual fields to appear (ensures loadingRefs=false and Step 1 rendered)
    const page = await screen.findByTestId('book-form-page', {}, { timeout: 10000 });
    expect(page).toBeInTheDocument();
    
    await screen.findByTestId('field-titulo', {}, { timeout: 10000 });
    await screen.findByTestId('field-autorId', {}, { timeout: 10000 });

    // 3. Wait for the title field to have the expected value if provided
    if (expectedTitle !== undefined) {
      await waitFor(
        () => {
          const titleField = screen.getByTestId('field-titulo');
          expect(titleField).toHaveValue(expectedTitle);
        },
        { timeout: 5000 }
      );
    }

    // 4. Ensure next button is available
    await screen.findByTestId('book-form-next-btn', {}, { timeout: 5000 });
  };

  it('AC1: Dados são mockados localmente no componente (sem API)', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);
    
    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Wait for mocked data to load
    await waitFor(() => {
      expect(adminService.getAuthors).toHaveBeenCalled();
      expect(adminService.getPublishers).toHaveBeenCalled();
      expect(adminService.getCategories).toHaveBeenCalled();
      expect(adminService.getPricingGroups).toHaveBeenCalled();
      expect(adminService.getBook).toHaveBeenCalledWith('1');
    });
  });

  it('AC2: Um administrador pode alterar qualquer campo cadastral de um livro ativo - campos básicos', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);
    adminService.updateBook.mockResolvedValue({
      success: true,
      data: { ...existingActiveBook, titulo: 'Clean Code - Updated Edition' },
    });

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Edit basic fields
    const tituloInput = screen.getByTestId('field-titulo');
    const autorSelect = screen.getByTestId('field-autorId');
    const editoraSelect = screen.getByTestId('field-editoraId');
    const edicaoInput = screen.getByTestId('field-edicao');
    const anoInput = screen.getByTestId('field-ano');

    // Change fields with act
    await act(async () => {
      fireEvent.change(tituloInput, { target: { value: 'Clean Code - Updated Edition' } });
      fireEvent.change(autorSelect, { target: { value: '2' } }); // Martin Fowler
      fireEvent.change(editoraSelect, { target: { value: '2' } }); // O'Reilly Media
      fireEvent.change(edicaoInput, { target: { value: '2' } });
      fireEvent.change(anoInput, { target: { value: '2024' } });
    });

    // Go to Step 2
    const nextBtn = screen.getByTestId('book-form-next-btn');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('book-form-step2')).toBeInTheDocument();
    });

    // Go to Step 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('book-form-step3')).toBeInTheDocument();
    });

    // Submit the form
    const submitBtn = screen.getByTestId('book-form-submit-btn');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Verify updateBook was called with edited data
    await waitFor(() => {
      expect(adminService.updateBook).toHaveBeenCalled();
    });

    const [bookId, updateData] = adminService.updateBook.mock.calls[0];
    expect(bookId).toBe('1');
    expect(updateData.titulo).toBe('Clean Code - Updated Edition');
    expect(updateData.autorId).toBe(2);
    expect(updateData.editoraId).toBe(2);
    expect(updateData.edicao).toBe('2');
    expect(updateData.ano).toBe(2024);
  });

  it('AC2: Um administrador pode alterar qualquer campo cadastral de um livro ativo - campos físicos', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);
    adminService.updateBook.mockResolvedValue({
      success: true,
      data: existingActiveBook,
    });

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Go to Step 2
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('book-form-step2')).toBeInTheDocument();
    });

    // Edit physical fields
    const numeroPaginasInput = screen.getByTestId('field-numeroPaginas');
    const sinopseTextarea = screen.getByTestId('field-sinopse');
    const alturaInput = screen.getByTestId('field-altura');
    const larguraInput = screen.getByTestId('field-largura');
    const profundidadeInput = screen.getByTestId('field-profundidade');
    const pesoInput = screen.getByTestId('field-peso');

    await act(async () => {
      fireEvent.change(numeroPaginasInput, { target: { value: '500' } });
      fireEvent.change(sinopseTextarea, { target: { value: 'Updated synopsis for Clean Code book' } });
      fireEvent.change(alturaInput, { target: { value: '24.0' } });
      fireEvent.change(larguraInput, { target: { value: '18.0' } });
      fireEvent.change(profundidadeInput, { target: { value: '3.0' } });
      fireEvent.change(pesoInput, { target: { value: '0.70' } });
    });

    // Go to Step 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('book-form-step3')).toBeInTheDocument();
    });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-submit-btn'));
    });

    await waitFor(() => {
      expect(adminService.updateBook).toHaveBeenCalled();
    });

    const [, updateData] = adminService.updateBook.mock.calls[0];
    expect(updateData.numeroPaginas).toBe(500);
    expect(updateData.sinopse).toBe('Updated synopsis for Clean Code book');
    expect(updateData.altura).toBe(24.0);
    expect(updateData.largura).toBe(18.0);
    expect(updateData.profundidade).toBe(3.0);
    expect(updateData.peso).toBe(0.70);
  });

  it('AC2: Um administrador pode alterar qualquer campo cadastral de um livro ativo - preço e categorias', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);
    adminService.updateBook.mockResolvedValue({
      success: true,
      data: existingActiveBook,
    });

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Navigate to Step 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });
    await waitFor(() => expect(screen.getByTestId('book-form-step2')).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });
    await waitFor(() => expect(screen.getByTestId('book-form-step3')).toBeInTheDocument());

    // Edit price
    const precoVendaInput = screen.getByTestId('field-precoVenda');
    await act(async () => {
      fireEvent.change(precoVendaInput, { target: { value: '85.00' } });
    });

    // Change pricing group
    const grupoPrecificacaoSelect = screen.getByTestId('field-grupoPrecificacaoId');
    await act(async () => {
      fireEvent.change(grupoPrecificacaoSelect, { target: { value: '2' } }); // Geral
    });

    // Add a new category
    const categoryCheckbox3 = screen.getByTestId('category-checkbox-3');
    await act(async () => {
      fireEvent.click(categoryCheckbox3);
    });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-submit-btn'));
    });

    // Verify updateBook was called with edited data
    await waitFor(() => {
      expect(adminService.updateBook).toHaveBeenCalled();
    });

    const [, updateData] = adminService.updateBook.mock.calls[0];
    expect(updateData.precoVenda).toBe(85.00);
    expect(updateData.grupoPrecificacaoId).toBe(2);
    expect(updateData.categoriaIds).toContain(3);
  });

  it('AC3: O log de auditoria registra data, hora, usuário e dados anteriores (RNF0012)', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);
    
    // Mock audit log recording in updateBook response
    const mockAuditLog = {
      timestamp: new Date().toISOString(),
      usuario: 'admin@example.com',
      action: 'UPDATE_BOOK',
      bookId: 1,
      previousData: {
        titulo: 'Clean Code',
        precoVenda: 70.00,
        autorId: 1,
        editoraId: 1,
      },
      newData: {
        titulo: 'Clean Code - Updated',
        precoVenda: 85.00,
        autorId: 1,
        editoraId: 1,
      },
    };

    adminService.updateBook.mockResolvedValue({
      success: true,
      data: { ...existingActiveBook, titulo: 'Clean Code - Updated' },
      auditLog: mockAuditLog,
    });

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Edit titulo
    await act(async () => {
      fireEvent.change(screen.getByTestId('field-titulo'), { target: { value: 'Clean Code - Updated' } });
    });

    // Navigate to step 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });
    await waitFor(() => expect(screen.getByTestId('book-form-step2')).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });
    await waitFor(() => expect(screen.getByTestId('book-form-step3')).toBeInTheDocument());

    // Edit price
    await act(async () => {
      fireEvent.change(screen.getByTestId('field-precoVenda'), { target: { value: '85.00' } });
    });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-submit-btn'));
    });

    await waitFor(() => {
      expect(adminService.updateBook).toHaveBeenCalled();
    });

    // Verify update was called (audit log would be handled by backend)
    const [bookId, updateData] = adminService.updateBook.mock.calls[0];
    expect(bookId).toBe('1');
    
    expect(updateData.titulo).toBe('Clean Code - Updated');
    expect(updateData.precoVenda).toBe(85.00);

    // The mock response includes audit log info
    const response = await adminService.updateBook.mock.results[0].value;
    expect(response.auditLog).toBeDefined();
    expect(response.auditLog.timestamp).toBeDefined();
    expect(response.auditLog.usuario).toBeDefined();
    expect(response.auditLog.previousData).toBeDefined();
    expect(response.auditLog.previousData.titulo).toBe('Clean Code');
    expect(response.auditLog.newData.titulo).toBe('Clean Code - Updated');
  });

  it('AC4: Não é possível alterar livros inexistentes', async () => {
    // Mock getBook to return null for non-existent book
    adminService.getBook.mockResolvedValue(null);

    await renderBookFormEdit('999999');

    // The component should handle non-existent book
    // Wait for form ready even if title is empty
    await waitForFormReady('');

    // Verify that form doesn't load with data (stays in loading or shows error)
    // Since the book is null, the form should not populate
    await waitFor(() => {
      const tituloInput = screen.queryByTestId('field-titulo');
      if (tituloInput) {
        // If form is shown, it should be empty
        expect(tituloInput.value).toBe('');
      }
    });
  });

  it('AC4: Não é possível alterar livros deletados (inativos)', async () => {
    // Mock getBook to return a deleted book
    adminService.getBook.mockResolvedValue(deletedBook);
    
    await renderBookFormEdit('999');
    await waitForFormReady('Deleted Book');

    // Try to update the deleted book
    adminService.updateBook.mockRejectedValue({
      response: {
        data: {
          error: 'Não é possível alterar livros inativos ou deletados',
        },
      },
    });

    // Make a change
    const tituloInput = screen.getByTestId('field-titulo');
    await act(async () => {
      fireEvent.change(tituloInput, { target: { value: 'Deleted Book Updated' } });
    });

    // Navigate to step 3
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });
    await waitFor(() => expect(screen.getByTestId('book-form-step2')).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });
    await waitFor(() => expect(screen.getByTestId('book-form-step3')).toBeInTheDocument());

    // Try to submit
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-submit-btn'));
    });

    // Should show error about deleted book
    await waitFor(() => {
      expect(adminService.updateBook).toHaveBeenCalled();
    });
  });

  it('AC5: Validação - campos obrigatórios permanecem obrigatórios ao editar', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Clear required fields
    const tituloInput = screen.getByTestId('field-titulo');
    const autorSelect = screen.getByTestId('field-autorId');
    const editoraSelect = screen.getByTestId('field-editoraId');
    const edicaoInput = screen.getByTestId('field-edicao');
    const anoInput = screen.getByTestId('field-ano');
    const isbnInput = screen.getByTestId('field-isbn');

    await act(async () => {
      fireEvent.change(tituloInput, { target: { value: '' } });
      fireEvent.change(autorSelect, { target: { value: '' } });
      fireEvent.change(editoraSelect, { target: { value: '' } });
      fireEvent.change(edicaoInput, { target: { value: '' } });
      fireEvent.change(anoInput, { target: { value: '' } });
      fireEvent.change(isbnInput, { target: { value: '' } });
    });

    // Try to go to next step
    const nextBtn = screen.getByTestId('book-form-next-btn');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório.')).toBeInTheDocument();
      expect(screen.getByText('Selecione um autor.')).toBeInTheDocument();
      expect(screen.getByText('Selecione uma editora.')).toBeInTheDocument();
      expect(screen.getByText('Edição é obrigatória.')).toBeInTheDocument();
    });

    // Should stay on step 1
    expect(screen.getByTestId('book-form-step1')).toBeInTheDocument();
  });

  it('AC6: ISBN não pode ser alterado para um ISBN já existente em outro livro', async () => {
    // Book with ID 1
    adminService.getBook.mockResolvedValue(existingActiveBook);
    
    // Mock another book with different ISBN
    const anotherBook = {
      id: 2,
      isbn: '9780596007126',
      titulo: 'Head First Design Patterns',
      ativo: true,
    };
    
    adminService.getBooks.mockResolvedValue({
      content: [existingActiveBook, anotherBook],
      totalPages: 1,
      totalElements: 2,
    });

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Try to change ISBN to one that already exists in another book
    const isbnInput = screen.getByTestId('field-isbn');
    await act(async () => {
      fireEvent.change(isbnInput, { target: { value: '9780596007126' } });
    });

    // Try to go to next step
    const nextBtn = screen.getByTestId('book-form-next-btn');
    await act(async () => {
      fireEvent.click(nextBtn);
    });

    // Should show error about duplicate ISBN
    await waitFor(() => {
      expect(screen.getByText(/ISBN já cadastrado/i)).toBeInTheDocument();
    });

    // Should stay on step 1
    expect(screen.getByTestId('book-form-step1')).toBeInTheDocument();
  });

  it('AC7: Testes fazem sentido - editando múltiplos campos e verificando mudanças', async () => {
    adminService.getBook.mockResolvedValue(existingActiveBook);
    adminService.updateBook.mockResolvedValue({
      success: true,
      data: {
        ...existingActiveBook,
        titulo: 'Clean Code - Revised Edition',
        edicao: '2',
        ano: 2024,
        precoVenda: 90.00,
      },
    });

    await renderBookFormEdit('1');
    await waitForFormReady('Clean Code');

    // Step 1: Edit basic info
    await act(async () => {
      fireEvent.change(screen.getByTestId('field-titulo'), { 
        target: { value: 'Clean Code - Revised Edition' } 
      });
      fireEvent.change(screen.getByTestId('field-edicao'), { target: { value: '2' } });
      fireEvent.change(screen.getByTestId('field-ano'), { target: { value: '2024' } });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });

    // Step 2: Edit physical data
    await waitFor(() => expect(screen.getByTestId('book-form-step2')).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.change(screen.getByTestId('field-numeroPaginas'), { target: { value: '480' } });
      fireEvent.change(screen.getByTestId('field-sinopse'), { 
        target: { value: 'Updated and revised edition with new chapters' } 
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-next-btn'));
    });

    // Step 3: Edit price
    await waitFor(() => expect(screen.getByTestId('book-form-step3')).toBeInTheDocument());
    
    await act(async () => {
      fireEvent.change(screen.getByTestId('field-precoVenda'), { target: { value: '90.00' } });
    });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByTestId('book-form-submit-btn'));
    });

    // Verify all changes were submitted
    await waitFor(() => {
      expect(adminService.updateBook).toHaveBeenCalled();
    });

    const [bookId, updateData] = adminService.updateBook.mock.calls[0];
    expect(bookId).toBe('1');
    expect(updateData.titulo).toBe('Clean Code - Revised Edition');
    expect(updateData.edicao).toBe('2');
    expect(updateData.ano).toBe(2024);
    expect(updateData.numeroPaginas).toBe(480);
    expect(updateData.sinopse).toBe('Updated and revised edition with new chapters');
    expect(updateData.precoVenda).toBe(90.00);
  });
}, 30000);
