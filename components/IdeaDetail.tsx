import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Idea, Card, Column } from '../types';
import Icon from './Icon';
import { LoadingSpinner, LoadingCards } from './LoadingSkeleton';
import EmptyState from './EmptyState';
import CardBadges from './CardBadges';
import { useIdeaBoardFilters } from '../hooks/useIdeaBoardFilters';
import { useCardDragAndEdit } from '../hooks/useCardDragAndEdit';

type IdeaDetailProps = {
  idea: Idea | null;
  onAddCard: (ideaId: string, columnId: string, cardText: string) => void;
  onStartEdit: (idea: Idea) => void;
  onMoveCard: (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => void;
  onEditCard: (cardId: string, newText: string, ideaId: string) => void;
  onOpenCardDetail: (ideaId: string, ideaTitle: string, columnId: string, columnTitle: string, card: Card) => void;
  onCreateIdea: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
};

const IdeaDetail: React.FC<IdeaDetailProps> = ({
  idea,
  onAddCard,
  onStartEdit,
  onMoveCard,
  onEditCard,
  onOpenCardDetail,
  onCreateIdea,
  onOpenSearch,
  onOpenShortcuts,
}) => {
  const [newCardText, setNewCardText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const [brainstormingCard, setBrainstormingCard] = useState<Card | null>(null);
  const [brainstormResult, setBrainstormResult] = useState<string | null>(null);
  const [isCardAILoading, setIsCardAILoading] = useState(false);

  const {
    targetColumnId,
    setTargetColumnId,
    filterQuery,
    setFilterQuery,
    showOverdueOnly,
    setShowOverdueOnly,
    showHighPriorityOnly,
    setShowHighPriorityOnly,
    showAssignedOnly,
    setShowAssignedOnly,
    boardStats,
    hasActiveFilters,
    filteredColumns,
    clearFilters,
  } = useIdeaBoardFilters(idea);

  const {
    dragInfo,
    dragOverColumn,
    setDragOverColumn,
    editingCardId,
    editingCardText,
    setEditingCardText,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    handleStartEditingCard,
    handleSaveCardEdit,
    handleCancelCardEdit,
  } = useCardDragAndEdit({
    ideaId: idea?.id ?? null,
    onMoveCard,
    onEditCard,
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardText.trim() && idea && targetColumnId) {
      onAddCard(idea.id, targetColumnId, newCardText);
      setNewCardText('');
    }
  };

  const handleBrainstorm = async () => {
    if (!idea) return;
    setIsLoadingAi(true);
    setAiSuggestion(null);
    try {
      const { getBrainstormSuggestions } = await import('../services/geminiService');
      const suggestion = await getBrainstormSuggestions(idea);
      setAiSuggestion(suggestion);
    } finally {
      setIsLoadingAi(false);
    }
  };
  
  const handleCardBrainstorm = async (card: Card) => {
    if (!idea) return;
    setBrainstormingCard(card);
    setIsCardAILoading(true);
    setBrainstormResult(null);
    try {
      const { getCardBrainstormSuggestions } = await import('../services/geminiService');
      const result = await getCardBrainstormSuggestions(idea, card);
      setBrainstormResult(result);
    } finally {
      setIsCardAILoading(false);
    }
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
      <main className="flex-1 flex items-center justify-center p-4">
        <EmptyState
          variant="no-ideas"
          title="No active idea selected"
          description="Pick an idea from the left or create a fresh one to start organizing work."
          action={{
            label: 'Create New Idea',
            onClick: onCreateIdea,
            icon: 'plus',
          }}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-transparent overflow-hidden md:ml-0 ml-0">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-border/80 flex-shrink-0 bg-surface-dark/45 backdrop-blur-sm">
        <div className="flex justify-between items-start gap-3 md:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary truncate">{idea.title}</h2>
            <p className="text-text-tertiary text-sm md:text-base mt-1 truncate">{idea.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 text-xs rounded-full border border-border bg-surface-elevated/70 text-text-secondary">
                {boardStats.total} total cards
              </span>
              <span className="px-2.5 py-1 text-xs rounded-full border border-border bg-surface-elevated/70 text-text-secondary">
                {boardStats.done} done
              </span>
              <span className={`px-2.5 py-1 text-xs rounded-full border ${boardStats.overdue > 0 ? 'border-status-error/50 text-status-error bg-status-error/10' : 'border-border text-text-secondary bg-surface-elevated/70'}`}>
                {boardStats.overdue} overdue
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="btn-ghost text-xs md:text-sm"
              aria-label="Search"
            >
              Search
            </button>
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="btn-ghost text-xs md:text-sm"
              aria-label="Open keyboard shortcuts"
            >
              ?
            </button>
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
        </div>
      </div>
      
      {/* AI & Actions */}
      <div className="p-3 md:p-4 flex-shrink-0 border-b border-border/80 bg-surface-dark/35">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter cards by text or tag..."
              className="input-field text-xs md:text-sm"
              aria-label="Filter cards"
            />
            <button
              type="button"
              onClick={handleBrainstorm}
              disabled={isLoadingAi}
              data-tour="brainstorm-button"
              className="flex items-center justify-center gap-2 px-3 py-2 bg-surface-elevated/85 text-text-secondary text-xs md:text-sm rounded-lg border border-border hover:bg-surface-overlay transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOverdueOnly((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-full text-xs border transition-colors ${showOverdueOnly ? 'bg-status-error/15 text-status-error border-status-error/50' : 'bg-surface-elevated/80 text-text-secondary border-border hover:bg-surface-overlay'}`}
            >
              Overdue
            </button>
            <button
              type="button"
              onClick={() => setShowHighPriorityOnly((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-full text-xs border transition-colors ${showHighPriorityOnly ? 'bg-brand-orange-500/15 text-brand-orange-300 border-brand-orange-500/50' : 'bg-surface-elevated/80 text-text-secondary border-border hover:bg-surface-overlay'}`}
            >
              High Priority
            </button>
            <button
              type="button"
              onClick={() => setShowAssignedOnly((prev) => !prev)}
              className={`px-2.5 py-1.5 rounded-full text-xs border transition-colors ${showAssignedOnly ? 'bg-brand-cyan-500/15 text-brand-cyan-300 border-brand-cyan-500/50' : 'bg-surface-elevated/80 text-text-secondary border-border hover:bg-surface-overlay'}`}
            >
              Assigned
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-2.5 py-1.5 rounded-full text-xs border border-border text-text-tertiary hover:text-text-secondary hover:bg-surface-overlay transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div data-tour="kanban-board" className="flex-grow flex flex-row p-3 md:p-4 gap-3 md:gap-4 overflow-x-auto overflow-y-hidden snap-x snap-mandatory">
        {filteredColumns.map((column) => (
            <div
                key={column.id}
                onDragOver={(e) => onDragOver(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => onDrop(e, column.id)}
                className={`w-[82vw] sm:w-80 md:w-80 flex-shrink-0 snap-start bg-surface-elevated/85 border border-border/70 rounded-xl flex flex-col transition-colors duration-200 ${dragOverColumn === column.id ? 'bg-surface-overlay/90 border-brand-cyan-500/45' : ''}`}
            >
                <div className="p-4 border-b border-border/70 flex-shrink-0 bg-gradient-to-r from-brand-purple-900/20 to-brand-cyan-900/20">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <span className="status-dot-active"></span>
                    {column.title}
                    <span className="ml-auto text-xs text-text-muted bg-surface-overlay px-2 py-0.5 rounded-full">
                      {hasActiveFilters ? `${column.filteredCards.length}/${column.cards.length}` : column.cards.length}
                    </span>
                  </h3>
                </div>
                <div className="p-3 flex-grow overflow-y-auto space-y-3 scrollbar-custom">
                    {column.cards.length === 0 && (
                      <div className="h-full min-h-[120px] rounded-lg border border-dashed border-border/80 bg-surface-dark/25 text-text-muted text-xs flex items-center justify-center px-3 text-center">
                        Drop cards here or add one from the quick composer below.
                      </div>
                    )}
                    {column.cards.length > 0 && column.filteredCards.length === 0 && (
                      <div className="h-full min-h-[120px] rounded-lg border border-dashed border-border/80 bg-surface-dark/25 text-text-muted text-xs flex items-center justify-center px-3 text-center">
                        No cards match current filters in this column.
                      </div>
                    )}
                    {column.filteredCards.map((card, index) => (
                       <motion.div
                         key={card.id}
                         draggable={editingCardId !== card.id}
                         onDragStart={(e) => onDragStart(e, card, column.id)}
                         onDragEnd={onDragEnd}
                         onClick={() => handleCardClick(card, column)}
                         className={`relative group p-3 md:p-3 min-h-[60px] bg-surface-overlay/75 border border-border/70 rounded-lg shadow-card hover:shadow-card-hover hover:bg-surface-overlay active:bg-surface-overlay/95 transition-all duration-300 ease-in-out ${editingCardId !== card.id ? 'cursor-grab active:cursor-grabbing' : ''} animate-card-enter ${
                            dragInfo?.cardId === card.id ? 'opacity-40 scale-105 -rotate-2 ring-2 ring-brand-cyan-400 ring-offset-2 ring-offset-surface-elevated' : ''
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
                                <div className="mt-3">
                                  <CardBadges card={card} />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <motion.span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface/80 border border-border text-text-tertiary"
                                      whileHover={{ scale: 1.05 }}
                                    >
                                        <Icon name="message" className="w-3.5 h-3.5" />
                                        <span className="font-medium">{card.commentsCount ?? 0}</span>
                                    </motion.span>
                                </div>
                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardBrainstorm(card);
                                        }}
                                        className="p-2 md:p-1.5 rounded-full text-text-tertiary bg-surface-elevated/90 hover:text-brand-orange-300 hover:bg-surface-overlay active:bg-surface-overlay transition-all"
                                        aria-label="Brainstorm on card"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Icon name="sparkles" className="w-4 h-4 md:w-3 md:h-3" />
                                    </motion.button>
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEditingCard(card);
                                        }}
                                        className="p-2 md:p-1.5 rounded-full text-text-tertiary bg-surface-elevated/90 hover:text-text-primary hover:bg-surface-overlay active:bg-surface-overlay transition-all"
                                        aria-label="Edit card"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Icon name="pencil" className="w-4 h-4 md:w-3 md:h-3" />
                                    </motion.button>
                                </div>
                            </>
                          )}
                       </motion.div>
                    ))}
                </div>
            </div>
        ))}
      </div>
      
      {aiSuggestion && (
        <div className="flex-shrink-0 p-3 md:p-4 border-t border-border/80 max-h-40 md:max-h-52 overflow-y-auto bg-surface-dark/35">
            <div className="p-3 md:p-4 bg-surface-elevated/80 rounded-lg border border-border/70">
                <h3 className="text-base md:text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
                    <Icon name="sparkles" className="w-4 md:w-5 h-4 md:h-5 text-brand-orange-400" />
                    AI Suggestions
                </h3>
                <pre className="text-text-secondary whitespace-pre-wrap text-xs md:text-sm leading-relaxed font-sans">{aiSuggestion}</pre>
            </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 md:p-4 border-t border-border/80 flex-shrink-0 bg-surface-dark/40">
        <form onSubmit={handleAddCard} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
          <select
            value={targetColumnId}
            onChange={(e) => setTargetColumnId(e.target.value)}
            className="bg-surface-elevated/85 border border-border rounded-lg px-3 py-2 text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-cyan-500"
            aria-label="Target column for new card"
          >
            {idea.columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newCardText}
            onChange={(e) => setNewCardText(e.target.value)}
            placeholder={`Add card to "${idea.columns.find((column) => column.id === targetColumnId)?.title || idea.columns[0]?.title || ''}"...`}
            className="flex-1 bg-surface-elevated/85 border border-border rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-cyan-500 focus:border-transparent transition-shadow"
            disabled={idea.columns.length === 0 || !targetColumnId}
          />
          <motion.button
            type="submit"
            className="p-2 md:p-2.5 bg-gradient-brand text-white rounded-full border border-brand-cyan-500/30 hover:brightness-110 disabled:bg-surface-overlay disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            disabled={!newCardText.trim() || !targetColumnId}
            aria-label="Add Card"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="send" className="w-5 h-5"/>
          </motion.button>
        </form>
      </div>

      {/* Card Brainstorm Modal */}
      {brainstormingCard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={handleCloseCardBrainstorm}>
              <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 md:p-6 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3 md:mb-4 flex-shrink-0">
                      <h3 className="text-lg md:text-xl font-bold text-slate-100 flex items-center gap-2">
                          <Icon name="sparkles" className="w-5 h-5 text-yellow-400"/>
                          Brainstorming
                      </h3>
                      <button onClick={handleCloseCardBrainstorm} className="p-2 rounded-full text-slate-400 hover:bg-slate-700">
                          <Icon name="close" className="w-5 h-5"/>
                      </button>
                  </div>
                  <div className="p-3 md:p-4 bg-slate-900/50 rounded-lg mb-3 md:mb-4 border border-slate-700/50 flex-shrink-0">
                      <p className="text-slate-400 text-xs md:text-sm mb-1">Original Card:</p>
                      <p className="text-slate-200 text-sm md:text-base whitespace-pre-wrap">{brainstormingCard.text}</p>
                  </div>
                  {isCardAILoading ? (
                      <div className="text-center text-slate-400 py-8">
                          <p>Thinking...</p>
                      </div>
                  ) : (
                      <div className="flex-1 overflow-y-auto pr-2">
                           <pre className="text-slate-300 whitespace-pre-wrap text-xs md:text-sm leading-relaxed font-sans">{brainstormResult}</pre>
                      </div>
                  )}
              </div>
          </div>
      )}
    </main>
  );
};

export default IdeaDetail;
