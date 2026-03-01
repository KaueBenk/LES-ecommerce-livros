import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useCartTimer
 * @description Computes per-item countdown timers for cart items.
 *
 * Each item has a `bloqueadoEm` ISO timestamp (when it was reserved).
 * The TTL defaults to 30 minutes but is overridable via
 * `localStorage.getItem('cart_item_ttl_minutes')`.
 *
 * Returns:
 *  - timers: { [itemId]: { secsLeft, isWarning, isExpired, display } }
 *  - hasAnyExpired: boolean — true when at least one item is expired
 *  - hasAnyWarning: boolean — true when at least one item is in 5-min warning
 *
 * @param {Array}    items        Cart items with `id` and `bloqueadoEm` fields.
 * @param {string}   cartExpiresAt ISO string for cart-level expiry (fallback).
 * @param {Object}   callbacks
 * @param {Function} callbacks.onWarn    Called (item) when item enters ≤5 min warning.
 * @param {Function} callbacks.onExpired Called (item) when item expires.
 */
const useCartTimer = (items = [], cartExpiresAt = null, { onWarn, onExpired } = {}) => {
  // Per-item timer state: { [id]: { secsLeft, isWarning, isExpired, display } }
  const [timers, setTimers] = useState({});

  // Track which items we've already fired warn/expired notifications for
  const warnedRef = useRef(new Set());
  const expiredRef = useRef(new Set());

  // Configurable TTL (minutes)
  const getTtlMs = useCallback(() => {
    const stored = localStorage.getItem('cart_item_ttl_minutes');
    const minutes = stored ? parseFloat(stored) : 30;
    return (isNaN(minutes) || minutes <= 0 ? 30 : minutes) * 60 * 1000;
  }, []);

  // Format seconds → HH:MM:SS
  const formatCountdown = (secsLeft) => {
    if (secsLeft <= 0) return '00:00:00';
    const h = Math.floor(secsLeft / 3600);
    const m = Math.floor((secsLeft % 3600) / 60);
    const s = secsLeft % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // Recompute timers and fire callbacks
  const tick = useCallback(() => {
    const ttlMs = getTtlMs();
    const now = Date.now();

    const next = {};

    items.forEach((item) => {
      // Determine expiry: prefer item-level bloqueadoEm + TTL,
      // fall back to cart-level expiresAt.
      let expiryMs;
      if (item.bloqueadoEm) {
        expiryMs = new Date(item.bloqueadoEm).getTime() + ttlMs;
      } else if (cartExpiresAt) {
        expiryMs = new Date(cartExpiresAt).getTime();
      } else {
        // No expiry info available — treat as 30 min from now (won't fire notifications)
        expiryMs = now + ttlMs;
      }

      const msLeft = expiryMs - now;
      const secsLeft = Math.max(0, Math.ceil(msLeft / 1000));
      const isExpired = secsLeft === 0;
      const isWarning = !isExpired && secsLeft <= 5 * 60; // ≤5 minutes

      next[item.id] = {
        secsLeft,
        isWarning,
        isExpired,
        display: formatCountdown(secsLeft),
        expiryMs,
      };

      // Fire warning notification once
      if (isWarning && !isExpired && !warnedRef.current.has(item.id)) {
        warnedRef.current.add(item.id);
        if (onWarn) onWarn(item);
      }

      // Fire expired notification once
      if (isExpired && !expiredRef.current.has(item.id)) {
        expiredRef.current.add(item.id);
        if (onExpired) onExpired(item);
      }
    });

    setTimers(next);
  }, [items, cartExpiresAt, getTtlMs, onWarn, onExpired]);

  // Reset warning/expired tracking when item list changes (item removed/added)
  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    // Remove stale entries from refs
    for (const id of warnedRef.current) {
      if (!currentIds.has(id)) warnedRef.current.delete(id);
    }
    for (const id of expiredRef.current) {
      if (!currentIds.has(id)) expiredRef.current.delete(id);
    }
    // Run immediately on mount/change
    tick();
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick every second
  useEffect(() => {
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  const hasAnyExpired = Object.values(timers).some((t) => t.isExpired);
  const hasAnyWarning = Object.values(timers).some((t) => t.isWarning);

  return { timers, hasAnyExpired, hasAnyWarning };
};

export default useCartTimer;
