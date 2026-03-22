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
