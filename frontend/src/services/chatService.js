import api from './api';

/**
 * chatService — Chatbot IA API calls
 */
const chatService = {
  /**
   * Send a message to the chatbot.
   * @param {string} mensagem - User message text
   * @param {string|null} sessionId - Existing session ID (null for first message)
   * @returns {Promise<{resposta: string, sessionId: string, timestamp: string}>}
   */
  sendMessage: async (mensagem, sessionId = null) => {
    const payload = { mensagem };
    if (sessionId) payload.sessionId = sessionId;
    const response = await api.post('/chat', payload);
    return response.data.data;
  },
};

export default chatService;
