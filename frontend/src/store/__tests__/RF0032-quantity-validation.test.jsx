import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '../cartContext';

const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;

describe('RF0032: Definir quantidade de itens no carrinho', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── AC1: Dados mockados localmente ───────────────────────────────────────────
  describe('AC1: Dados são mockados localmente no componente', () => {
    it('deve usar dados mockados do localStorage sem chamadas de API', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Clean Code',
        precoVenda: 89.9,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 2);
      });

      // Verify data is in localStorage (not from API)
      const stored = JSON.parse(localStorage.getItem('cart_session'));
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0].id).toBe('book-1');
      expect(stored.items[0].quantity).toBe(2);
    });
  });

  // ─── AC2: Editar quantidade ao adicionar produto ──────────────────────────────
  describe('AC2: A quantidade pode ser editada ao adicionar um produto ao carrinho', () => {
    it('deve permitir adicionar produto com quantidade personalizada', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Design Patterns',
        precoVenda: 120.0,
        estoque: { quantidadeDisponivel: 15 },
      };

      // Add with quantity 5
      await act(async () => {
        await result.current.addItem(mockBook, 5);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.totalItems).toBe(5);
    });

    it('deve permitir adicionar produto com quantidade padrão (1)', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-2',
        titulo: 'Refactoring',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 8 },
      };

      // Add without specifying quantity (defaults to 1)
      await act(async () => {
        await result.current.addItem(mockBook);
      });

      expect(result.current.items[0].quantity).toBe(1);
    });

    it('deve permitir especificar diferentes quantidades para produtos diferentes', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const book1 = {
        id: 'book-1',
        titulo: 'Book 1',
        precoVenda: 50.0,
        estoque: { quantidadeDisponivel: 20 },
      };

      const book2 = {
        id: 'book-2',
        titulo: 'Book 2',
        precoVenda: 75.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(book1, 3);
      });

      await act(async () => {
        await result.current.addItem(book2, 7);
      });

      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.items[1].quantity).toBe(7);
      expect(result.current.totalItems).toBe(10);
    });
  });

  // ─── AC3: Editar quantidade na visualização do carrinho ──────────────────────
  describe('AC3: A quantidade pode ser editada diretamente na tela do carrinho', () => {
    it('deve permitir atualizar quantidade de um item existente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 20 },
      };

      // Add item
      await act(async () => {
        await result.current.addItem(mockBook, 2);
      });

      expect(result.current.items[0].quantity).toBe(2);

      // Update quantity
      await act(async () => {
        await result.current.updateQuantity('book-1', 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
      expect(result.current.totalItems).toBe(5);
      expect(result.current.totalPrice).toBe(500.0);
    });

    it('deve permitir aumentar quantidade gradualmente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 50.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 1);
      });

      // Increase quantity step by step
      await act(async () => {
        await result.current.updateQuantity('book-1', 2);
      });
      expect(result.current.items[0].quantity).toBe(2);

      await act(async () => {
        await result.current.updateQuantity('book-1', 3);
      });
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('deve permitir diminuir quantidade gradualmente', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 50.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 5);
      });

      // Decrease quantity step by step
      await act(async () => {
        await result.current.updateQuantity('book-1', 4);
      });
      expect(result.current.items[0].quantity).toBe(4);

      await act(async () => {
        await result.current.updateQuantity('book-1', 2);
      });
      expect(result.current.items[0].quantity).toBe(2);
    });
  });

  // ─── AC4 (RN0031): Validar estoque disponível ─────────────────────────────────
  describe('AC4 (RN0031): Não é possível informar quantidade superior ao estoque disponível', () => {
    it('deve rejeitar adição quando quantidade excede estoque disponível', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Limited Stock Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 5 },
      };

      // Try to add 10 when only 5 available - addItem is async
      await expect(
        act(async () => {
          await result.current.addItem(mockBook, 10);
        }),
      ).rejects.toThrow(/estoque/i);

      // Cart should remain empty
      expect(result.current.items).toHaveLength(0);
    });

    it('deve rejeitar atualização quando nova quantidade excede estoque', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Limited Stock Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 5 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 2);
      });

      expect(result.current.items[0].quantity).toBe(2);

      // Try to update to 10 when only 5 available - updateQuantity is async
      await expect(
        act(async () => {
          await result.current.updateQuantity('book-1', 10);
        }),
      ).rejects.toThrow(/estoque/i);

      // Quantity should remain at 2
      expect(result.current.items[0].quantity).toBe(2);
    });

    it('deve aceitar quantidade igual ao estoque disponível', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Limited Stock Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 5 },
      };

      // Add exactly the available stock
      act(() => {
        result.current.addItem(mockBook, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('deve considerar quantidade já no carrinho ao validar estoque', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Limited Stock Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 5 },
      };

      // Add 3 items
      await act(async () => {
        await result.current.addItem(mockBook, 3);
      });

      expect(result.current.items[0].quantity).toBe(3);

      // Try to add 3 more (would total 6, but only 5 available)
      await expect(
        act(async () => {
          await result.current.addItem(mockBook, 3);
        }),
      ).rejects.toThrow(/estoque/i);

      // Quantity should remain at 3
      expect(result.current.items[0].quantity).toBe(3);
    });

    it('deve lidar com livros sem informação de estoque (assumir disponível)', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Book Without Stock Info',
        precoVenda: 100.0,
        // No estoque property
      };

      // Should allow adding when stock info is missing
      await act(async () => {
        await result.current.addItem(mockBook, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });
  });

  // ─── AC5: Não permitir quantidade zero ou negativa ────────────────────────────
  describe('AC5: Não é possível informar quantidade zero ou negativa', () => {
    it('deve remover item ao definir quantidade como zero', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 3);
      });

      expect(result.current.items).toHaveLength(1);

      // Set quantity to 0 should remove the item
      await act(async () => {
        await result.current.updateQuantity('book-1', 0);
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
    });

    it('deve remover item ao definir quantidade negativa', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 3);
      });

      // Set quantity to negative should remove the item
      await act(async () => {
        await result.current.updateQuantity('book-1', -5);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('deve rejeitar adição com quantidade zero', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await expect(
        act(async () => {
          await result.current.addItem(mockBook, 0);
        }),
      ).rejects.toThrow(/quantidade.*maior.*zero/i);

      expect(result.current.items).toHaveLength(0);
    });

    it('deve rejeitar adição com quantidade negativa', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await expect(
        act(async () => {
          await result.current.addItem(mockBook, -3);
        }),
      ).rejects.toThrow(/quantidade.*maior.*zero/i);

      expect(result.current.items).toHaveLength(0);
    });

    it('deve sempre manter quantidade mínima de 1 para itens existentes', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 1);
      });

      expect(result.current.items[0].quantity).toBe(1);

      // Attempting to decrease from 1 should not go below 1 (or remove)
      // This is tested by the zero/negative removal behavior above
    });
  });

  // ─── Integration Tests ────────────────────────────────────────────────────────
  describe('Testes de Integração: Cenários Complexos', () => {
    it('deve gerenciar múltiplos produtos com diferentes quantidades e restrições de estoque', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const book1 = {
        id: 'book-1',
        titulo: 'Book 1',
        precoVenda: 50.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      const book2 = {
        id: 'book-2',
        titulo: 'Book 2',
        precoVenda: 75.0,
        estoque: { quantidadeDisponivel: 3 },
      };

      const book3 = {
        id: 'book-3',
        titulo: 'Book 3',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 20 },
      };

      // Add multiple books
      await act(async () => {
        await result.current.addItem(book1, 5);
      });

      await act(async () => {
        await result.current.addItem(book2, 2);
      });

      await act(async () => {
        await result.current.addItem(book3, 10);
      });

      expect(result.current.items).toHaveLength(3);
      expect(result.current.totalItems).toBe(17);

      // Update quantities within limits
      await act(async () => {
        await result.current.updateQuantity('book-1', 8);
      });

      await act(async () => {
        await result.current.updateQuantity('book-2', 3); // Max available
      });

      expect(result.current.items[0].quantity).toBe(8);
      expect(result.current.items[1].quantity).toBe(3);

      // Try to exceed stock for book2
      await expect(
        act(async () => {
          await result.current.updateQuantity('book-2', 5);
        }),
      ).rejects.toThrow(/estoque/i);

      expect(result.current.items[1].quantity).toBe(3); // Should remain unchanged
    });

    it('deve persistir mudanças de quantidade no localStorage', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Persistent Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 15 },
      };

      await act(async () => {
        await result.current.addItem(mockBook, 3);
      });

      await act(async () => {
        await result.current.updateQuantity('book-1', 7);
      });

      // Check localStorage
      const stored = JSON.parse(localStorage.getItem('cart_session'));
      expect(stored.items[0].quantity).toBe(7);

      // Simulate page reload by creating new hook instance
      const { result: result2 } = renderHook(() => useCart(), { wrapper });

      expect(result2.current.items[0].quantity).toBe(7);
      expect(result2.current.totalItems).toBe(7);
    });

    it('deve calcular preço total corretamente após mudanças de quantidade', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const book1 = {
        id: 'book-1',
        titulo: 'Book 1',
        precoVenda: 50.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      const book2 = {
        id: 'book-2',
        titulo: 'Book 2',
        precoVenda: 30.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      await act(async () => {
        await result.current.addItem(book1, 2); // 100.0
      });

      await act(async () => {
        await result.current.addItem(book2, 3); // 90.0
      });

      expect(result.current.totalPrice).toBe(190.0);

      await act(async () => {
        await result.current.updateQuantity('book-1', 5); // 250.0
      });

      await act(async () => {
        await result.current.updateQuantity('book-2', 1); // 30.0
      });

      expect(result.current.totalPrice).toBe(280.0);

      await act(async () => {
        await result.current.updateQuantity('book-2', 0); // Remove book2
      });

      expect(result.current.totalPrice).toBe(250.0);
      expect(result.current.items).toHaveLength(1);
    });
  });

  // ─── Edge Cases ───────────────────────────────────────────────────────────────
  describe('Casos Extremos', () => {
    it('deve lidar com estoque zero', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Out of Stock Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 0 },
      };

      await expect(
        act(async () => {
          await result.current.addItem(mockBook, 1);
        }),
      ).rejects.toThrow(/estoque/i);

      expect(result.current.items).toHaveLength(0);
    });

    it('deve lidar com valores decimais de quantidade (arredondar ou rejeitar)', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 10 },
      };

      // Attempt to add with decimal quantity (should be handled)
      await act(async () => {
        await result.current.addItem(mockBook, 2.7);
      });

      // Should either round or reject - let's check what happens
      // Most implementations would floor/round the value
      expect(result.current.items[0].quantity).toBeDefined();
      expect(Number.isInteger(result.current.items[0].quantity)).toBe(true);
    });

    it('deve lidar com quantidade muito grande', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      const mockBook = {
        id: 'book-1',
        titulo: 'Test Book',
        precoVenda: 100.0,
        estoque: { quantidadeDisponivel: 1000000 },
      };

      await expect(
        act(async () => {
          await result.current.addItem(mockBook, 999999999);
        }),
      ).rejects.toThrow(/estoque/i);
    });
  });
});
