import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import chatService from '../../services/chatService';
import catalogService from '../../services/catalogService';
import { getErrorMessage } from '../../utils/helpers';

// ─── Unique ID generator ──────────────────────────────────────────────────────
let _msgIdCounter = 0;
const nextMsgId = () => ++_msgIdCounter;

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  const renderTextWithLinks = (text) => {
    if (!text) return null;
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (match) {
        return (
          <Link
            key={index}
            to={match[2]}
            className="text-decoration-underline"
            style={{ color: isUser ? '#fff' : '#4f46e5', fontWeight: 500 }}
          >
            {match[1]}
          </Link>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

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
        {renderTextWithLinks(message.text)}
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

const STOP_WORDS = new Set([
  'a', 'o', 'os', 'as', 'de', 'da', 'do', 'dos', 'das', 'um', 'uma', 'para', 'por',
  'em', 'no', 'na', 'nos', 'nas', 'e', 'ou', 'com', 'sobre', 'que', 'como', 'livro',
  'livros', 'quero', 'gostaria', 'recomenda', 'recomendacao', 'indica', 'indique',
  'aprender', 'aprendendo', 'estudar', 'estudo', 'manual', 'guia', 'iniciante',
]);

const normalizeText = (value) =>
  value
    ? value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    : '';

const shuffleList = (items) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const extractKeywords = (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    .slice(0, 4);
};

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
  const [catalogMeta, setCatalogMeta] = useState({
    categories: [],
    authors: [],
    titles: [],
    loaded: false,
  });
  const [suggestions, setSuggestions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  // Auto-scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when panel opens or after bot finishes typing
  useEffect(() => {
    if (isOpen && !isTyping) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isTyping]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || catalogMeta.loaded) return;
    let cancelled = false;

    const loadMeta = async () => {
      try {
        const [categories, authors, books] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getAuthors(),
          catalogService.getBooks({ page: 0, size: 50, ativo: true }),
        ]);

        if (cancelled) return;

        const titles = (books?.content || []).map((book) => book.titulo).filter(Boolean);
        setCatalogMeta({
          categories: (categories || []).map((item) => item.nome).filter(Boolean),
          authors: (authors || []).map((item) => item.nome).filter(Boolean),
          titles,
          loaded: true,
        });
      } catch (err) {
        if (!cancelled) {
          setCatalogMeta((prev) => ({ ...prev, loaded: true }));
        }
      }
    };

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [isOpen, catalogMeta.loaded]);

  useEffect(() => {
    if (!isOpen) return;

    // Apenas mostrar sugestões se o usuário ainda não tiver enviado mensagens
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length > 0) {
      setSuggestions([]);
      return;
    }

    const categorySuggestions = shuffleList(catalogMeta.categories)
      .slice(0, 2)
      .map((category) => `Quais os melhores livros de ${category}?`);

    const authorSuggestions = shuffleList(catalogMeta.authors)
      .slice(0, 1)
      .map((author) => `Tem obras do autor ${author}?`);

    const titleSuggestions = shuffleList(catalogMeta.titles)
      .slice(0, 1)
      .map((title) => `Me fale mais sobre o livro "${title}".`);

    const defaultSuggestions = [
      'Tem algum livro bom para iniciantes em programação?',
      'Quais são os livros mais bem avaliados?',
      'Quero recomendações de livros de tecnologia.',
    ];

    const baseSuggestions = [
      ...categorySuggestions,
      ...authorSuggestions,
      ...titleSuggestions,
      ...defaultSuggestions,
    ].filter(Boolean);

    // Selecionar no máximo 4 sugestões naturais
    setSuggestions(shuffleList(baseSuggestions).slice(0, 4));
  }, [catalogMeta, messages, isOpen]);

  const sendMessage = useCallback(async (overrideText = null) => {
    const text = (overrideText ?? inputValue).trim();
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
  const handleSuggestionClick = (suggestion) => {
    if (isTyping) return;
    sendMessage(suggestion);
  };

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
            className="d-flex align-items-center justify-content-between px-3 py-3 text-white flex-shrink-0"
            style={{ 
              borderRadius: '16px 16px 0 0',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}
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
          {suggestions.length > 0 && (
            <div
              className="px-3 py-2 border-top"
              data-testid="chatbot-suggestions"
              style={{
                background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(248,249,250,0.95) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
            >
              <div className="d-flex gap-2 overflow-x-auto pb-2 pt-1 px-1 suggestion-container" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`
                  .suggestion-container::-webkit-scrollbar { display: none; }
                  .suggestion-btn {
                    border-radius: 20px;
                    font-size: 0.85rem;
                    padding: 0.4rem 1rem;
                    background: #ffffff;
                    color: #4f46e5;
                    border: 1px solid rgba(79, 70, 229, 0.2);
                    box-shadow: 0 2px 6px rgba(79, 70, 229, 0.08);
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    font-weight: 500;
                  }
                  .suggestion-btn:hover {
                    background: #4f46e5;
                    color: #ffffff;
                    border-color: #4f46e5;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
                  }
                  .suggestion-btn:active {
                    transform: translateY(0);
                  }
                  .suggestion-btn svg {
                    opacity: 0.7;
                    transition: opacity 0.2s;
                  }
                  .suggestion-btn:hover svg {
                    opacity: 1;
                  }
                `}</style>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="suggestion-btn text-nowrap flex-shrink-0"
                    style={{ animation: `chatPanelIn 0.3s ease-out ${index * 0.05}s both` }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

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
