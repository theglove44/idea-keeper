import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Idea, Card, Column } from '../types';
import { getBrainstormSuggestions, getCardBrainstormSuggestions } from '../services/geminiService';
import Icon from './Icon';
import { LoadingSpinner, LoadingCards } from './LoadingSkeleton';

type IdeaDetailProps = {
  idea: Idea | null;
  onAddCard: (ideaId: string, columnId: string, cardText: string) => void;
  onStartEdit: (idea: Idea) => void;
  onMoveCard: (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => void;
  onEditCard: (cardId: string, newText: string, ideaId: string) => void;
  onOpenCardDetail: (ideaId: string, ideaTitle: string, columnId: string, columnTitle: string, card: Card) => void;
};

type DragInfo = {
  cardId: string;
  sourceColumnId: string;
} | null;

const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea, onAddCard, onStartEdit, onMoveCard, onEditCard, onOpenCardDetail }) => {
  const [newCardText, setNewCardText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [dragInfo, setDragInfo] = useState<DragInfo>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardText, setEditingCardText] = useState<string>('');

  const [brainstormingCard, setBrainstormingCard] = useState<Card | null>(null);
  const [brainstormResult, setBrainstormResult] = useState<string | null>(null);
  const [isCardAILoading, setIsCardAILoading] = useState(false);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardText.trim() && idea && idea.columns.length > 0) {
      onAddCard(idea.id, idea.columns[0].id, newCardText);
      setNewCardText('');
    }
  };

  const handleBrainstorm = async () => {
    if (!idea) return;
    setIsLoadingAi(true);
    setAiSuggestion(null);
    const suggestion = await getBrainstormSuggestions(idea);
    setAiSuggestion(suggestion);
    setIsLoadingAi(false);
  };
  
  const onDragStart = (e: React.DragEvent, card: Card, sourceColumnId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    setDragInfo({ cardId: card.id, sourceColumnId });
  };

  const onDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (columnId !== dragOverColumn) {
        setDragOverColumn(columnId);
    }
  };

  const onDrop = (e: React.DragEvent, destinationColumnId: string) => {
    e.preventDefault();
    if (!dragInfo || !idea) return;

    const { cardId, sourceColumnId } = dragInfo;

    if (sourceColumnId !== destinationColumnId) {
      onMoveCard(cardId, sourceColumnId, destinationColumnId, idea.id);
    }
    
    setDragInfo(null);
    setDragOverColumn(null);
  };

  const handleStartEditingCard = (card: Card) => {
    setEditingCardId(card.id);
    setEditingCardText(card.text);
  };

  const handleSaveCardEdit = () => {
    if (!idea || !editingCardId) return;
    
    const trimmedText = editingCardText.trim();
    if (trimmedText === '') {
        handleCancelCardEdit();
        return;
    }
    
    onEditCard(editingCardId, trimmedText, idea.id);

    setEditingCardId(null);
    setEditingCardText('');
  };

  const handleCancelCardEdit = () => {
      setEditingCardId(null);
      setEditingCardText('');
  };

  const handleCardBrainstorm = async (card: Card) => {
    if (!idea) return;
    setBrainstormingCard(card);
    setIsCardAILoading(true);
    setBrainstormResult(null);
    const result = await getCardBrainstormSuggestions(idea, card);
    setBrainstormResult(result);
    setIsCardAILoading(false);
  };

  const handleCardClick = (card: Card, column: Column) => {
    if (!idea) return;
    if (editingCardId === card.id) return;
    onOpenCardDetail(idea.id, idea.title, column.id, column.title, card);
  };

  const handleCloseCardBrainstorm = () => {
    setBrainstormingCard(null);
    setBrainstormResult(null);
    setIsCardAILoading(false);
  };

  if (!idea) {
    return (
      <main className="flex-1 flex items-center justify-center text-text-tertiary">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl mb-2">Select an idea to view details</p>
          <p className="text-text-muted">or create a new one to get started.</p>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-gradient-to-br from-surface via-surface to-surface-elevated overflow-hidden">
      {/* Header */}
      <motion.div
        className="p-6 border-b border-border flex-shrink-0 bg-gradient-to-r from-brand-purple-900/20 to-brand-cyan-900/20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center gap-4">
            <h2 className="text-3xl font-bold text-gradient-brand truncate">{idea.title}</h2>
            <motion.button
                onClick={() => onStartEdit(idea)}
                className="p-2 rounded-full text-text-tertiary hover:bg-surface-overlay hover:text-text-primary transition-colors flex-shrink-0"
                aria-label="Edit Idea"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
            >
                <Icon name="pencil" className="w-5 h-5"/>
            </motion.button>
        </div>
        {idea.summary && <p className="text-text-secondary mt-2 truncate">{idea.summary}</p>}
      </motion.div>
      
      {/* AI & Actions */}
      <div className="p-4 flex-shrink-0 border-b border-border">
         <motion.button
            onClick={handleBrainstorm}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-purple-600/80 to-brand-cyan-600/80 text-white text-sm font-medium rounded-lg hover:from-brand-purple-500 hover:to-brand-cyan-500 shadow-card hover:shadow-glow-purple transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoadingAi ? (
              <>
                <LoadingSpinner size="sm" className="border-white border-t-transparent" />
                <span>Brainstorming...</span>
              </>
            ) : (
              <>
                <Icon name="sparkles" className="w-4 h-4" />
                <span>Brainstorm with AI</span>
              </>
            )}
          </motion.button>
      </div>

      {/* Kanban Board */}
      <div className="flex-grow flex p-4 space-x-4 overflow-x-auto scrollbar-custom">
        {idea.columns.map((column, colIndex) => (
            <motion.div
                key={column.id}
                onDragOver={(e) => onDragOver(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => onDrop(e, column.id)}
                className={`w-72 flex-shrink-0 glass rounded-2xl flex flex-col transition-all duration-300 ${dragOverColumn === column.id ? 'bg-surface-overlay ring-2 ring-brand-purple-500' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: colIndex * 0.1 }}
            >
                <div className="p-4 border-b border-border/50 flex-shrink-0 bg-gradient-to-r from-brand-purple-900/10 to-brand-cyan-900/10">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <span className="status-dot-active"></span>
                    {column.title}
                    <span className="ml-auto text-xs text-text-muted bg-surface-overlay px-2 py-0.5 rounded-full">{column.cards.length}</span>
                  </h3>
                </div>
                <div className="p-3 flex-grow overflow-y-auto space-y-3 scrollbar-custom">
                    {column.cards.map((card, index) => (
                       <motion.div
                         key={card.id}
                         draggable={editingCardId !== card.id}
                         onDragStart={(e) => onDragStart(e, card, column.id)}
                         onClick={() => handleCardClick(card, column)}
                         className={`relative group p-4 card-interactive ${editingCardId !== card.id ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'} ${
                            dragInfo?.cardId === card.id ? 'opacity-40 scale-105 -rotate-3 ring-2 ring-brand-purple-500 ring-offset-2 ring-offset-surface' : ''
                         }`}
                         initial={{ opacity: 0, y: 20, scale: 0.95 }}
                         animate={{ opacity: 1, y: 0, scale: 1 }}
                         transition={{
                           duration: 0.3,
                           delay: index * 0.05,
                           type: 'spring',
                           stiffness: 300,
                           damping: 20
                         }}
                         whileHover={{ y: -2 }}
                        >
                          {editingCardId === card.id ? (
                                <textarea
                                    value={editingCardText}
                                    onChange={(e) => setEditingCardText(e.target.value)}
                                    onBlur={handleSaveCardEdit}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSaveCardEdit();
                                        }
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            handleCancelCardEdit();
                                        }
                                    }}
                                    className="block w-full bg-surface border-none ring-2 ring-brand-purple-500 rounded-lg p-2 m-0 text-text-primary text-sm leading-relaxed focus:outline-none resize-none"
                                    autoFocus
                                    rows={Math.max(2, editingCardText.split('\n').length)}
                                />
                          ) : (
                            <>
                                <p className="text-text-primary text-sm leading-relaxed whitespace-pre-wrap">{card.text}</p>
                                <div className="mt-4 flex items-center justify-between text-xs">
                                    <motion.span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/80 border border-border text-text-tertiary"
                                      whileHover={{ scale: 1.05 }}
                                    >
                                        <Icon name="message" className="w-3.5 h-3.5" />
                                        <span className="font-medium">{card.commentsCount ?? 0}</span>
                                    </motion.span>
                                </div>
                                <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardBrainstorm(card);
                                        }}
                                        className="p-1.5 rounded-lg text-text-tertiary bg-surface-elevated/90 hover:text-brand-purple-400 hover:bg-surface-overlay shadow-card backdrop-blur-sm transition-all"
                                        aria-label="Brainstorm on card"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Icon name="sparkles" className="w-3.5 h-3.5" />
                                    </motion.button>
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEditingCard(card);
                                        }}
                                        className="p-1.5 rounded-lg text-text-tertiary bg-surface-elevated/90 hover:text-text-primary hover:bg-surface-overlay shadow-card backdrop-blur-sm transition-all"
                                        aria-label="Edit card"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Icon name="pencil" className="w-3.5 h-3.5" />
                                    </motion.button>
                                </div>
                            </>
                          )}
                       </motion.div>
                    ))}
                </div>
            </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            className="flex-shrink-0 p-4 border-t border-border max-h-64 overflow-y-auto scrollbar-custom"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
              <div className="p-5 glass rounded-2xl shadow-card border-l-4 border-brand-purple-500">
                  <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                      <Icon name="sparkles" className="w-5 h-5 text-brand-purple-400" />
                      AI Suggestions
                  </h3>
                  <pre className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed font-sans">{aiSuggestion}</pre>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <motion.div
        className="p-4 border-t border-border flex-shrink-0 bg-surface-elevated/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <form onSubmit={handleAddCard} className="flex items-center gap-3">
          <input
            type="text"
            value={newCardText}
            onChange={(e) => setNewCardText(e.target.value)}
            placeholder={`Add card to "${idea.columns[0]?.title || ''}"...`}
            className="input-field"
            disabled={idea.columns.length === 0}
          />
          <motion.button
            type="submit"
            className="p-3 bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 text-white rounded-full hover:shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            disabled={!newCardText.trim()}
            aria-label="Add Card"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="send" className="w-5 h-5"/>
          </motion.button>
        </form>
      </motion.div>

      {/* Card Brainstorm Modal */}
      <AnimatePresence>
        {brainstormingCard && (
            <motion.div
              className="modal-backdrop"
              onClick={handleCloseCardBrainstorm}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
                <motion.div
                  className="w-full max-w-lg glass rounded-2xl shadow-elevated p-6"
                  onClick={(e) => e.stopPropagation()}
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gradient-brand flex items-center gap-2">
                            <Icon name="sparkles" className="w-5 h-5"/>
                            Brainstorming
                        </h3>
                        <motion.button
                          onClick={handleCloseCardBrainstorm}
                          className="p-2 rounded-full text-text-tertiary hover:bg-surface-overlay hover:text-text-primary transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                            <Icon name="close" className="w-5 h-5"/>
                        </motion.button>
                    </div>
                    <div className="p-4 bg-surface/50 rounded-xl mb-4 border border-border/50 border-l-4 border-l-brand-cyan-500">
                        <p className="text-text-tertiary text-sm mb-2 font-medium">Original Card:</p>
                        <p className="text-text-primary whitespace-pre-wrap">{brainstormingCard.text}</p>
                    </div>
                    {isCardAILoading ? (
                        <div className="flex flex-col items-center justify-center text-text-tertiary py-12">
                            <LoadingSpinner size="lg" />
                            <p className="mt-4 text-sm">Thinking...</p>
                        </div>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto pr-2 scrollbar-custom">
                             <pre className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed font-sans">{brainstormResult}</pre>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default IdeaDetail;