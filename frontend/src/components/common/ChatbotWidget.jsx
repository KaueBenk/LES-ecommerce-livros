import React, { useState, useRef, useEffect, useCallback } from 'react';
import chatService from '../../services/chatService';
import { getErrorMessage } from '../../utils/helpers';

// ─── Unique ID generator ──────────────────────────────────────────────────────
let _msgIdCounter = 0;
const nextMsgId = () => ++_msgIdCounter;

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div
      className={`d-flex mb-2 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
      data-testid={`chat-msg-${message.id}`}
    >
      {!isUser && (
        <div
          className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0 me-2"
          style={{ width: 28, height: 28, fontSize: 14 }}
          aria-hidden="true"
        >
          🤖
        </div>
      )}
      <div
        className={`px-3 py-2 rounded-3 small ${
          isUser
            ? 'bg-primary text-white'
            : 'bg-light text-dark border'
        }`}
        style={{
          maxWidth: '80%',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.text}
        <div
          className={`mt-1 text-end ${isUser ? 'text-white-50' : 'text-muted'}`}
          style={{ fontSize: '0.65rem' }}
        >
          {message.time}
        </div>
      </div>
    </div>
  );
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="d-flex align-items-center mb-2 justify-content-start" data-testid="chat-typing">
    <div
      className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0 me-2"
      style={{ width: 28, height: 28, fontSize: 14 }}
      aria-hidden="true"
    >
      🤖
    </div>
    <div
      className="px-3 py-2 rounded-3 small bg-light text-muted border d-flex align-items-center gap-1"
      style={{ height: 36 }}
    >
      <span
        className="rounded-circle bg-secondary"
        style={{ width: 7, height: 7, display: 'inline-block', animation: 'chatDot 1.2s 0s infinite' }}
      />
      <span
        className="rounded-circle bg-secondary"
        style={{ width: 7, height: 7, display: 'inline-block', animation: 'chatDot 1.2s 0.2s infinite' }}
      />
      <span
        className="rounded-circle bg-secondary"
        style={{ width: 7, height: 7, display: 'inline-block', animation: 'chatDot 1.2s 0.4s infinite' }}
      />
    </div>
  </div>
);

// ─── Format time ──────────────────────────────────────────────────────────────
const fmtTime = (date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

// ─── ChatbotWidget ────────────────────────────────────────────────────────────

/**
 * ChatbotWidget
 * @component
 * @description Fixed floating chatbot button in the bottom-right corner.
 * Toggles a chat panel with conversation history, message bubbles, typing
 * indicator, and a text input. Maintains sessionId for conversation continuity.
 */
const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: nextMsgId(),
      role: 'bot',
      text: 'Olá! Sou o assistente da Livraria LES. Como posso ajudar você hoje? 📚',
      time: fmtTime(new Date()),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    // Add user message
    const userMsg = {
      id: nextMsgId(),
      role: 'user',
      text,
      time: fmtTime(new Date()),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const data = await chatService.sendMessage(text, sessionId);
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
      }
      const botMsg = {
        id: nextMsgId(),
        role: 'bot',
        text: data.resposta ?? 'Desculpe, não entendi. Pode reformular?',
        time: fmtTime(new Date(data.timestamp ?? Date.now())),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: nextMsgId(),
        role: 'bot',
        text: `⚠️ ${getErrorMessage(err) || 'Ocorreu um erro ao processar sua mensagem. Tente novamente.'}`,
        time: fmtTime(new Date()),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: nextMsgId(),
        role: 'bot',
        text: 'Olá! Como posso ajudar você hoje? 📚',
        time: fmtTime(new Date()),
      },
    ]);
    setSessionId(null);
  };

  return (
    <>
      {/* Keyframe animation for typing dots */}
      <style>{`
        @keyframes chatDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
        .chatbot-panel-enter {
          animation: chatPanelIn 0.25s ease-out;
        }
        @keyframes chatPanelIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 480px) {
          .chatbot-panel {
            width: 100vw !important;
            height: 85vh !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 16px 16px 0 0 !important;
          }
        }
      `}</style>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="chatbot-panel chatbot-panel-enter shadow-lg d-flex flex-column bg-white"
          style={{
            position: 'fixed',
            bottom: 80,
            right: 20,
            width: 350,
            height: 500,
            borderRadius: 16,
            zIndex: 9999,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.12)',
          }}
          role="dialog"
          aria-label="Chat com assistente"
          data-testid="chatbot-panel"
        >
          {/* Header */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-2 bg-primary text-white flex-shrink-0"
            style={{ borderRadius: '16px 16px 0 0' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div className="fw-semibold" style={{ fontSize: 14, lineHeight: 1.2 }}>
                  Assistente LES
                </div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  <span
                    className="rounded-circle bg-success d-inline-block me-1"
                    style={{ width: 7, height: 7 }}
                  />
                  Online
                </div>
              </div>
            </div>
            <div className="d-flex gap-1">
              <button
                type="button"
                className="btn btn-sm p-1 text-white-50"
                style={{ background: 'none', border: 'none', lineHeight: 1 }}
                onClick={handleClearChat}
                title="Limpar conversa"
                data-testid="chatbot-clear"
                aria-label="Limpar conversa"
              >
                🗑
              </button>
              <button
                type="button"
                className="btn btn-sm p-1 text-white"
                style={{ background: 'none', border: 'none', lineHeight: 1 }}
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
                data-testid="chatbot-close"
                aria-label="Fechar chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-grow-1 overflow-auto px-3 py-2"
            style={{ backgroundColor: '#f8f9fa' }}
            data-testid="chatbot-messages"
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="d-flex align-items-end gap-2 px-3 py-2 border-top bg-white flex-shrink-0"
          >
            <textarea
              ref={inputRef}
              className="form-control form-control-sm"
              style={{ resize: 'none', borderRadius: 12, minHeight: 38, maxHeight: 96 }}
              rows={1}
              placeholder="Digite sua mensagem…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              data-testid="chatbot-input"
              aria-label="Mensagem para o assistente"
              onInput={(e) => {
                // Auto-resize textarea
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm flex-shrink-0 d-flex align-items-center justify-content-center"
              style={{ width: 38, height: 38, borderRadius: 12, padding: 0 }}
              onClick={sendMessage}
              disabled={isTyping || !inputValue.trim()}
              data-testid="chatbot-send"
              aria-label="Enviar mensagem"
            >
              {isTyping ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        className="btn btn-primary d-flex align-items-center justify-content-center shadow"
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          zIndex: 10000,
          fontSize: 22,
          border: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: isOpen
            ? '0 4px 20px rgba(13,110,253,0.5)'
            : '0 4px 12px rgba(0,0,0,0.25)',
          transform: isOpen ? 'rotate(15deg)' : 'rotate(0deg)',
        }}
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'Fechar chat' : 'Abrir chat com assistente'}
        aria-expanded={isOpen}
        data-testid="chatbot-toggle"
        title={isOpen ? 'Fechar chat' : 'Chat com assistente'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </>
  );
};

export default ChatbotWidget;
