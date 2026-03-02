import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const CartContext = createContext(null);

const CART_SESSION_KEY = 'cart_session';
const CART_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * CartProvider
 * @component
 * @description Provides cart state and actions globally. Persists to localStorage.
 */
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(CART_SESSION_KEY);
    return saved ? JSON.parse(saved).items || [] : [];
  });

  const [expiresAt, setExpiresAt] = useState(() => {
    const saved = localStorage.getItem(CART_SESSION_KEY);
    return saved ? JSON.parse(saved).expiresAt : Date.now() + CART_TTL_MS;
  });

  // Persist cart to localStorage whenever items or expiresAt changes
  useEffect(() => {
    localStorage.setItem(CART_SESSION_KEY, JSON.stringify({ items, expiresAt }));
  }, [items, expiresAt]);

  // Reset expiration when cart changes
  useEffect(() => {
    if (items.length > 0) {
      setExpiresAt(Date.now() + CART_TTL_MS);
    }
  }, [items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const addItem = (book, quantity = 1) => {
    // Normalize quantity to integer
    const normalizedQty = Math.floor(Number(quantity));

    // RN0031: Validar quantidade antes de adicionar
    if (normalizedQty <= 0) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    const existing = items.find((i) => i.id === book.id);
    const currentQty = existing ? existing.quantity : 0;
    const newTotal = currentQty + normalizedQty;
    const availableStock = book.estoque?.quantidadeDisponivel;

    // RN0031: Validar estoque disponível (se informado)
    if (availableStock !== undefined && newTotal > availableStock) {
      throw new Error(
        `Quantidade indisponível em estoque. Disponível: ${availableStock}, Solicitado: ${newTotal}`
      );
    }

    if (existing) {
      setItems(
        items.map((i) => (i.id === book.id ? { ...i, quantity: newTotal } : i))
      );
    } else {
      setItems([...items, { ...book, quantity: normalizedQty, addedAt: new Date().toISOString() }]);
    }
  };

  const removeItem = (bookId) => {
    setItems(items.filter((i) => i.id !== bookId));
  };

  const updateQuantity = (bookId, quantity) => {
    if (quantity <= 0) {
      removeItem(bookId);
      return;
    }

    // RN0031: Validar estoque disponível ao atualizar quantidade
    const item = items.find((i) => i.id === bookId);
    if (item) {
      const availableStock = item.estoque?.quantidadeDisponivel;
      if (availableStock !== undefined && quantity > availableStock) {
        throw new Error(
          `Quantidade indisponível em estoque. Disponível: ${availableStock}, Solicitado: ${quantity}`
        );
      }
      setItems(items.map((i) => (i.id === bookId ? { ...i, quantity } : i)));
    }
  };

  const clear = () => {
    setItems([]);
    localStorage.removeItem(CART_SESSION_KEY);
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const totalPrice = items.reduce((sum, i) => {
    const price = i.precoVenda || i.price || 0;
    return sum + price * i.quantity;
  }, 0);

  const isExpired = Date.now() > expiresAt;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clear,
        expiresAt,
        totalItems,
        totalPrice,
        isExpired,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

export default CartContext;
