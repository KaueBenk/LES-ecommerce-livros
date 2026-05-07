import React, { createContext, useContext, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import logger from '@utils/logger';

const NotificationContext = createContext(null);

let notificationId = 0;

/**
 * NotificationProvider
 * @component
 * @description Provides toast/notification system globally.
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = ++notificationId;
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
    
    logger.logInfo('NOTIFICATION', 'Notificação exibida', { tipo: type, mensagem: message });
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    return id;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback(
    (message, duration) => addNotification(message, 'success', duration),
    [addNotification]
  );

  const error = useCallback(
    (message, duration) => addNotification(message, 'danger', duration),
    [addNotification]
  );

  const warn = useCallback(
    (message, duration) => addNotification(message, 'warning', duration),
    [addNotification]
  );

  const info = useCallback(
    (message, duration) => addNotification(message, 'info', duration),
    [addNotification]
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification, success, error, warn, info }}
    >
      {children}

      {/* Toast Container */}
      <div
        className="toast-container position-fixed top-0 end-0 p-3"
        style={{ zIndex: 2000 }}
        data-testid="notification-container"
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`toast show align-items-center text-white bg-${n.type} border-0 mb-2`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            data-testid={`notification-${n.type}`}
          >
            <div className="d-flex">
              <div className="toast-body">{n.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => removeNotification(n.id)}
                aria-label="Close"
              />
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};

export default NotificationContext;
