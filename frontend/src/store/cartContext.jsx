import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import cartService from '../services/cartService';

const CartContext = createContext(null);

const CART_SESSION_KEY = 'cart_session';
const CART_TTL_MS = 30 * 60 * 1000; // 30 minutes

const hasAuthToken = () => Boolean(localStorage.getItem('auth_token'));

const mapServerItemToLocal = (item) => ({
  id: item.livroId ?? item.id,
  quantity: item.quantidade,
  precoVenda: item.valorUnitario,
  price: item.valorUnitario,
  titulo: item.titulo,
  subtotal: item.subtotal,
  bloqueadoEm: item.bloqueadoEm,
  serverItemId: item.id,
});

/**
 * CartProvider
 * @component
 * @description Provides cart state and actions globally. It keeps legacy local-storage
 * behaviour for anonymous sessions, and syncs with backend cart APIs for authenticated users.
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
  const [nowMs, setNowMs] = useState(() => Date.now());

  const persistLocalSession = useCallback((nextItems, nextExpiresAt) => {
    localStorage.setItem(
      CART_SESSION_KEY,
      JSON.stringify({ items: nextItems, expiresAt: nextExpiresAt }),
    );
  }, []);

  const syncFromBackend = useCallback(async () => {
    const data = await cartService.getCart();
    const nextItems = (data?.itens || []).map(mapServerItemToLocal);
    const nextExpiresAt = data?.expiresAt
      ? new Date(data.expiresAt).getTime()
      : Date.now() + CART_TTL_MS;

    setItems(nextItems);
    setExpiresAt(nextExpiresAt);
    persistLocalSession(nextItems, nextExpiresAt);
    return data;
  }, [persistLocalSession]);

  // Keep local session persisted (legacy + non-auth flows)
  useEffect(() => {
    persistLocalSession(items, expiresAt);
  }, [items, expiresAt, persistLocalSession]);

  // Reset expiration when cart changes locally
  useEffect(() => {
    if (items.length > 0 && !hasAuthToken()) {
      setExpiresAt(Date.now() + CART_TTL_MS);
    }
  }, [items.length]);

  // Initial backend sync when user is already authenticated
  useEffect(() => {
    if (!hasAuthToken()) return;
    syncFromBackend().catch(() => undefined);
  }, [syncFromBackend]);

  // React to login/logout in the same tab or other tabs
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key && event.key !== 'auth_token') return;

      if (!hasAuthToken()) {
        setItems([]);
        const nextExpiresAt = Date.now() + CART_TTL_MS;
        setExpiresAt(nextExpiresAt);
        persistLocalSession([], nextExpiresAt);
        return;
      }

      syncFromBackend().catch(() => undefined);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [persistLocalSession, syncFromBackend]);

  const addItem = async (book, quantity = 1) => {
    const normalizedQty = Math.floor(Number(quantity));
    if (normalizedQty <= 0) {
      throw new Error('A quantidade deve ser maior que zero.');
    }

    if (hasAuthToken()) {
      await cartService.addItem(book.id, normalizedQty);
      await syncFromBackend();
      return;
    }

    const existing = items.find((i) => i.id === book.id);
    const currentQty = existing ? existing.quantity : 0;
    const newTotal = currentQty + normalizedQty;
    const availableStock = book.estoque?.quantidadeDisponivel;

    if (availableStock !== undefined && newTotal > availableStock) {
      throw new Error(
        `Quantidade indisponível em estoque. Disponível: ${availableStock}, Solicitado: ${newTotal}`,
      );
    }

    if (existing) {
      setItems(items.map((i) => (i.id === book.id ? { ...i, quantity: newTotal } : i)));
    } else {
      setItems([...items, { ...book, quantity: normalizedQty, addedAt: new Date().toISOString() }]);
    }
  };

  const resolveServerItem = (bookIdOrServerItemId) =>
    items.find((i) => i.id === bookIdOrServerItemId || i.serverItemId === bookIdOrServerItemId);

  const removeItem = async (bookIdOrServerItemId) => {
    if (hasAuthToken()) {
      const item = resolveServerItem(bookIdOrServerItemId);
      if (!item?.serverItemId) return;
      await cartService.removeItem(item.serverItemId);
      await syncFromBackend();
      return;
    }

    setItems(items.filter((i) => i.id !== bookIdOrServerItemId));
  };

  const updateQuantity = async (bookIdOrServerItemId, quantity) => {
    if (quantity <= 0) {
      await removeItem(bookIdOrServerItemId);
      return;
    }

    if (hasAuthToken()) {
      const item = resolveServerItem(bookIdOrServerItemId);
      if (!item?.serverItemId) return;
      await cartService.updateItem(item.serverItemId, quantity);
      await syncFromBackend();
      return;
    }

    const item = items.find((i) => i.id === bookIdOrServerItemId);
    if (item) {
      const availableStock = item.estoque?.quantidadeDisponivel;
      if (availableStock !== undefined && quantity > availableStock) {
        throw new Error(
          `Quantidade indisponível em estoque. Disponível: ${availableStock}, Solicitado: ${quantity}`,
        );
      }
      setItems(items.map((i) => (i.id === bookIdOrServerItemId ? { ...i, quantity } : i)));
    }
  };

  const clear = async () => {
    if (hasAuthToken()) {
      await cartService.clearCart();
      await syncFromBackend();
      return;
    }

    setItems([]);
    localStorage.removeItem(CART_SESSION_KEY);
  };

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const totalPrice = useMemo(() => {
    return items.reduce((sum, i) => {
      const price = i.precoVenda || i.price || 0;
      return sum + price * i.quantity;
    }, 0);
  }, [items]);

  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const isExpired = nowMs > expiresAt;

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
