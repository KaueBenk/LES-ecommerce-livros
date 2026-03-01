import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import useNotification from '../hooks/useNotification';
import useCartTimer from '../hooks/useCartTimer';
import cartService from '../services/cartService';
import { formatCurrency } from '../utils/formatters';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FRETE_FIXO = 10;
const POLL_INTERVAL_MS = 30_000; // 30 seconds

// ─── Book cover placeholder ───────────────────────────────────────────────────

const CoverPlaceholder = () => (
  <div
    className="d-flex align-items-center justify-content-center bg-light rounded"
    style={{ width: 56, height: 72, flexShrink: 0 }}
    aria-hidden="true"
  >
    <span style={{ fontSize: '1.5rem' }}>📚</span>
  </div>
);

// ─── Quantity input ───────────────────────────────────────────────────────────

const QuantityInput = ({ itemId, value, onCommit, disabled }) => {
  const [localQty, setLocalQty] = useState(value);

  useEffect(() => {
    setLocalQty(value);
  }, [value]);

  const commit = (qty) => {
    const clamped = Math.max(1, Math.min(99, Number(qty)));
    if (clamped !== value) onCommit(itemId, clamped);
    else setLocalQty(value); // revert if unchanged
  };

  return (
    <div className="d-flex align-items-center gap-1" data-testid={`qty-ctrl-${itemId}`}>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => commit(localQty - 1)}
        disabled={disabled || localQty <= 1}
        aria-label="Diminuir"
        data-testid={`decrease-qty-${itemId}`}
      >
        −
      </button>
      <input
        type="number"
        className="form-control form-control-sm text-center"
        style={{ width: 56 }}
        min={1}
        max={99}
        value={localQty}
        onChange={(e) => setLocalQty(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit(localQty)}
        disabled={disabled}
        data-testid={`qty-input-${itemId}`}
      />
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={() => commit(localQty + 1)}
        disabled={disabled || localQty >= 99}
        aria-label="Aumentar"
        data-testid={`increase-qty-${itemId}`}
      >
        +
      </button>
    </div>
  );
};

// ─── Countdown badge ──────────────────────────────────────────────────────────

const CountdownBadge = ({ timer }) => {
  if (!timer) return null;
  if (timer.isExpired) {
    return (
      <span className="badge bg-danger" data-testid="timer-expired">
        Expirado
      </span>
    );
  }
  if (timer.isWarning) {
    return (
      <span className="badge bg-warning text-dark" data-testid="timer-warning">
        ⚠ {timer.display}
      </span>
    );
  }
  return (
    <span className="badge bg-light text-secondary border" data-testid="timer-normal">
      ⏱ {timer.display}
    </span>
  );
};

// ─── CartPage ─────────────────────────────────────────────────────────────────

/**
 * CartPage
 * @component
 * @description Shopping cart page — fetches from API, supports inline qty editing,
 *   item removal, cart clearing, countdown timers per item, and navigates to checkout.
 */
const CartPage = () => {
  usePageTitle('Carrinho');
  const navigate = useNavigate();
  const { success, error: notifyError, warn: notifyWarn } = useNotification();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null); // item id being updated
  const [clearing, setClearing] = useState(false);

  // Track which items we've already auto-removed to avoid duplicate removals
  const autoRemovedRef = useRef(new Set());

  const fetchCart = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFetchError(null);
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      if (!silent) setFetchError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Polling every 30 seconds (silent refresh)
  useEffect(() => {
    const id = setInterval(() => fetchCart(true), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchCart]);

  // ── Timer callbacks ──
  const handleItemWarn = useCallback(
    (item) => {
      notifyWarn(
        `Atenção: "${item.titulo}" expira em menos de 5 minutos! Finalize sua compra.`
      );
    },
    [notifyWarn]
  );

  const handleItemExpired = useCallback(
    (item) => {
      // Auto-remove if not already in progress
      if (autoRemovedRef.current.has(item.id)) return;
      autoRemovedRef.current.add(item.id);
      cartService
        .removeItem(item.id)
        .then(() => {
          notifyError(
            `"${item.titulo}" foi removido do carrinho por inatividade (reserva expirada).`
          );
          fetchCart(true);
        })
        .catch(() => {
          // If backend already cleaned it, just refresh
          fetchCart(true);
        });
    },
    [notifyError, fetchCart]
  );

  const itens = cart?.itens ?? [];

  // Per-item countdown timers
  const { timers, hasAnyExpired, hasAnyWarning } = useCartTimer(
    itens,
    cart?.expiresAt ?? null,
    { onWarn: handleItemWarn, onExpired: handleItemExpired }
  );

  // ── Update quantity ──
  const handleUpdateQty = async (itemId, newQty) => {
    setUpdatingId(itemId);
    try {
      await cartService.updateItem(itemId, newQty);
      await fetchCart(true);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao atualizar quantidade.');
      await fetchCart(true); // revert to server state
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Remove item ──
  const handleRemove = async (itemId, titulo) => {
    if (!window.confirm(`Remover "${titulo}" do carrinho?`)) return;
    setUpdatingId(itemId);
    try {
      await cartService.removeItem(itemId);
      success(`"${titulo}" removido do carrinho.`);
      await fetchCart(true);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao remover item.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Clear cart ──
  const handleClear = async () => {
    if (!window.confirm('Deseja esvaziar todo o carrinho?')) return;
    setClearing(true);
    try {
      await cartService.clearCart();
      success('Carrinho esvaziado.');
      await fetchCart(true);
    } catch (err) {
      notifyError(getErrorMessage(err) || 'Erro ao esvaziar o carrinho.');
    } finally {
      setClearing(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="container page-container" data-testid="cart-page">
        <LoadingSpinner />
      </div>
    );
  }

  // ── Fetch error ──
  if (fetchError) {
    return (
      <div className="container page-container" data-testid="cart-page">
        <div className="alert alert-danger" data-testid="cart-error">
          {fetchError}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => fetchCart()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const valorSubtotal = cart?.valorSubtotal ?? itens.reduce((s, i) => s + i.subtotal, 0);
  const valorFrete = itens.length > 0 ? (cart?.valorFrete ?? FRETE_FIXO) : 0;
  const valorTotal = cart?.valorTotal ?? valorSubtotal + valorFrete;

  // ── Empty cart ──
  if (itens.length === 0) {
    return (
      <div className="container page-container text-center" data-testid="cart-page">
        <h1 className="mb-4">Carrinho</h1>
        <p className="text-muted mb-4" data-testid="cart-empty">
          Seu carrinho está vazio.
        </p>
        <Link to={ROUTES.CATALOG} className="btn btn-primary">
          Ir ao Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container page-container" data-testid="cart-page">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h1 className="mb-0">
          Carrinho{' '}
          <span className="text-muted fs-5" data-testid="cart-total-items">
            ({cart?.totalItens ?? itens.reduce((s, i) => s + i.quantidade, 0)} itens)
          </span>
        </h1>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          onClick={handleClear}
          disabled={clearing}
          data-testid="clear-cart-btn"
        >
          {clearing ? (
            <>
              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
              Esvaziando...
            </>
          ) : (
            'Esvaziar Carrinho'
          )}
        </button>
      </div>

      {/* Expired items banner */}
      {hasAnyExpired && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" data-testid="cart-expired-banner">
          <span>⛔</span>
          <span>
            Um ou mais itens expiraram. Eles serão removidos automaticamente.
            Você não pode finalizar a compra até que sejam resolvidos.
          </span>
        </div>
      )}

      {/* Warning banner */}
      {!hasAnyExpired && hasAnyWarning && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3" data-testid="cart-warning-banner">
          <span>⚠️</span>
          <span>
            Um ou mais itens estão prestes a expirar. Finalize sua compra em breve!
          </span>
        </div>
      )}

      <div className="row g-4">
        {/* Items table */}
        <div className="col-lg-8">
          <div className="table-responsive">
            <table className="table align-middle" data-testid="cart-table">
              <thead className="table-light">
                <tr>
                  <th colSpan={2}>Livro</th>
                  <th className="text-end">Preço Unit.</th>
                  <th className="text-center">Qtd</th>
                  <th className="text-end">Subtotal</th>
                  <th className="text-center">Reserva</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => {
                  const isUpdating = updatingId === item.id;
                  const timer = timers[item.id];
                  const isExpiredItem = timer?.isExpired ?? false;
                  return (
                    <tr
                      key={item.id}
                      data-testid={`cart-item-${item.id}`}
                      className={isExpiredItem ? 'table-danger opacity-75' : ''}
                    >
                      {/* Cover */}
                      <td style={{ width: 72 }}>
                        <CoverPlaceholder />
                      </td>
                      {/* Title */}
                      <td>
                        <span className="fw-semibold" data-testid={`item-titulo-${item.id}`}>
                          {item.titulo}
                        </span>
                      </td>
                      {/* Unit price */}
                      <td className="text-end text-nowrap" data-testid={`item-preco-${item.id}`}>
                        {formatCurrency(item.valorUnitario)}
                      </td>
                      {/* Quantity */}
                      <td className="text-center">
                        <QuantityInput
                          itemId={item.id}
                          value={item.quantidade}
                          onCommit={handleUpdateQty}
                          disabled={isUpdating || clearing || isExpiredItem}
                        />
                        {isUpdating && (
                          <div className="mt-1">
                            <small className="text-muted" data-testid={`updating-${item.id}`}>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                              Atualizando...
                            </small>
                          </div>
                        )}
                      </td>
                      {/* Subtotal */}
                      <td className="text-end text-nowrap fw-semibold" data-testid={`item-subtotal-${item.id}`}>
                        {formatCurrency(item.subtotal)}
                      </td>
                      {/* Countdown timer */}
                      <td className="text-center text-nowrap" data-testid={`item-timer-${item.id}`}>
                        <CountdownBadge timer={timer} />
                      </td>
                      {/* Remove */}
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRemove(item.id, item.titulo)}
                          disabled={isUpdating || clearing}
                          aria-label={`Remover ${item.titulo}`}
                          data-testid={`remove-item-${item.id}`}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-muted small" data-testid="cart-timer-note">
            * Os itens ficam reservados por{' '}
            {localStorage.getItem('cart_item_ttl_minutes') ?? 30} min.
            O carrinho é sincronizado automaticamente a cada 30 segundos.
          </p>
        </div>

        {/* Summary */}
        <div className="col-lg-4">
          <div className="card" data-testid="cart-summary">
            <div className="card-body">
              <h5 className="card-title mb-3">Resumo do Pedido</h5>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">{formatCurrency(valorSubtotal)}</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span>Frete</span>
                <span data-testid="cart-frete">{formatCurrency(valorFrete)}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between fw-bold fs-5 mb-4">
                <span>Total</span>
                <span data-testid="cart-total">{formatCurrency(valorTotal)}</span>
              </div>

              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={() => navigate(ROUTES.CHECKOUT)}
                disabled={hasAnyExpired}
                title={hasAnyExpired ? 'Remova os itens expirados antes de finalizar' : ''}
                data-testid="checkout-btn"
              >
                Finalizar Compra
              </button>

              {hasAnyExpired && (
                <p className="text-danger small mt-2 mb-0" data-testid="checkout-blocked-msg">
                  Remova os itens expirados para continuar.
                </p>
              )}

              <Link
                to={ROUTES.CATALOG}
                className="btn btn-outline-secondary w-100 mt-2"
                data-testid="continue-shopping-btn"
              >
                Continuar Comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
