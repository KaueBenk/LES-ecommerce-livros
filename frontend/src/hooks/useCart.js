/**
 * useCart hook — exposes cart state and actions.
 * @returns {{ items, addItem, removeItem, updateQuantity, clear, expiresAt, totalItems, totalPrice, isExpired }}
 */
export { useCart as default } from '../store/cartContext';
