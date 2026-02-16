import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { supabaseInitializationError, formatSupabaseError } from './services/supabaseClient';
import { Idea, Card } from './types';
import Sidebar from './components/Sidebar';
import IdeaDetail from './components/IdeaDetail';
import Icon from './components/Icon';
import { useToast } from './components/Toast';
import OnboardingTour, { useOnboarding } from './components/OnboardingTour';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import { useFocusTrap } from './hooks/useFocusTrap';
import { buildCommentCountsMap, mapIdeasWithCards } from './utils/boardMappers';
import { mapCardUpdatesToDb } from './utils/cardUpdateMapper';
import {
  deleteIdeaRow,
  fetchCardCommentRows,
  fetchCardsRows,
  fetchIdeasRows,
  insertCardRow,
  insertCardsRows,
  insertIdeaRow,
  moveCardRow,
  updateCardFieldsRow,
  updateCardTextRow,
  updateIdeaRow,
} from './services/ideaRepository';

const CardDetailModal = lazy(() => import('./components/CardDetailModal'));
const SearchModal = lazy(() => import('./components/SearchModal'));
const KeyboardShortcutsHelp = lazy(() => import('./components/KeyboardShortcutsHelp'));
const ClaudeChatPanel = lazy(() => import('./components/ClaudeChatPanel'));

const IdeaForm: React.FC<{ 
    onSave: (title: string, summary: string) => Promise<{ success: boolean; error?: string }>; 
    onClose: () => void; 
    idea?: Idea 
}> = ({ onSave, onClose, idea }) => {
    const isEditMode = !!idea;
    const [title, setTitle] = useState(idea?.title || '');
    const [summary, setSummary] = useState(idea?.summary || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement | null>(null);
    const titleInputRef = useRef<HTMLInputElement | null>(null);

    useFocusTrap({
        active: true,
        containerRef: dialogRef,
        initialFocusRef: titleInputRef,
        onEscape: onClose,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || isSaving) return;

        setIsSaving(true);
        setError(null);
        const result = await onSave(title, summary);
        if (!result.success) {
            setError(result.error || 'Unable to save right now.');
        }
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={onClose}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="idea-form-title"
                tabIndex={-1}
                className="w-full max-w-md bg-surface-elevated/95 border border-border rounded-xl shadow-elevated p-4 md:p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h2 id="idea-form-title" className="text-xl md:text-2xl font-extrabold tracking-tight text-text-primary">{isEditMode ? 'Edit Idea' : 'New Idea'}</h2>
                    <button type="button" onClick={onClose} aria-label="Close idea form" className="p-2 rounded-full text-text-tertiary hover:bg-surface-overlay">
                        <Icon name="close" className="w-5 h-5"/>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    {error && (
                        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">Title</label>
                        <input
                            id="title"
                            ref={titleInputRef}
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your brilliant idea?"
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-text-secondary mb-2">Summary</label>
                        <textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Describe it in a sentence or two."
                            rows={3}
                            className="input-field resize-none"
                        />
                    </div>
                    <div className="flex justify-end pt-1 md:pt-2">
                        <button type="submit" className="btn-primary text-sm md:text-base" disabled={!title.trim() || isSaving}>
                            {isSaving ? 'Saving...' : 'Save Idea'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DEFAULT_COLUMNS_CONFIG = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

function App() {
  const { showToast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isAddingNewIdea, setIsAddingNewIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCardContext, setSelectedCardContext] = useState<{
    ideaId: string;
    ideaTitle: string;
    columnId: string;
    columnTitle: string;
    card: Card;
  } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
  const [isClaudePanelOpen, setIsClaudePanelOpen] = useState(false);
  const [isClaudeAvailable, setIsClaudeAvailable] = useState<boolean | null>(null);

  // Claude health check on mount
  // In Tauri desktop app, always show the button — PATH resolution is unreliable
  // for GUI apps, so we surface errors at interaction time instead
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  useEffect(() => {
    if (isTauri) {
      setIsClaudeAvailable(true);
      return;
    }
    import('./services/claudeService').then(({ checkClaudeHealth }) => {
      checkClaudeHealth().then(({ available }) => {
        setIsClaudeAvailable(available);
        if (!available) {
          console.warn('Claude CLI not available. Install and run `claude login` to enable AI features.');
        }
      });
    }).catch(() => {
      setIsClaudeAvailable(false);
    });
  }, []);

  // Onboarding
  const { showTour, completeTour } = useOnboarding();

  // Keyboard Shortcuts
  // Cmd/Ctrl+K: Open search
  useKeyboardShortcut(
    { key: 'k', ctrl: true, meta: true, description: 'Open search' },
    () => setIsSearchOpen(true)
  );

  // ?: Show keyboard shortcuts help
  useKeyboardShortcut(
    { key: '?', shift: true, description: 'Show keyboard shortcuts' },
    () => setIsShortcutsHelpOpen(true)
  );

  // Cmd/Ctrl+N: New idea
  useKeyboardShortcut(
    { key: 'n', ctrl: true, meta: true, description: 'Create new idea' },
    () => setIsAddingNewIdea(true)
  );

  // J: Next idea
  useKeyboardShortcut(
    {
      key: 'j',
      description: 'Next idea',
      enabled: !isAddingNewIdea && !editingIdea && !selectedCardContext && !isSearchOpen,
    },
    () => {
      if (ideas.length === 0) return;
      const currentIndex = ideas.findIndex((i) => i.id === selectedIdeaId);
      const nextIndex = currentIndex < ideas.length - 1 ? currentIndex + 1 : 0;
      setSelectedIdeaId(ideas[nextIndex].id);
    }
  );

  // K: Previous idea
  useKeyboardShortcut(
    {
      key: 'k',
      description: 'Previous idea',
      enabled: !isAddingNewIdea && !editingIdea && !selectedCardContext && !isSearchOpen,
    },
    () => {
      if (ideas.length === 0) return;
      const currentIndex = ideas.findIndex((i) => i.id === selectedIdeaId);
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : ideas.length - 1;
      setSelectedIdeaId(ideas[prevIndex].id);
    }
  );

  if (supabaseInitializationError) {
    return (
      <div className="h-screen w-screen bg-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center bg-slate-800 border border-red-700/50 p-8 rounded-lg max-w-lg shadow-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h1>
            <p className="text-slate-300">{supabaseInitializationError}</p>
            <p className="text-slate-400 mt-4 text-sm">Please ensure the <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> environment variables are correctly set for this application to function.</p>
        </div>
      </div>
    );
  }

  const selectedIdea = ideas.find(idea => idea.id === selectedIdeaId) || null;

  useEffect(() => {
    const fetchIdeas = async () => {
        const { data: ideasData, error: ideasError } = await fetchIdeasRows();
        if (ideasError) {
            console.error("Error fetching ideas:", ideasError);
            showToast(formatSupabaseError(ideasError, 'Failed to load ideas.'), 'error');
            return;
        }

        const { data: cardsData, error: cardsError } = await fetchCardsRows();
        if (cardsError) {
            console.error("Error fetching cards:", cardsError);
            showToast(formatSupabaseError(cardsError, 'Failed to load cards.'), 'error');
            return;
        }

        const cardIds = cardsData.map(card => card.id);
        let commentCountsMap: Record<string, number> = {};
        if (cardIds.length > 0) {
          const { data: commentRows, error: commentError } = await fetchCardCommentRows(cardIds);

          if (commentError) {
            console.error('Error fetching card comment counts:', commentError);
            showToast(formatSupabaseError(commentError, 'Comments could not be loaded.'), 'warning');
          } else if (commentRows) {
            commentCountsMap = buildCommentCountsMap(commentRows);
          }
        }

        const ideasWithData = mapIdeasWithCards(
          ideasData,
          cardsData,
          commentCountsMap,
          DEFAULT_COLUMNS_CONFIG
        );

        setIdeas(ideasWithData);

        // Create sample idea for first-time users
        const hasSeenSample = localStorage.getItem('has_seen_sample_idea');
        if (ideasWithData.length === 0 && !hasSeenSample) {
          createSampleIdea();
          localStorage.setItem('has_seen_sample_idea', 'true');
        }
    };

    const createSampleIdea = async () => {
      const sampleIdea = {
        title: '🚀 Building a Mobile App',
        summary: 'A sample idea to help you get started with Idea Keeper',
      };

      const { data, error } = await insertIdeaRow(sampleIdea.title, sampleIdea.summary);

      if (error) {
        console.error('Error creating sample idea:', error);
        showToast(formatSupabaseError(error, 'Could not create starter idea.'), 'error');
        return;
      }

      // Create sample cards
      const sampleCards = [
        { text: 'Research competitor apps and user needs', column_id: 'backlog', idea_id: data.id },
        { text: 'Design wireframes and user flows', column_id: 'backlog', idea_id: data.id },
        { text: 'Set up development environment', column_id: 'todo', idea_id: data.id },
        { text: 'Implement authentication flow', column_id: 'inprogress', idea_id: data.id },
        { text: 'Create project repository', column_id: 'done', idea_id: data.id },
      ];

      const { error: cardsError } = await insertCardsRows(sampleCards);

      if (cardsError) {
        console.error('Error creating sample cards:', cardsError);
        showToast(formatSupabaseError(cardsError, 'Starter cards could not be created.'), 'warning');
      }

      // Refresh ideas to show the sample
      fetchIdeas();
    };

    fetchIdeas();
  }, []);

  useEffect(() => {
    if (!selectedIdeaId && ideas.length > 0) {
      setSelectedIdeaId(ideas[0].id);
    }
     if (ideas.length === 0) {
      setSelectedIdeaId(null);
    }
  }, [ideas, selectedIdeaId]);

  const handleAddIdea = async (title: string, summary: string) => {
    const { data, error } = await insertIdeaRow(title, summary);
    if (error) {
        console.error("Error adding idea:", error);
        showToast(formatSupabaseError(error, 'Failed to save idea.'), 'error');
        return { success: false, error: formatSupabaseError(error, 'Failed to save idea.') };
    }

    const newIdea: Idea = {
      id: data.id,
      title,
      summary,
      columns: DEFAULT_COLUMNS_CONFIG.map(col => ({ ...col, cards: [] })),
      createdAt: data.created_at,
    };
    setIdeas([newIdea, ...ideas]);
    setSelectedIdeaId(newIdea.id);
    setIsAddingNewIdea(false);
    showToast('Idea created successfully.', 'success');
    return { success: true };
  };

  const handleDeleteIdea = async (id: string) => {
    // Assuming cascade delete is set up in Supabase for cards
    const { error } = await deleteIdeaRow(id);
    if (error) {
        console.error("Error deleting idea:", error);
        showToast(formatSupabaseError(error, 'Failed to delete idea.'), 'error');
        return;
    }

    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    setIdeas(updatedIdeas);

    if (selectedIdeaId === id) {
      setSelectedIdeaId(updatedIdeas.length > 0 ? updatedIdeas[0].id : null);
    }
    showToast('Idea deleted.', 'success');
  };

  const handleAddCardToIdea = async (ideaId: string, columnId: string, cardText: string) => {
    const { data, error } = await insertCardRow(ideaId, columnId, cardText);
     if (error) {
        console.error("Error adding card:", error);
        showToast(formatSupabaseError(error, 'Failed to add card.'), 'error');
        return;
    }
    const newCard: Card = { id: data.id, text: data.text, createdAt: data.created_at, commentsCount: 0 };

    const updatedIdeas = ideas.map(idea => {
      if (idea.id === ideaId) {
        const updatedColumns = idea.columns.map(column => {
          if (column.id === columnId) {
            return { ...column, cards: [newCard, ...column.cards] };
          }
          return column;
        });
        return { ...idea, columns: updatedColumns };
      }
      return idea;
    });
    setIdeas(updatedIdeas);
  };
  
  const handleSaveEditedIdea = async (title: string, summary: string) => {
    if (!editingIdea) {
      return { success: false, error: 'No idea selected for editing.' };
    }
    const { error } = await updateIdeaRow(editingIdea.id, title, summary);
     if (error) {
        console.error("Error updating idea:", error);
        showToast(formatSupabaseError(error, 'Failed to update idea.'), 'error');
        return { success: false, error: formatSupabaseError(error, 'Failed to update idea.') };
    }
    setIdeas(ideas.map(idea => idea.id === editingIdea.id ? { ...idea, title, summary } : idea));
    setEditingIdea(null);
    showToast('Idea updated successfully.', 'success');
    return { success: true };
  };

  const handleMoveCard = async (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => {
    const originalIdeas = ideas;
    // Optimistic update
    let cardToMove: Card | undefined;
    const tempIdeas = ideas.map(idea => {
        if (idea.id === ideaId) {
            const newColumns = idea.columns.map(c => ({ ...c, cards: [...c.cards] }));
            const sourceCol = newColumns.find(c => c.id === sourceColumnId);
            const destCol = newColumns.find(c => c.id === destColumnId);

            if (!sourceCol || !destCol) return idea;

            const cardIndex = sourceCol.cards.findIndex(c => c.id === cardId);
            if (cardIndex > -1) {
                [cardToMove] = sourceCol.cards.splice(cardIndex, 1);
                if (cardToMove) {
                    destCol.cards.unshift(cardToMove);
                }
            }
            return { ...idea, columns: newColumns };
        }
        return idea;
    });
    setIdeas(tempIdeas);

    const { error } = await moveCardRow(cardId, destColumnId);
    if (error) {
        console.error("Failed to move card:", error);
        showToast(formatSupabaseError(error, 'Failed to move card.'), 'error');
        setIdeas(originalIdeas); // Revert on error
    }
  };

  const handleEditCard = async (cardId: string, newText: string, ideaId: string) => {
      const originalIdeas = ideas;
      // Optimistic update
      const tempIdeas = ideas.map(idea => {
          if (idea.id === ideaId) {
              const newColumns = idea.columns.map(column => ({
                  ...column,
                  cards: column.cards.map(card => card.id === cardId ? { ...card, text: newText } : card)
              }));
              return { ...idea, columns: newColumns };
          }
          return idea;
      });
      setIdeas(tempIdeas);

      const { error } = await updateCardTextRow(cardId, newText);
      if (error) {
          console.error("Failed to edit card:", error);
          showToast(formatSupabaseError(error, 'Failed to update card text.'), 'error');
          setIdeas(originalIdeas); // Revert
      }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    const originalIdeas = ideas;
    // Optimistic update
    const tempIdeas = ideas.map(idea => ({
      ...idea,
      columns: idea.columns.map(column => ({
        ...column,
        cards: column.cards.map(card => (
          card.id === cardId ? { ...card, ...updates } : card
        ))
      }))
    }));
    setIdeas(tempIdeas);

    // Also update the selected card context if this is the current card
    setSelectedCardContext(prev => {
      if (!prev || prev.card.id !== cardId) return prev;
      return {
        ...prev,
        card: { ...prev.card, ...updates },
      };
    });

    const dbUpdates = mapCardUpdatesToDb(updates);

    if (Object.keys(dbUpdates).length === 0) {
      return;
    }

    const { error } = await updateCardFieldsRow(cardId, dbUpdates);
    if (error) {
      console.error("Failed to update card:", error);
      const isMissingCardColumnError =
        (error as any)?.code === '42703' ||
        (typeof (error as any)?.message === 'string' &&
          (error as any).message.includes('column') &&
          (error as any).message.includes('"cards"'));

      if (isMissingCardColumnError) {
        showToast(
          'Cards schema is out of date. Run database/cards_due_dates_collaboration.sql in Supabase SQL Editor, then refresh schema.',
          'error'
        );
      } else {
        showToast(formatSupabaseError(error, 'Failed to update card details.'), 'error');
      }
      setIdeas(originalIdeas); // Revert on error
      // Also revert selected card context
      const originalIdea = originalIdeas.find(i => i.columns.some(c => c.cards.some(card => card.id === cardId)));
      if (originalIdea) {
        const originalCard = originalIdea.columns.flatMap(c => c.cards).find(c => c.id === cardId);
        if (originalCard && selectedCardContext?.card.id === cardId) {
          setSelectedCardContext(prev => prev ? { ...prev, card: originalCard } : null);
        }
      }
    }
  };

  const handleOpenCardDetail = (
    ideaId: string,
    ideaTitle: string,
    columnId: string,
    columnTitle: string,
    card: Card
  ) => {
    setSelectedCardContext({ ideaId, ideaTitle, columnId, columnTitle, card });
  };

  const handleCloseCardDetail = () => setSelectedCardContext(null);

  const handleIncrementCardCommentCount = (cardId: string) => {
    setIdeas(prevIdeas => prevIdeas.map(idea => ({
      ...idea,
      columns: idea.columns.map(column => ({
        ...column,
        cards: column.cards.map(card => (
          card.id === cardId
            ? { ...card, commentsCount: (card.commentsCount || 0) + 1 }
            : card
        )),
      })),
    })));

    setSelectedCardContext(prev => {
      if (!prev || prev.card.id !== cardId) return prev;
      return {
        ...prev,
        card: { ...prev.card, commentsCount: (prev.card.commentsCount || 0) + 1 },
      };
    });
  };

  useEffect(() => {
    if (!selectedCardContext) return;
    const idea = ideas.find((i) => i.id === selectedCardContext.ideaId);
    if (!idea) {
      setSelectedCardContext(null);
      return;
    }
    const column = idea.columns.find((c) => c.id === selectedCardContext.columnId);
    if (!column) {
      setSelectedCardContext(null);
      return;
    }
    const latestCard = column.cards.find((c) => c.id === selectedCardContext.card.id);
    if (!latestCard) {
      setSelectedCardContext(null);
      return;
    }
    if (
      latestCard.text !== selectedCardContext.card.text ||
      column.title !== selectedCardContext.columnTitle ||
      idea.title !== selectedCardContext.ideaTitle
    ) {
      setSelectedCardContext({
        ideaId: idea.id,
        ideaTitle: idea.title,
        columnId: column.id,
        columnTitle: column.title,
        card: latestCard,
      });
    }
  }, [ideas, selectedCardContext]);

  return (
    <div className="app-shell">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-surface-elevated/95 border border-border rounded-lg text-text-primary hover:bg-surface-overlay transition-colors"
        aria-label="Open menu"
      >
        <Icon name="menu" className="w-6 h-6" />
      </button>

      <Sidebar
        ideas={ideas}
        selectedIdeaId={selectedIdeaId}
        onSelectIdea={(id) => {
          setSelectedIdeaId(id);
          setIsMobileSidebarOpen(false);
        }}
        onNewIdea={() => setIsAddingNewIdea(true)}
        onDeleteIdea={handleDeleteIdea}
        onOpenClaudeChat={isClaudeAvailable !== false ? () => setIsClaudePanelOpen(true) : undefined}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <IdeaDetail
        idea={selectedIdea}
        onAddCard={handleAddCardToIdea}
        onStartEdit={setEditingIdea}
        onMoveCard={handleMoveCard}
        onEditCard={handleEditCard}
        onOpenCardDetail={handleOpenCardDetail}
        onCreateIdea={() => setIsAddingNewIdea(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsHelpOpen(true)}
      />

      {/* Modals */}
      <AnimatePresence mode="wait">
        {isAddingNewIdea && (
          <IdeaForm
            key="add-idea"
            onSave={handleAddIdea}
            onClose={() => setIsAddingNewIdea(false)}
          />
        )}
        {editingIdea && (
          <IdeaForm
            key="edit-idea"
            onSave={handleSaveEditedIdea}
            onClose={() => setEditingIdea(null)}
            idea={editingIdea}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCardContext && (
          <CardDetailModal
            card={selectedCardContext.card}
            idea={selectedIdea!}
            columnTitle={selectedCardContext.columnTitle}
            ideaId={selectedCardContext.ideaId}
            ideaTitle={selectedCardContext.ideaTitle}
            columnId={selectedCardContext.columnId}
            onCommentAdded={handleIncrementCardCommentCount}
            onCardUpdate={handleUpdateCard}
            onAddCard={handleAddCardToIdea}
            onMoveCard={handleMoveCard}
            onClose={handleCloseCardDetail}
          />
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <Suspense fallback={null}>
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          ideas={ideas}
          onSelectCard={(ideaId, columnId, cardId) => {
            const idea = ideas.find((i) => i.id === ideaId);
            if (!idea) return;
            const column = idea.columns.find((c) => c.id === columnId);
            if (!column) return;
            const card = column.cards.find((c) => c.id === cardId);
            if (!card) return;
            setSelectedIdeaId(ideaId);
            handleOpenCardDetail(ideaId, idea.title, columnId, column.title, card);
          }}
          onSelectIdea={(ideaId) => setSelectedIdeaId(ideaId)}
        />
      </Suspense>

      {/* Keyboard Shortcuts Help Modal */}
      <Suspense fallback={null}>
        <KeyboardShortcutsHelp
          isOpen={isShortcutsHelpOpen}
          onClose={() => setIsShortcutsHelpOpen(false)}
        />
      </Suspense>

      {/* Claude Chat Panel */}
      <Suspense fallback={null}>
        <AnimatePresence>
          {isClaudePanelOpen && (
            <ClaudeChatPanel
              ideas={ideas}
              selectedIdea={selectedIdea}
              onAddCard={handleAddCardToIdea}
              onMoveCard={handleMoveCard}
              onClose={() => setIsClaudePanelOpen(false)}
            />
          )}
        </AnimatePresence>
      </Suspense>

      {/* Onboarding Tour */}
      {showTour && <OnboardingTour onComplete={completeTour} />}
    </div>
  );
}

export default App;
