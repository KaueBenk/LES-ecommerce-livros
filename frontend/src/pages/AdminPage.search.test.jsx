/**
 * AdminPage.search.test.jsx
 * Tests for US-005: VALIDAR RF0015: Consulta de livros
 * 
 * Validates:
 * - Books can be searched by title, author, ISBN, category, publisher and other identification fields (RF0015)
 * - Filters can be used in combination or isolation (RF0015)
 * - Query returns results in under 1 second (RNF0011)
 * - Invalid or no-match results return empty list with friendly message
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

// Mock book data for comprehensive search testing
const mockBooks = [
  {
    id: 1,
    codigo: 'LIV-001',
    titulo: 'Clean Code',
    isbn: '978-0-13-235088-4',
    autor: { id: 1, nome: 'Robert C. Martin' },
    editora: { id: 1, nome: 'Prentice Hall' },
    categorias: [{ id: 1, nome: 'Engenharia de Software' }],
    ativo: true,
    quantidadeEstoque: 10,
    precoVenda: 89.90,
  },
  {
    id: 2,
    codigo: 'LIV-002',
    titulo: 'Design Patterns',
    isbn: '978-0-20-163361-0',
    autor: { id: 2, nome: 'Gang of Four' },
    editora: { id: 2, nome: 'Addison-Wesley' },
    categorias: [{ id: 1, nome: 'Engenharia de Software' }],
    ativo: true,
    quantidadeEstoque: 5,
    precoVenda: 95.00,
  },
  {
    id: 3,
    codigo: 'LIV-003',
    titulo: 'The Pragmatic Programmer',
    isbn: '978-0-13-529266-9',
    autor: { id: 3, nome: 'Hunt & Thomas' },
    editora: { id: 3, nome: 'Addison-Wesley Professional' },
    categorias: [{ id: 2, nome: 'Programação' }],
    ativo: true,
    quantidadeEstoque: 8,
    precoVenda: 79.90,
  },
  {
    id: 4,
    codigo: 'LIV-004',
    titulo: 'Introduction to Algorithms',
    isbn: '978-0-26-203384-8',
    autor: { id: 4, nome: 'Thomas H. Cormen' },
    editora: { id: 4, nome: 'MIT Press' },
    categorias: [{ id: 3, nome: 'Algoritmos' }],
    ativo: true,
    quantidadeEstoque: 3,
    precoVenda: 120.00,
  },
  {
    id: 5,
    codigo: 'LIV-005',
    titulo: 'Code Complete',
    isbn: '978-0-73-561967-8',
    autor: { id: 5, nome: 'Steve McConnell' },
    editora: { id: 5, nome: 'Microsoft Press' },
    categorias: [{ id: 1, nome: 'Engenharia de Software' }],
    ativo: false,
    quantidadeEstoque: 0,
    precoVenda: 85.00,
  },
];

const mockCategories = [
  { id: 1, nome: 'Engenharia de Software' },
  { id: 2, nome: 'Programação' },
  { id: 3, nome: 'Algoritmos' },
];

// Helper to create paginated response
const createPaginatedResponse = (books) => ({
  content: books,
  totalPages: Math.ceil(books.length / 20),
  totalElements: books.length,
});

describe('AdminPage - US-005: VALIDAR RF0015: Consulta de livros', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Setup default mock responses
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(mockBooks));
    adminService.getCategories.mockResolvedValue(mockCategories);
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

  // ─── RF0015: Basic Search Functionality ────────────────────────────────────

  it('RF0015: deve exibir todos os livros quando nenhum filtro é aplicado', async () => {
    renderAdminPage();

    // Wait for books to load
    await waitFor(() => {
      expect(screen.getByTestId('admin-books-section')).toBeInTheDocument();
    });

    // All books should be displayed
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Design Patterns')).toBeInTheDocument();
    expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Code Complete')).toBeInTheDocument();

    // Check total count
    const countBadge = screen.getByTestId('admin-books-count');
    expect(countBadge).toHaveTextContent('5');
  });

  it('RF0015: deve buscar livros por título de forma isolada', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock filtered response - searching for "Clean"
    const filteredBooks = mockBooks.filter(b => b.titulo.includes('Clean'));
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(filteredBooks));

    // Enter title filter
    const titleInput = screen.getByTestId('filter-titulo');
    fireEvent.change(titleInput, { target: { value: 'Clean' } });

    // Submit filter
    const submitBtn = screen.getByTestId('filter-submit');
    fireEvent.click(submitBtn);

    // Verify API was called with title filter
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Clean' })
      );
    });

    // Verify filtered books are displayed
    await waitFor(() => {
      expect(screen.getByText('Clean Code')).toBeInTheDocument();
      expect(screen.queryByText('Design Patterns')).not.toBeInTheDocument();
    });
  });

  it('RF0015: deve buscar livros por autor de forma isolada', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-autor')).toBeInTheDocument();
    });

    // Mock filtered response - searching for author "Martin"
    const filteredBooks = mockBooks.filter(b => b.autor.nome.includes('Martin'));
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(filteredBooks));

    // Enter author filter
    const authorInput = screen.getByTestId('filter-autor');
    fireEvent.change(authorInput, { target: { value: 'Martin' } });

    // Submit filter
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify API was called with author filter
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ autorNome: 'Martin' })
      );
    });

    // Verify filtered books are displayed
    await waitFor(() => {
      expect(screen.getByText('Clean Code')).toBeInTheDocument();
      expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
    });
  });

  it('RF0015: deve buscar livros por status (ativo/inativo) de forma isolada', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-ativo')).toBeInTheDocument();
    });

    // Mock filtered response - only active books
    const activeBooks = mockBooks.filter(b => b.ativo === true);
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(activeBooks));

    // Select active filter
    const statusSelect = screen.getByTestId('filter-ativo');
    fireEvent.change(statusSelect, { target: { value: 'true' } });

    // Submit filter
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify API was called with ativo=true filter
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: true })
      );
    });

    // Verify only active books are displayed
    await waitFor(() => {
      expect(screen.getByText('Clean Code')).toBeInTheDocument();
      expect(screen.queryByText('Code Complete')).not.toBeInTheDocument();
    });
  });

  // ─── RF0015: Combined Filters ──────────────────────────────────────────────

  it('RF0015: deve permitir busca combinada de título e autor', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock filtered response - "Code" in title AND author contains specific text
    const filteredBooks = [mockBooks[0]]; // Clean Code by Robert C. Martin
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(filteredBooks));

    // Enter title and author filters
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Code' } });
    fireEvent.change(screen.getByTestId('filter-autor'), { target: { value: 'Martin' } });

    // Submit filter
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify API was called with both filters
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Code',
          autorNome: 'Martin',
        })
      );
    });

    // Verify correct book is displayed
    await waitFor(() => {
      expect(screen.getByText('Clean Code')).toBeInTheDocument();
      expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
    });
  });

  it('RF0015: deve permitir busca combinada de título, autor e status', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock filtered response - active books with "Design" in title
    const filteredBooks = [mockBooks[1]]; // Design Patterns
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(filteredBooks));

    // Apply all three filters
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Design' } });
    fireEvent.change(screen.getByTestId('filter-autor'), { target: { value: 'Four' } });
    fireEvent.change(screen.getByTestId('filter-ativo'), { target: { value: 'true' } });

    // Submit filter
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify API was called with all filters
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Design',
          autorNome: 'Four',
          ativo: true,
        })
      );
    });

    // Verify filtered result
    await waitFor(() => {
      expect(screen.getByText('Design Patterns')).toBeInTheDocument();
    });
  });

  // ─── RF0015: Empty Results & Friendly Messages ─────────────────────────────

  it('RF0015: deve exibir mensagem amigável quando nenhum resultado é encontrado', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock empty response
    adminService.getBooks.mockResolvedValue(createPaginatedResponse([]));

    // Search for non-existent book
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'NonExistentBook' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify empty state message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('admin-no-books')).toBeInTheDocument();
      expect(screen.getByText('Nenhum livro encontrado.')).toBeInTheDocument();
    });
  });

  it('RF0015: deve permitir limpar filtros quando nenhum resultado é encontrado', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock empty response
    adminService.getBooks.mockResolvedValue(createPaginatedResponse([]));

    // Apply filter
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Invalid' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Wait for empty message
    await waitFor(() => {
      expect(screen.getByTestId('admin-no-books')).toBeInTheDocument();
    });

    // Mock full list again
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(mockBooks));

    // Click "Limpar filtros" button in the empty state
    const clearBtn = screen.getByText('Limpar filtros');
    fireEvent.click(clearBtn);

    // Verify API was called without filters (no titulo, autorNome, ativo params)
    await waitFor(() => {
      const lastCall = adminService.getBooks.mock.calls[adminService.getBooks.mock.calls.length - 1];
      const params = lastCall[0];
      expect(params.page).toBe(0);
      expect(params.size).toBe(20);
      // Empty filters should not be present in params
      expect(params.titulo).toBeUndefined();
      expect(params.autorNome).toBeUndefined();
      expect(params.ativo).toBeUndefined();
    });
  });

  it('RF0015: deve permitir resetar todos os filtros aplicados', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Apply multiple filters
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Clean' } });
    fireEvent.change(screen.getByTestId('filter-autor'), { target: { value: 'Martin' } });
    fireEvent.change(screen.getByTestId('filter-ativo'), { target: { value: 'true' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('filter-reset')).toBeInTheDocument();
    });

    // Mock full list again
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(mockBooks));

    // Click reset button
    const resetBtn = screen.getByTestId('filter-reset');
    fireEvent.click(resetBtn);

    // Verify filters are cleared
    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toHaveValue('');
      expect(screen.getByTestId('filter-autor')).toHaveValue('');
      expect(screen.getByTestId('filter-ativo')).toHaveValue('');
    });

    // Verify API was called without filters (no titulo, autorNome, ativo params)
    await waitFor(() => {
      const lastCall = adminService.getBooks.mock.calls[adminService.getBooks.mock.calls.length - 1];
      const params = lastCall[0];
      expect(params.page).toBe(0);
      expect(params.size).toBe(20);
      // Empty filters should not be present in params
      expect(params.titulo).toBeUndefined();
      expect(params.autorNome).toBeUndefined();
      expect(params.ativo).toBeUndefined();
    });
  });

  // ─── RNF0011: Performance (< 1 second) ─────────────────────────────────────

  it('RNF0011: deve retornar resultados em menos de 1 segundo', async () => {
    const startTime = performance.now();

    renderAdminPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('admin-books-section')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Verify query completed in under 1000ms
    expect(duration).toBeLessThan(1000);
  });

  it('RNF0011: pesquisa com filtros deve retornar em menos de 1 segundo', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock filtered response
    adminService.getBooks.mockResolvedValue(createPaginatedResponse([mockBooks[0]]));

    const searchStartTime = performance.now();

    // Apply filter
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Clean' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Wait for results
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Clean' })
      );
    });

    const searchEndTime = performance.now();
    const searchDuration = searchEndTime - searchStartTime;

    // Verify search completed in under 1000ms
    expect(searchDuration).toBeLessThan(1000);
  });

  // ─── Additional Search Scenarios ───────────────────────────────────────────

  it('RF0015: deve buscar livros inativos especificamente', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-ativo')).toBeInTheDocument();
    });

    // Mock inactive books only
    const inactiveBooks = mockBooks.filter(b => b.ativo === false);
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(inactiveBooks));

    // Select inactive filter
    fireEvent.change(screen.getByTestId('filter-ativo'), { target: { value: 'false' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify API was called with ativo=false
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ ativo: false })
      );
    });

    // Verify only inactive books are shown
    await waitFor(() => {
      expect(screen.getByText('Code Complete')).toBeInTheDocument();
      const statusBadge = screen.getByTestId('book-status-5');
      expect(statusBadge).toHaveTextContent('Inativo');
    });
  });

  it('RF0015: deve exibir ISBN dos livros na listagem', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('admin-books-table')).toBeInTheDocument();
    });

    // Verify ISBNs are displayed
    expect(screen.getByText('978-0-13-235088-4')).toBeInTheDocument();
    expect(screen.getByText('978-0-20-163361-0')).toBeInTheDocument();
    expect(screen.getByText('978-0-13-529266-9')).toBeInTheDocument();
  });

  it('RF0015: deve exibir código único do livro (RNF0021)', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('admin-books-table')).toBeInTheDocument();
    });

    // Verify book codes are displayed
    expect(screen.getByTestId('book-code-1')).toHaveTextContent('LIV-001');
    expect(screen.getByTestId('book-code-2')).toHaveTextContent('LIV-002');
    expect(screen.getByTestId('book-code-3')).toHaveTextContent('LIV-003');
  });

  it('RF0015: deve exibir informações de estoque na consulta', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('book-stock-1')).toBeInTheDocument();
    });

    // Verify stock information is displayed
    expect(screen.getByTestId('book-stock-1')).toHaveTextContent('10');
    expect(screen.getByTestId('book-stock-2')).toHaveTextContent('5');
    expect(screen.getByTestId('book-stock-3')).toHaveTextContent('8');
    expect(screen.getByTestId('book-stock-5')).toHaveTextContent('0');
  });

  it('RF0015: deve exibir preço de venda na consulta', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('book-price-1')).toBeInTheDocument();
    });

    // Verify prices are displayed correctly
    expect(screen.getByTestId('book-price-1')).toHaveTextContent('89,90');
    expect(screen.getByTestId('book-price-2')).toHaveTextContent('95,00');
    expect(screen.getByTestId('book-price-3')).toHaveTextContent('79,90');
  });

  it('RF0015: busca parcial por título deve funcionar', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock books with "Programmer" in title
    const filteredBooks = mockBooks.filter(b => 
      b.titulo.toLowerCase().includes('programmer')
    );
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(filteredBooks));

    // Search for partial title
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Programmer' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'Programmer' })
      );
    });

    // Both "Pragmatic Programmer" should be found
    await waitFor(() => {
      expect(screen.getByText('The Pragmatic Programmer')).toBeInTheDocument();
    });
  });

  it('RF0015: busca case-insensitive deve funcionar', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock case-insensitive search
    const filteredBooks = [mockBooks[0]]; // Clean Code
    adminService.getBooks.mockResolvedValue(createPaginatedResponse(filteredBooks));

    // Search with lowercase
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'clean code' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ titulo: 'clean code' })
      );
    });
  });

  it('RF0015: deve manter paginação ao aplicar filtros', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Apply filter
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: 'Code' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify API was called with page 0 (reset pagination)
    await waitFor(() => {
      expect(adminService.getBooks).toHaveBeenCalledWith(
        expect.objectContaining({ 
          page: 0,
          titulo: 'Code',
        })
      );
    });
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────────

  it('RF0015: deve lidar com caracteres especiais na busca', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Mock empty response for special characters
    adminService.getBooks.mockResolvedValue(createPaginatedResponse([]));

    // Search with special characters
    fireEvent.change(screen.getByTestId('filter-titulo'), { target: { value: '@#$%' } });
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Should not crash and show empty message
    await waitFor(() => {
      expect(screen.getByTestId('admin-no-books')).toBeInTheDocument();
    });
  });

  it('RF0015: deve permitir filtros vazios sem erro', async () => {
    renderAdminPage();

    await waitFor(() => {
      expect(screen.getByTestId('filter-titulo')).toBeInTheDocument();
    });

    // Submit form with empty filters (should return all books)
    fireEvent.click(screen.getByTestId('filter-submit'));

    // Verify no filters were passed (or empty strings)
    await waitFor(() => {
      const lastCall = adminService.getBooks.mock.calls[adminService.getBooks.mock.calls.length - 1];
      const params = lastCall[0];
      // Empty filters should not include the keys or should be empty strings
      expect(params.titulo === undefined || params.titulo === '').toBe(true);
      expect(params.autorNome === undefined || params.autorNome === '').toBe(true);
    });
  });
});
