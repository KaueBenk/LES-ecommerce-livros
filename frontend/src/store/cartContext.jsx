import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import cartService from '../services/cartService';
import logger from '@utils/logger';

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
    try {
      logger.logCart('SYNC_START', { fonte: 'backend' });
      const data = await cartService.getCart();
      const nextItems = (data?.itens || []).map(mapServerItemToLocal);
      const nextExpiresAt = data?.expiresAt
        ? new Date(data.expiresAt).getTime()
        : Date.now() + CART_TTL_MS;

      setItems(nextItems);
      setExpiresAt(nextExpiresAt);
      persistLocalSession(nextItems, nextExpiresAt);
      
      logger.logCart('SYNC_SUCCESS', { 
        totalItens: nextItems.length,
        expiresAt: new Date(nextExpiresAt).toISOString()
      });
      
      return data;
    } catch (error) {
      logger.logCart('SYNC_ERROR', { erro: error.message });
      throw error;
    }
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

    logger.logCart('ADD_ITEM', { 
      livroId: book.id, 
      titulo: book.titulo,
      quantidade: normalizedQty,
      autenticado: hasAuthToken()
    });

    if (hasAuthToken()) {
      await cartService.addItem(book.id, normalizedQty);
      await syncFromBackend();
      logger.logCart('ADD_ITEM_SUCCESS', { livroId: book.id, quantidade: normalizedQty });
      return;
    }

    const existing = items.find((i) => i.id === book.id);
    const currentQty = existing ? existing.quantity : 0;
    const newTotal = currentQty + normalizedQty;
    const availableStock = book.estoque?.quantidadeDisponivel;

    if (availableStock !== undefined && newTotal > availableStock) {
      logger.logWarn('CART', 'Estoque insuficiente', { 
        livroId: book.id, 
        disponivel: availableStock, 
        solicitado: newTotal 
      });
      throw new Error(
        `Quantidade indisponível em estoque. Disponível: ${availableStock}, Solicitado: ${newTotal}`,
      );
    }

    if (existing) {
      setItems(items.map((i) => (i.id === book.id ? { ...i, quantity: newTotal } : i)));
    } else {
      setItems([...items, { ...book, quantity: normalizedQty, addedAt: new Date().toISOString() }]);
    }
    
    logger.logCart('ADD_ITEM_SUCCESS', { livroId: book.id, quantidade: normalizedQty, local: true });
  };

  const resolveServerItem = (bookIdOrServerItemId) =>
    items.find((i) => i.id === bookIdOrServerItemId || i.serverItemId === bookIdOrServerItemId);

  const removeItem = async (bookIdOrServerItemId) => {
    logger.logCart('REMOVE_ITEM', { itemId: bookIdOrServerItemId, autenticado: hasAuthToken() });
    
    if (hasAuthToken()) {
      const item = resolveServerItem(bookIdOrServerItemId);
      if (!item?.serverItemId) return;
      await cartService.removeItem(item.serverItemId);
      await syncFromBackend();
      logger.logCart('REMOVE_ITEM_SUCCESS', { itemId: bookIdOrServerItemId });
      return;
    }

    setItems(items.filter((i) => i.id !== bookIdOrServerItemId));
    logger.logCart('REMOVE_ITEM_SUCCESS', { itemId: bookIdOrServerItemId, local: true });
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
