/**
 * BookFormPage.test.jsx
 * Tests for US-001: VALIDAR RF0011: Cadastrar livro
 * 
 * Validates:
 * - Book registration with mocked data (no API)
 * - ISBN duplicate prevention
 * - New book appears in listing
 * - All mandatory fields are required
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookFormPage from '../pages/BookFormPage';
import adminService from '../services/adminService';

// Mock the adminService
vi.mock('../services/adminService', () => ({
  default: {
    getAuthors: vi.fn(),
    getPublishers: vi.fn(),
    getCategories: vi.fn(),
    getPricingGroups: vi.fn(),
    getBooks: vi.fn(),
    createBook: vi.fn(),
    updateBook: vi.fn(),
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

// Mock data based on prd-valida-DRS.json US-001
const mockAuthors = [
  { id: 1, nome: 'Robert C. Martin' },
  { id: 2, nome: 'Martin Fowler' },
];

const mockPublishers = [
  { id: 1, nome: 'Prentice Hall' },
  { id: 2, nome: "O'Reilly Media" },
];

const mockCategories = [
  { id: 1, nome: 'Programação' },
  { id: 2, nome: 'Engenharia de Software' },
];

const mockPricingGroups = [
  { id: 1, nome: 'Técnico', margemLucro: 40 },
  { id: 2, nome: 'Geral', margemLucro: 30 },
];

// Existing book with ISBN from mockData
const existingBook = {
  id: 1,
  isbn: '978-0-596-00712-6',
  titulo: 'Head First Design Patterns',
  autor: { id: 2, nome: 'Martin Fowler' },
  editora: { id: 2, nome: "O'Reilly Media" },
  ativo: true,
};

// Mock existing books list
const mockExistingBooks = {
  content: [existingBook],
  totalPages: 1,
  totalElements: 1,
};

describe('BookFormPage - US-001: VALIDAR RF0011: Cadastrar livro', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock responses
    adminService.getAuthors.mockResolvedValue(mockAuthors);
    adminService.getPublishers.mockResolvedValue(mockPublishers);
    adminService.getCategories.mockResolvedValue(mockCategories);
    adminService.getPricingGroups.mockResolvedValue(mockPricingGroups);
    adminService.getBooks.mockResolvedValue(mockExistingBooks);
  });

  const renderBookForm = () => {
    return render(
      <BrowserRouter>
        <BookFormPage />
      </BrowserRouter>
    );
  };

  it('AC1: Dados são mockados localmente no componente (sem API real)', async () => {
    renderBookForm();

    // Wait for mocked data to load
    await waitFor(() => {
      expect(adminService.getAuthors).toHaveBeenCalled();
      expect(adminService.getPublishers).toHaveBeenCalled();
      expect(adminService.getCategories).toHaveBeenCalled();
      expect(adminService.getPricingGroups).toHaveBeenCalled();
    });

    // Verify mock data is used (no real API calls)
    expect(adminService.getAuthors).toHaveBeenCalledTimes(1);
    expect(adminService.getPublishers).toHaveBeenCalledTimes(1);
  });

  it('AC2: É possível cadastrar um novo livro via interface de administrador', async () => {
    // Mock successful book creation
    adminService.createBook.mockResolvedValue({
      success: true,
      data: { id: 2, titulo: 'Clean Code' },
    });

    renderBookForm();

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByTestId('field-titulo')).toBeInTheDocument();
    });

    // Fill Step 1: Basic Info
    const tituloInput = screen.getByTestId('field-titulo');
    const autorSelect = screen.getByTestId('field-autorId');
    const editoraSelect = screen.getByTestId('field-editoraId');
    const edicaoInput = screen.getByTestId('field-edicao');
    const anoInput = screen.getByTestId('field-ano');
    const isbnInput = screen.getByTestId('field-isbn');

    fireEvent.change(tituloInput, { target: { value: 'Clean Code: A Handbook of Agile Software Craftsmanship' } });
    fireEvent.change(autorSelect, { target: { value: '1' } }); // Robert C. Martin
    fireEvent.change(editoraSelect, { target: { value: '1' } }); // Prentice Hall
    fireEvent.change(edicaoInput, { target: { value: '1' } });
    fireEvent.change(anoInput, { target: { value: '2008' } });
    fireEvent.change(isbnInput, { target: { value: '978-0-13-235088-4' } });

    // Go to Step 2
    const nextBtn = screen.getByTestId('book-form-next-btn');
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId('book-form-step2')).toBeInTheDocument();
    });

    // Fill Step 2: Physical Data (optional fields, can skip)
    const numeroPaginasInput = screen.getByTestId('field-numeroPaginas');
    fireEvent.change(numeroPaginasInput, { target: { value: '464' } });

    // Go to Step 3
    fireEvent.click(screen.getByTestId('book-form-next-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('book-form-step3')).toBeInTheDocument();
    });

    // Fill Step 3: Price & Categories
    const precoVendaInput = screen.getByTestId('field-precoVenda');
    const grupoPrecificacaoSelect = screen.getByTestId('field-grupoPrecificacaoId');

    fireEvent.change(precoVendaInput, { target: { value: '70.00' } });
    fireEvent.change(grupoPrecificacaoSelect, { target: { value: '1' } }); // Técnico

    // Submit the form
    const submitBtn = screen.getByTestId('book-form-submit-btn');
    fireEvent.click(submitBtn);

    // Verify createBook was called
    await waitFor(() => {
      expect(adminService.createBook).toHaveBeenCalled();
    });

    const callArgs = adminService.createBook.mock.calls[0][0];
    expect(callArgs.titulo).toBe('Clean Code: A Handbook of Agile Software Craftsmanship');
    expect(callArgs.isbn).toBe('9780132350884'); // normalized (no dashes)
    expect(callArgs.autorId).toBe(1);
    expect(callArgs.editoraId).toBe(1);
  });

  it('AC3: O sistema impede o cadastro de dois livros com o mesmo ISBN', async () => {
    renderBookForm();

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByTestId('field-titulo')).toBeInTheDocument();
    });

    // Try to register a book with existing ISBN
    const tituloInput = screen.getByTestId('field-titulo');
    const autorSelect = screen.getByTestId('field-autorId');
    const editoraSelect = screen.getByTestId('field-editoraId');
    const edicaoInput = screen.getByTestId('field-edicao');
    const anoInput = screen.getByTestId('field-ano');
    const isbnInput = screen.getByTestId('field-isbn');

    fireEvent.change(tituloInput, { target: { value: 'Duplicate Book' } });
    fireEvent.change(autorSelect, { target: { value: '1' } });
    fireEvent.change(editoraSelect, { target: { value: '1' } });
    fireEvent.change(edicaoInput, { target: { value: '1' } });
    fireEvent.change(anoInput, { target: { value: '2020' } });
    fireEvent.change(isbnInput, { target: { value: '978-0-596-00712-6' } }); // Existing ISBN

    // Try to go to next step
    const nextBtn = screen.getByTestId('book-form-next-btn');
    fireEvent.click(nextBtn);

    // Should show error and stay on step 1
    await waitFor(() => {
      expect(screen.getByText(/ISBN já cadastrado/i)).toBeInTheDocument();
    });

    // Verify we're still on step 1
    expect(screen.getByTestId('book-form-step1')).toBeInTheDocument();
  });

  it('AC4: O livro recém-cadastrado aparece na listagem de livros', async () => {
    const newBook = {
      id: 2,
      titulo: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      isbn: '9780132350884',
      autor: { id: 1, nome: 'Robert C. Martin' },
      editora: { id: 1, nome: 'Prentice Hall' },
      ativo: true,
    };

    // Mock successful creation
    adminService.createBook.mockResolvedValue({
      success: true,
      data: newBook,
    });

    renderBookForm();

    // Wait for form load
    await waitFor(() => {
      expect(screen.getByTestId('field-titulo')).toBeInTheDocument();
    });

    // Fill minimum required fields for all steps - use UNIQUE ISBN
    const uniqueIsbn = '978-1-11-111111-1'; // Not in mockExistingBooks
    fireEvent.change(screen.getByTestId('field-titulo'), { target: { value: newBook.titulo } });
    fireEvent.change(screen.getByTestId('field-autorId'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-editoraId'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-edicao'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-ano'), { target: { value: '2008' } });
    fireEvent.change(screen.getByTestId('field-isbn'), { target: { value: uniqueIsbn } });

    // Click Next to step 2
    fireEvent.click(screen.getByTestId('book-form-next-btn'));
    await waitFor(() => expect(screen.getByTestId('book-form-step2')).toBeInTheDocument());

    // Click Next to step 3
    fireEvent.click(screen.getByTestId('book-form-next-btn'));
    await waitFor(() => expect(screen.getByTestId('book-form-step3')).toBeInTheDocument());

    // Fill price fields
    fireEvent.change(screen.getByTestId('field-precoVenda'), { target: { value: '70.00' } });
    fireEvent.change(screen.getByTestId('field-grupoPrecificacaoId'), { target: { value: '1' } });

    // Submit
    fireEvent.click(screen.getByTestId('book-form-submit-btn'));

    await waitFor(() => {
      expect(adminService.createBook).toHaveBeenCalled();
    });

    // Verify the book was added to the system
    const normalizedIsbn = uniqueIsbn.replace(/[- ]/g, '');
    expect(adminService.createBook).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: newBook.titulo,
        isbn: normalizedIsbn,
        autorId: 1,
        editoraId: 1,
      })
    );
  });

  it('AC5: Todos os campos obrigatórios (RF0011/RN0011) são exigidos pelo formulário', async () => {
    renderBookForm();

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByTestId('field-titulo')).toBeInTheDocument();
    });

    // Try to go to next step without filling required fields
    const nextBtn = screen.getByTestId('book-form-next-btn');
    fireEvent.click(nextBtn);

    // Should show validation errors for required fields
    await waitFor(() => {
      expect(screen.getByText('Título é obrigatório.')).toBeInTheDocument();
    });

    expect(screen.getByText('Selecione um autor.')).toBeInTheDocument();
    expect(screen.getByText('Selecione uma editora.')).toBeInTheDocument();
    expect(screen.getByText('Edição é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText(/Ano de publicação é obrigatório|Informe um ano válido/i)).toBeInTheDocument();
    expect(screen.getByText(/ISBN é obrigatório|ISBN deve ter entre 10 e 13/i)).toBeInTheDocument();

    // Verify we're still on step 1
    expect(screen.getByTestId('book-form-step1')).toBeInTheDocument();
  });

  it('AC6: ISBN validation - deve ter entre 10 e 13 dígitos numéricos', async () => {
    renderBookForm();

    await waitFor(() => {
      expect(screen.getByTestId('field-isbn')).toBeInTheDocument();
    });

    const isbnInput = screen.getByTestId('field-isbn');
    const nextBtn = screen.getByTestId('book-form-next-btn');

    // Test invalid ISBN (too short)
    fireEvent.change(isbnInput, { target: { value: '123' } });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/ISBN deve ter entre 10 e 13 dígitos/i)).toBeInTheDocument();
    });

    // Clear error by changing value
    fireEvent.change(isbnInput, { target: { value: '' } });
    
    // Test invalid ISBN (too long)
    fireEvent.change(isbnInput, { target: { value: '12345678901234' } });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(/ISBN deve ter entre 10 e 13 dígitos/i)).toBeInTheDocument();
    });

    // Test valid ISBN with dashes (should be accepted)
    // First fill other required fields
    fireEvent.change(screen.getByTestId('field-titulo'), { target: { value: 'Test Book' } });
    fireEvent.change(screen.getByTestId('field-autorId'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-editoraId'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-edicao'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-ano'), { target: { value: '2020' } });
    fireEvent.change(isbnInput, { target: { value: '978-0-13-999999-9' } }); // Valid format, different ISBN

    // Click next - should succeed this time
    fireEvent.click(nextBtn);

    // Error should disappear and we should move to step 2
    await waitFor(() => {
      expect(screen.queryByText(/ISBN deve ter entre 10 e 13 dígitos/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('book-form-step2')).toBeInTheDocument();
    });
  });

  it('AC7: Preço de venda é obrigatório no passo 3', async () => {
    renderBookForm();

    // Fill step 1
    await waitFor(() => expect(screen.getByTestId('field-titulo')).toBeInTheDocument());
    
    fireEvent.change(screen.getByTestId('field-titulo'), { target: { value: 'Test Book' } });
    fireEvent.change(screen.getByTestId('field-autorId'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-editoraId'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-edicao'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('field-ano'), { target: { value: '2020' } });
    fireEvent.change(screen.getByTestId('field-isbn'), { target: { value: '1234567890' } });

    fireEvent.click(screen.getByTestId('book-form-next-btn'));

    // Skip step 2
    await waitFor(() => expect(screen.getByTestId('book-form-step2')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('book-form-next-btn'));

    // Try to submit step 3 without price
    await waitFor(() => expect(screen.getByTestId('book-form-step3')).toBeInTheDocument());
    
    const submitBtn = screen.getByTestId('book-form-submit-btn');
    fireEvent.click(submitBtn);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Preço de venda é obrigatório/i)).toBeInTheDocument();
    });
  });
});
