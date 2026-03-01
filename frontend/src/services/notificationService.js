import api from './api';

/**
 * notificationService
 * @description API calls for the notification system.
 */
const notificationService = {
  /**
   * Get count of unread notifications.
   * GET /notificacoes/nao-lidas/count
   * @returns {Promise<number>}
   */
  getUnreadCount: async () => {
    const response = await api.get('/notificacoes/nao-lidas/count');
    return response.data.data ?? response.data.count ?? 0;
  },

  /**
   * Get recent notifications (paginated, default size=5).
   * GET /notificacoes?size=5
   * @param {object} params - Optional query params
   * @returns {Promise<Array>}
   */
  getNotifications: async (params = { size: 5 }) => {
    const response = await api.get('/notificacoes', { params });
    return response.data.data?.content ?? response.data.data ?? response.data ?? [];
  },

  /**
   * Mark a notification as read.
   * PATCH /notificacoes/{id}/lida
   * @param {number|string} id
   * @returns {Promise<object>}
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/notificacoes/${id}/lida`);
    return response.data;
  },
};

export default notificationService;
