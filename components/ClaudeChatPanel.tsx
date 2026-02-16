import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Idea } from '../types';
import { useClaude } from '../hooks/useClaude';
import { buildGlobalContext } from '../utils/claudeContextBuilder';
import { ClaudeAction } from '../services/claudeService';
import ClaudeAvatar from './ClaudeAvatar';
import Icon from './Icon';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ClaudeAction[];
  timestamp: string;
}

type ClaudeChatPanelProps = {
  ideas: Idea[];
  selectedIdea: Idea | null;
  onAddCard: (ideaId: string, columnId: string, text: string) => Promise<void> | void;
  onMoveCard: (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => Promise<void> | void;
  onClose: () => void;
};

const ClaudeChatPanel: React.FC<ClaudeChatPanelProps> = ({
  ideas,
  selectedIdea,
  onAddCard,
  onMoveCard,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const claude = useClaude();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus input on mount
  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || claude.isThinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Build context and send to Claude
    const context = buildGlobalContext(ideas, selectedIdea || undefined);
    const response = await claude.sendMessage(userMessage.content, context);

    if (response && response.message) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID?.() || (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        actions: response.actions,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleApproveAction = async (action: ClaudeAction, index: number) => {
    if (action.type === 'create_card' && selectedIdea) {
      await onAddCard(selectedIdea.id, action.params.columnId || 'todo', action.params.text);

      const confirmMessage: ChatMessage = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        role: 'assistant',
        content: `Created card: "${action.params.text}" in ${action.params.columnId || 'todo'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    } else if (action.type === 'move_card' && selectedIdea) {
      const cardId = action.params.cardId;
      const sourceColumnId = action.params.sourceColumnId || 'todo';
      const destColumnId = action.params.columnId || action.params.destColumnId;

      if (cardId && destColumnId) {
        await onMoveCard(cardId, sourceColumnId, destColumnId, selectedIdea.id);

        const confirmMessage: ChatMessage = {
          id: crypto.randomUUID?.() || Date.now().toString(),
          role: 'assistant',
          content: `Moved card to ${destColumnId}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, confirmMessage]);
      }
    }
    claude.removeAction(index);
  };

  const handleDismissAction = (index: number) => {
    claude.removeAction(index);
  };

  const handleDismissAllActions = () => {
    claude.clearPendingActions();
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  const handleBackdropClick = () => onClose();
  const handlePanelClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        className="relative ml-auto w-full md:w-[400px] h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col"
        onClick={handlePanelClick}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <header className="p-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <ClaudeAvatar size="md" />
              <h2 className="text-lg font-semibold text-slate-100">Claude</h2>
            </div>
            <motion.button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              aria-label="Close chat panel"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon name="close" className="w-5 h-5" />
            </motion.button>
          </div>
          {selectedIdea && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Context:</span>
              <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {selectedIdea.title}
              </span>
            </div>
          )}
          {!selectedIdea && ideas.length > 0 && (
            <p className="text-xs text-slate-500">
              Viewing all {ideas.length} project{ideas.length !== 1 ? 's' : ''}
            </p>
          )}
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/40">
          {messages.length === 0 ? (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center px-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-4">
                <ClaudeAvatar size="md" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">
                Chat with Claude
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Ask Claude about your projects, get suggestions, or request card operations.
              </p>
            </motion.div>
          ) : (
            messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <motion.div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {!isUser && (
                    <div className="mr-2 mt-1">
                      <ClaudeAvatar size="sm" />
                    </div>
                  )}
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                        isUser
                          ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white'
                          : 'bg-amber-500/10 border border-amber-500/30 text-slate-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div
                      className={`text-[11px] mt-1.5 px-1 ${
                        isUser ? 'text-purple-300 text-right' : 'text-amber-400'
                      }`}
                    >
                      {isUser ? 'You' : 'Claude'} · {formatTimestamp(message.timestamp)}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          {claude.isThinking && (
            <motion.div
              className="flex items-start gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mt-1">
                <ClaudeAvatar size="sm" />
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3">
                <span className="text-sm text-amber-400 animate-pulse">
                  Claude is thinking...
                </span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error display */}
        {claude.error && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30 text-red-300 text-sm">
            {claude.error}
          </div>
        )}

        {/* Action proposals */}
        <AnimatePresence>
          {claude.pendingActions.length > 0 && (
            <motion.div
              className="px-4 py-3 space-y-2 bg-amber-500/5 border-t border-amber-500/20"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-400 font-medium">Claude suggests ({claude.pendingActions.length} remaining):</p>
                {claude.pendingActions.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleDismissAllActions}
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                    >
                      Dismiss All
                    </button>
                  </div>
                )}
              </div>
              {claude.pendingActions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800"
                >
                  <span className="text-sm text-slate-300 flex-1">
                    {action.type === 'create_card' &&
                      `Create card: "${action.params.text}" in ${action.params.columnId || 'todo'}`}
                    {action.type === 'move_card' &&
                      `Move card to ${action.params.columnId || action.params.destColumnId}`}
                    {action.type === 'modify_card' &&
                      `Update card: ${action.params.text || 'changes'}`}
                  </span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproveAction(action, i)}
                      className="px-3 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDismissAction(i)}
                      className="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <div className="flex flex-col gap-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              placeholder="Ask Claude anything..."
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-none transition"
              disabled={claude.isThinking}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Press Enter to send, Shift+Enter for new line
              </p>
              <motion.button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || claude.isThinking}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all font-medium"
                aria-label="Send message"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon name="sparkles" className="w-4 h-4" />
                <span>{claude.isThinking ? 'Thinking...' : 'Send'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClaudeChatPanel;
