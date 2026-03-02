import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';

// ── Helpers ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 60 seconds

/**
 * Format a notification date into a human-friendly relative string.
 * @param {string} dateStr - ISO 8601 date string
 * @returns {string}
 */
function formatRelative(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

/**
 * Resolve a navigation path from a notification.
 * Falls back to order history if no specific link is present.
 * @param {object} notification
 * @returns {string}
 */
function resolveNavigation(notification) {
  if (notification.link) return notification.link;
  if (notification.referencia) return notification.referencia;
  if (notification.tipo) {
    const t = notification.tipo.toLowerCase();
    if (t.includes('pedido') || t.includes('order')) return '/account/orders';
    if (t.includes('troca') || t.includes('exchange')) return '/account/orders';
    if (t.includes('avaliacao') || t.includes('review')) return '/catalog';
  }
  return '/account/orders';
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const styles = `
.notif-bell-wrapper {
  position: relative;
}

.notif-bell-btn {
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.375rem 0.625rem;
  font-size: 1.1rem;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  color: #495057;
}

.notif-bell-btn:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.notif-bell-btn:focus-visible {
  outline: 3px solid rgba(13, 110, 253, 0.4);
}

.notif-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  background: #dc3545;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 9px;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  animation: notif-pulse 0.3s ease;
  pointer-events: none;
}

@keyframes notif-pulse {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 340px;
  max-width: 95vw;
  background: #fff;
  border: 1px solid rgba(0,0,0,.15);
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 1050;
  overflow: hidden;
  animation: notif-slide-in 0.18s ease;
}

@keyframes notif-slide-in {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
  font-weight: 600;
  font-size: 0.9rem;
  color: #212529;
  background: #f8f9fa;
}

.notif-list {
  max-height: 360px;
  overflow-y: auto;
}

.notif-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  transition: background-color 0.12s ease;
  text-align: left;
  width: 100%;
  background: none;
  border-left: none;
  border-right: none;
}

.notif-item:last-child {
  border-bottom: none;
}

.notif-item:hover {
  background-color: #f8f9fa;
}

.notif-item.unread {
  background-color: #eff6ff;
  border-left: 3px solid #0d6efd;
  padding-left: calc(1rem - 3px);
}

.notif-item.unread:hover {
  background-color: #dbeafe;
}

.notif-item-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-item-msg {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.2rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item-meta {
  font-size: 0.72rem;
  color: #adb5bd;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.notif-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0d6efd;
  flex-shrink: 0;
}

.notif-empty {
  padding: 2rem 1rem;
  text-align: center;
  color: #adb5bd;
  font-size: 0.85rem;
}

.notif-footer {
  padding: 0.6rem 1rem;
  border-top: 1px solid #dee2e6;
  text-align: center;
  background: #f8f9fa;
}

.notif-footer a {
  font-size: 0.8rem;
  color: #0d6efd;
  text-decoration: none;
}

.notif-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 576px) {
  .notif-dropdown {
    position: fixed;
    top: 60px;
    right: 0;
    left: 0;
    width: 100%;
    max-width: 100%;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }
}
`;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * NotificationBell
 * @component
 * @description Bell icon in the Navbar that shows unread notification count,
 * polls every 60 seconds, and opens a dropdown with the 5 most recent notifications.
 * Clicking a notification marks it as read and navigates to the relevant page.
 */
const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const wrapperRef = useRef(null);
  const pollRef = useRef(null);

  // ── Fetch unread count ──────────────────────────────────────────────────
  const fetchCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch {
      // silently fail — don't break the navbar
    }
  }, []);

  // ── Fetch notification list ─────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await notificationService.getNotifications({ size: 5 });
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  // ── Poll for unread count ───────────────────────────────────────────────
  useEffect(() => {
    fetchCount();
    pollRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchCount]);

  // ── Fetch list when dropdown opens ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      fetchList();
    }
  }, [open, fetchList]);

  // ── Click outside to close ─────────────────────────────────────────────
  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // ── Keyboard close ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
    }
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // ── Mark notification as read ──────────────────────────────────────────
  const handleNotificationClick = async (notification) => {
    setOpen(false);

    // Optimistically update UI
    const wasUnread =
      notification.status === 'nao-lida' ||
      notification.status === 'NAO_LIDA' ||
      notification.lida === false;

    if (wasUnread) {
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, status: 'lida', lida: true }
            : n
        )
      );
    }

    try {
      await notificationService.markAsRead(notification.id);
    } catch {
      // revert optimistic update on failure
      if (wasUnread) {
        setUnreadCount((c) => c + 1);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, status: notification.status, lida: notification.lida }
              : n
          )
        );
      }
    }

    navigate(resolveNavigation(notification));
  };

  const isUnread = (n) =>
    n.status === 'nao-lida' ||
    n.status === 'NAO_LIDA' ||
    n.lida === false;

  const displayCount = unreadCount > 99 ? '99+' : unreadCount;

  return (
    <>
      {/* Inject styles once */}
      <style>{styles}</style>

      <div className="notif-bell-wrapper" ref={wrapperRef}>
        <button
          className="notif-bell-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
          aria-expanded={open}
          aria-haspopup="true"
          data-testid="notif-bell"
        >
          🔔
          {unreadCount > 0 && (
            <span className="notif-badge" data-testid="notif-badge">
              {displayCount}
            </span>
          )}
        </button>

        {open && (
          <div
            className="notif-dropdown"
            role="dialog"
            aria-label="Notificações recentes"
            data-testid="notif-dropdown"
          >
            <div className="notif-header">
              <span>🔔 Notificações</span>
              {unreadCount > 0 && (
                <span
                  className="badge bg-primary rounded-pill"
                  style={{ fontSize: '0.7rem' }}
                >
                  {displayCount} nova{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="notif-list" role="list">
              {loadingList ? (
                <div className="notif-empty">
                  <div
                    className="spinner-border spinner-border-sm text-primary me-2"
                    role="status"
                  />
                  Carregando…
                </div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty" data-testid="notif-empty">
                  Nenhuma notificação recente.
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    className={`notif-item${isUnread(n) ? ' unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                    role="listitem"
                    data-testid={`notif-item-${n.id}`}
                  >
                    <span className="notif-item-title">
                      {n.titulo || n.title || 'Notificação'}
                    </span>
                    {(n.mensagem || n.message) && (
                      <span className="notif-item-msg">
                        {n.mensagem || n.message}
                      </span>
                    )}
                    <span className="notif-item-meta">
                      {isUnread(n) && <span className="notif-dot" />}
                      <span>
                        {formatRelative(n.dataCriacao || n.createdAt)}
                      </span>
                      {isUnread(n) && <span>• Não lida</span>}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="notif-footer">
              <a
                href="/account/orders"
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  navigate('/account/orders');
                }}
              >
                Ver todos os pedidos
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
